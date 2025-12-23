import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x63bf4C43a6Eb92C4c4e636f0B721426F92dA8d2e";
  const contract = await ethers.getContractAt("PrisonersDilemma", contractAddress);
  
  console.log("=== Tournament Status Check ===\n");
  
  // Current tournament info
  const currentInfo = await contract.getTournamentInfo();
  console.log("Current Tournament Info:");
  console.log("  - ID:", currentInfo.tournamentId.toString());
  console.log("  - Status:", ["Registration", "PendingComputation", "ResultsPublished", "Finished"][Number(currentInfo.status)]);
  console.log("  - Player Count:", currentInfo.playerCount.toString());
  console.log("  - Prize Pool:", ethers.formatEther(currentInfo.prizePool), "ETH");
  console.log("");
  
  // Last finished tournament ID
  const lastFinishedId = await contract.getLastFinishedTournamentId();
  console.log("Last Finished Tournament ID:", lastFinishedId.toString());
  console.log("");
  
  // Check tournament 0 specifically
  console.log("=== Tournament 0 Details ===");
  try {
    const tournament0 = await contract.getTournament(0);
    console.log("Tournament 0 Info:");
    console.log("  - ID:", tournament0.tournamentId.toString());
    console.log("  - Status:", ["Registration", "PendingComputation", "ResultsPublished", "Finished"][Number(tournament0.status)]);
    console.log("  - Player Count:", tournament0.playerCount.toString());
    console.log("  - Prize Pool:", ethers.formatEther(tournament0.prizePool), "ETH");
  } catch (e) {
    console.log("Error getting tournament 0:", e);
  }
  console.log("");
  
  // Check if results published
  const resultsPublished = await contract.isResultsPublished(0);
  console.log("Tournament 0 Results Published:", resultsPublished);
  
  // Check players
  const players = await contract.getTournamentPlayers(0);
  console.log("Tournament 0 Players:", players);
  
  if (resultsPublished && players.length > 0) {
    console.log("\n=== Player Scores ===");
    for (const player of players) {
      const score = await contract.getPlayerScore(0, player);
      console.log(`  ${player}: ${score.toString()} points`);
    }
    
    console.log("\n=== Winners ===");
    const [winners, prizes] = await contract.getTournamentWinners(0);
    for (let i = 0; i < winners.length; i++) {
      console.log(`  ${winners[i]}: ${ethers.formatEther(prizes[i])} ETH`);
      
      // Check claimable status
      const [amount, claimed] = await contract.getClaimablePrize(0, winners[i]);
      console.log(`    -> Claimable: ${ethers.formatEther(amount)} ETH, Claimed: ${claimed}`);
    }
  }
}

main().catch(console.error);
