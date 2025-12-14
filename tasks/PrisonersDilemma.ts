import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

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

task("pd:submit-strategy")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .addOptionalParam("strategy", "Strategy name: tit-for-tat, always-defect, always-cooperate, grudger", "tit-for-tat")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, strategy } = taskArguments;

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    // Initialize Zama SDK
    const { createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk");
    const instance = await createInstance(SepoliaConfig);

    let rules: Array<{ subject: number; operator: number; value: number; action: number }> = [];
    let defaultAction = Choice.Cooperate;

    switch (strategy.toLowerCase()) {
      case "tit-for-tat":
        rules = [
          {
            subject: ConditionSubject.OpponentLastMove,
            operator: ConditionOperator.Is,
            value: Choice.Defect,
            action: Choice.Defect,
          },
        ];
        defaultAction = Choice.Cooperate;
        break;

      case "always-defect":
        rules = [];
        defaultAction = Choice.Defect;
        break;

      case "always-cooperate":
        rules = [];
        defaultAction = Choice.Cooperate;
        break;

      case "grudger":
        rules = [
          {
            subject: ConditionSubject.OpponentTotalDefects,
            operator: ConditionOperator.GreaterThan,
            value: 0,
            action: Choice.Defect,
          },
        ];
        defaultAction = Choice.Cooperate;
        break;

      default:
        throw new Error(`Unknown strategy: ${strategy}. Available: tit-for-tat, always-defect, always-cooperate, grudger`);
    }

    // Encrypt actions
    const input = instance.createEncryptedInput(contractAddress, signer.address);
    input.add8(defaultAction);
    for (const rule of rules) {
      input.add8(rule.action);
    }
    const { inputProof } = await input.encrypt();

    // Prepare other arguments
    const subjects = rules.map(r => r.subject);
    const operators = rules.map(r => r.operator);
    const values = rules.map(r => r.value);

    const tx = await contract.connect(signer).submitStrategy(
      inputProof,
      subjects,
      operators,
      values,
      { value: ethers.parseEther("0.01") }
    );
    await tx.wait();
    console.log("Strategy submitted successfully!");
  });

task("pd:get-strategy")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .addParam("player", "Address of the player")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, player } = taskArguments;

    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    const [subjects, operators, values, isSubmitted] = await contract.getStrategy(player);

    if (!isSubmitted) {
      console.log("Player has not submitted a strategy yet");
      return;
    }

    console.log("Player has submitted a strategy");
    console.log(`Rules count: ${subjects.length}`);
    
    for(let i = 0; i < subjects.length; i++) {
      console.log(`Rule ${i+1}: If ${ConditionSubject[Number(subjects[i])]} ${ConditionOperator[Number(operators[i])]} ${values[i]} THEN [Encrypted]`);
    }
  });

task("pd:set-rounds")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .addParam("rounds", "Number of rounds per game (10-1000)")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, rounds } = taskArguments;

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    const tx = await contract.connect(signer).setTournamentRounds(parseInt(rounds));
    await tx.wait();
    console.log(`Tournament rounds set to ${rounds}`);
  });

task("pd:vote-start")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress } = taskArguments;

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    const tx = await contract.connect(signer).voteStartTournament();
    await tx.wait();
    console.log("Voted to start tournament successfully");
  });

task("pd:force-start")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress } = taskArguments;

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    const tx = await contract.connect(signer).forceStartTournament();
    await tx.wait();
    console.log("Tournament force started successfully");
  });

task("pd:tournament-info")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress } = taskArguments;

    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    await contract.getTournamentInfo();
    console.log("Tournament info retrieved successfully");
  });

task("pd:get-tournament")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .addParam("tournamentid", "Tournament ID")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, tournamentid } = taskArguments;

    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    await contract.getTournament(tournamentid);
    console.log(`Tournament ${tournamentid} info retrieved successfully`);
  });

task("pd:get-players")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .addParam("tournamentid", "Tournament ID")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, tournamentid } = taskArguments;

    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    await contract.getTournamentPlayers(tournamentid);
    console.log(`Players for tournament ${tournamentid} retrieved successfully`);
  });

task("pd:get-player-score")
  .addParam("contract", "Address of the PrisonersDilemma contract")
  .addParam("tournamentid", "Tournament ID")
  .addParam("player", "Player address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, tournamentid, player } = taskArguments;

    const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);

    await contract.getPlayerScore(tournamentid, player);
    console.log(`Score for player ${player} in tournament ${tournamentid} retrieved successfully`);
  });
