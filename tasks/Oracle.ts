import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Enum definitions matching the contract
enum Choice {
  Cooperate = 0,
  Defect = 1,
}

enum ConditionSubject {
  RoundNumber = 0,
  MyLastMove = 1,
  OpponentLastMove = 2,
  MyTotalDefects = 3,
  OpponentTotalDefects = 4,
  OpponentTotalCooperates = 5,
}

enum ConditionOperator {
  Is = 0,
  IsNot = 1,
  GreaterThan = 2,
  LessThan = 3,
  Equals = 4,
}

// Payoff matrix
const SCORES = {
  BOTH_COOPERATE: 3,
  BOTH_DEFECT: 1,
  TEMPTATION: 5, // Defector gets this
  SUCKER: 0,     // Cooperator gets this
};

interface PlayerStrategy {
  address: string;
  rules: {
    subject: number;
    operator: number;
    value: number;
  }[];
  actions: {
    defaultAction: number;
    ruleActions: number[];
  };
}

task("pd:run-oracle", "Runs the off-chain oracle to compute tournament results")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .setAction(async function (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const { contract: contractAddress } = taskArguments;
    const [signer] = await ethers.getSigners();
    
    console.log(`Starting Oracle service using account: ${signer.address}`);
    
    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);
    
    // Check if we are the oracle
    const oracleAddress = await contract.computationOracle();
    if (oracleAddress.toLowerCase() !== signer.address.toLowerCase()) {
      console.error(`Error: Signer ${signer.address} is not the registered oracle (${oracleAddress})`);
      return;
    }

    // Initialize Zama SDK for decryption
    // Note: In a real node environment, we would use the node's private key to decrypt.
    // Here we use the relayer-sdk to perform user-decryption (re-encryption) since the contract allowed us.
    // Use /node subpath as per package.json exports
    const { createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/node");
    const instance = await createInstance(SepoliaConfig);

    console.log("Waiting for tournament to be in PendingComputation state...");

    // Poll for status
    while (true) {
      const info = await contract.getTournamentInfo();
      // Status: 0=Registration, 1=PendingComputation, 2=ResultsPublished, 3=Finished
      const status = Number(info.status);
      
      if (status === 1) { // PendingComputation
        console.log(`Tournament ${info.tournamentId} is pending computation. Starting processing...`);
        await processTournament(hre, contract, instance, signer, info);
        console.log("Processing complete. Waiting for next tournament...");
      } else if (status === 0) {
        console.log(`Tournament ${info.tournamentId} is in Registration phase. Waiting...`);
      } else {
        console.log(`Tournament ${info.tournamentId} is Finished/Published. Waiting for new tournament...`);
      }
      
      // Wait 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  });

async function processTournament(hre: HardhatRuntimeEnvironment, contract: any, instance: any, signer: any, info: any) {
  const { ethers } = hre;
  const tournamentId = info.tournamentId;
  const rounds = Number(info.rounds);
  
  console.log(`Fetching players for tournament ${tournamentId}...`);
  const players = await contract.getTournamentPlayers(tournamentId);
  console.log(`Found ${players.length} players:`, players);

  if (players.length < 2) {
    console.log("Not enough players to compute.");
    return;
  }

  const strategies: PlayerStrategy[] = [];

  // 1. Fetch and Decrypt Strategies
  for (const player of players) {
    console.log(`Fetching strategy for ${player}...`);
    try {
      const result = await contract.getEncryptedStrategyForComputation(player);
      const { encryptedActionsHandle, subjects, operators, values } = result;

      // Decrypt actions
      // We use re-encryption via the SDK
      // Generate a temporary keypair for re-encryption
      const keypair = instance.generateKeypair();
      
      // The SDK documentation shows createEIP712 takes (publicKey, contractAddress) OR (publicKey, contractAddresses, timestamp, duration)
      // The error "contractAddresses.every is not a function" suggests it expects an array but got a string, or vice versa depending on overload.
      // Let's follow the User Decryption guide exactly.
      
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '1';
      // contract.target is a string or Addressable. Ensure it's a string address.
      const contractAddressStr = await contract.getAddress();
      const contractAddresses = [contractAddressStr];
      
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses, // Must be an array of strings
        startTimeStamp,
        durationDays
      );
      
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      
      const handleHex = encryptedActionsHandle;
      
      const decryptResult = await instance.userDecrypt(
        [{ handle: handleHex, contractAddress: contractAddressStr }],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        signer.address,
        startTimeStamp,
        durationDays
      );
      
      // decryptResult is { [handle]: value }
      // The value is the packed uint128.
      const packedActions = BigInt(decryptResult[handleHex]);
      
      // Unpack actions
      // defaultAction (8 bits) | rule0 (8 bits) | ...
      const defaultAction = Number(packedActions & 0xFFn);
      const ruleActions: number[] = [];
      
      // We have subjects.length rules
      for (let i = 0; i < subjects.length; i++) {
        const action = Number((packedActions >> BigInt(8 * (i + 1))) & 0xFFn);
        ruleActions.push(action);
      }
      
      strategies.push({
        address: player,
        rules: subjects.map((s: any, i: number) => ({
          subject: Number(s),
          operator: Number(operators[i]),
          value: Number(values[i])
        })),
        actions: {
          defaultAction,
          ruleActions
        }
      });
      
      console.log(`Decrypted strategy for ${player}: Default=${Choice[defaultAction]}, Rules=${subjects.length}`);

    } catch (e) {
      console.error(`Failed to decrypt strategy for ${player}:`, e);
      // If we fail to decrypt, we might have to skip or disqualify. 
      // For now, let's treat as Always Defect or similar fallback?
      // Or just rethrow to stop.
      console.error("Stopping computation due to decryption failure.");
      return;
    }
  }

  // 2. Simulate Tournament
  console.log("Simulating tournament...");
  const scores: { [address: string]: number } = {};
  players.forEach((p: string) => scores[p] = 0);

  // Round Robin: Every player plays against every other player
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];
      const s1 = strategies.find(s => s.address === p1)!;
      const s2 = strategies.find(s => s.address === p2)!;
      
      const { score1, score2 } = playMatch(s1, s2, rounds);
      scores[p1] += score1;
      scores[p2] += score2;
      
      console.log(`Match ${p1.slice(0,6)} vs ${p2.slice(0,6)}: ${score1}-${score2}`);
    }
  }

  // 3. Determine Winners and Prizes
  console.log("Final Scores:", scores);
  
  const sortedPlayers = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const playerScores = players.map((p: string) => scores[p]);
  
  // Logic for winners: Top 30%?
  // The contract just takes winners array and prizes array.
  // Let's implement a simple logic: Proportional distribution among top 30%
  
  const winnerCount = Math.max(1, Math.ceil(players.length * 0.3)); // Top 30%
  const winners = sortedPlayers.slice(0, winnerCount).map(([p]) => p);
  
  // Calculate prizes
  // Total prize pool is in contract. We don't know exact amount here easily without querying, 
  // but we can just calculate shares (percentages) or absolute amounts if we fetch balance.
  // Actually `publishResults` takes `prizes` (amounts).
  // We should check the contract balance or `prizePool` var.
  const prizePool = info.prizePool; // This is BigInt
  
  // Simple distribution: Proportional to score among winners
  const totalWinnerScore = winners.reduce((sum, w) => sum + scores[w], 0);
  const prizes = winners.map(w => {
    if (totalWinnerScore === 0) return prizePool / BigInt(winners.length); // Equal split if all 0
    return (prizePool * BigInt(scores[w])) / BigInt(totalWinnerScore);
  });
  
  // Handle dust (remaining wei) - give to first winner
  const totalDistributed = prizes.reduce((sum, p) => sum + p, 0n);
  if (totalDistributed < prizePool && prizes.length > 0) {
    prizes[0] += (prizePool - totalDistributed);
  }

  console.log("Winners:", winners);
  console.log("Prizes:", prizes.map(p => ethers.formatEther(p)));

  // 4. Publish Results
  console.log("Publishing results to chain...");
  try {
    // Ethers v6 might have issues with Proxy objects returned from contract calls (like 'players' array)
    // when trying to modify or pass them back.
    // Let's create clean copies of the arrays.
    const cleanPlayers = [...players];
    const cleanScores = [...playerScores];
    const cleanWinners = [...winners];
    const cleanPrizes = [...prizes];

    const tx = await contract.connect(signer).publishResults(
      tournamentId,
      cleanPlayers,
      cleanScores,
      cleanWinners,
      cleanPrizes
    );
    await tx.wait();
    console.log("Results published successfully!");
  } catch (e) {
    console.error("Failed to publish results:", e);
  }
}

