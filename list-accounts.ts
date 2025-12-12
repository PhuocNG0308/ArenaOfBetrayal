import { ethers } from "hardhat";

async function main() {
  console.log("Generating addresses from MNEMONIC...");
  
  // Get all signers configured for the network
  const signers = await ethers.getSigners();
  
  console.log(`Found ${signers.length} accounts:\n`);

  for (let i = 0; i < signers.length; i++) {
    const address = signers[i].address;
    try {
      const balance = await ethers.provider.getBalance(address);
      console.log(`Account #${i}: ${address} | Balance: ${ethers.formatEther(balance)} ETH`);
    } catch (e) {
      console.log(`Account #${i}: ${address} | Balance: Error fetching`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
