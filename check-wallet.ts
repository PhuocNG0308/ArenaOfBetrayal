import { ethers, getNamedAccounts } from "hardhat";

async function main() {
  const { deployer } = await getNamedAccounts();
  console.log("Deployer Address:", deployer);
  
  try {
    const balance = await ethers.provider.getBalance(deployer);
    console.log("Current Balance:", ethers.formatEther(balance), "ETH");
  } catch (e) {
    console.log("Could not fetch balance (network might be down or invalid config)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