function playMatch(p1: PlayerStrategy, p2: PlayerStrategy, rounds: number): { score1: number, score2: number } {
  let score1 = 0;
  let score2 = 0;
  
  // History tracking
  let p1Moves: number[] = [];
  let p2Moves: number[] = [];
  
  for (let r = 0; r < rounds; r++) {
    const move1 = getMove(p1, r, p1Moves, p2Moves);
    const move2 = getMove(p2, r, p2Moves, p1Moves); // Note: for p2, p2 is "me", p1 is "opponent"
    
    p1Moves.push(move1);
    p2Moves.push(move2);
    
    // Scoring
    if (move1 === Choice.Cooperate && move2 === Choice.Cooperate) {
      score1 += SCORES.BOTH_COOPERATE;
      score2 += SCORES.BOTH_COOPERATE;
    } else if (move1 === Choice.Defect && move2 === Choice.Defect) {
      score1 += SCORES.BOTH_DEFECT;
      score2 += SCORES.BOTH_DEFECT;
    } else if (move1 === Choice.Defect && move2 === Choice.Cooperate) {
      score1 += SCORES.TEMPTATION;
      score2 += SCORES.SUCKER;
    } else { // p1 Cooperate, p2 Defect
      score1 += SCORES.SUCKER;
      score2 += SCORES.TEMPTATION;
    }
  }
  
  return { score1, score2 };
}

function getMove(player: PlayerStrategy, round: number, myMoves: number[], oppMoves: number[]): number {
  // Check rules in order
  for (let i = 0; i < player.rules.length; i++) {
    const rule = player.rules[i];
    const action = player.actions.ruleActions[i];
    
    if (evaluateCondition(rule, round, myMoves, oppMoves)) {
      return action;
    }
  }
  
  // Default action
  return player.actions.defaultAction;
}

function evaluateCondition(rule: { subject: number, operator: number, value: number }, round: number, myMoves: number[], oppMoves: number[]): boolean {
  let subjectValue = 0;
  
  switch (rule.subject) {
    case ConditionSubject.RoundNumber:
      subjectValue = round; // 0-based or 1-based? Contract usually implies counter. Let's use 0-based matching logic or 1-based?
      // If user says "Round > 0", they mean after first round.
      // Let's assume round is 0-indexed here.
      break;
      
    case ConditionSubject.MyLastMove:
      if (round === 0) return false; // No last move
      subjectValue = myMoves[round - 1];
      break;
      
    case ConditionSubject.OpponentLastMove:
      if (round === 0) return false;
      subjectValue = oppMoves[round - 1];
      break;
      
    case ConditionSubject.MyTotalDefects:
      subjectValue = myMoves.filter(m => m === Choice.Defect).length;
      break;
      
    case ConditionSubject.OpponentTotalDefects:
      subjectValue = oppMoves.filter(m => m === Choice.Defect).length;
      break;
      
    case ConditionSubject.OpponentTotalCooperates:
      subjectValue = oppMoves.filter(m => m === Choice.Cooperate).length;
      break;
      
    default:
      return false;
  }
  
  // Check operator
  switch (rule.operator) {
    case ConditionOperator.Is: // For moves
      return subjectValue === rule.value;
    case ConditionOperator.IsNot:
      return subjectValue !== rule.value;
    case ConditionOperator.GreaterThan:
      return subjectValue > rule.value;
    case ConditionOperator.LessThan:
      return subjectValue < rule.value;
    case ConditionOperator.Equals:
      return subjectValue === rule.value;
    default:
      return false;
  }
}
