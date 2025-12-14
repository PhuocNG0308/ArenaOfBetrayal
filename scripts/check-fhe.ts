import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractFactory("PrisonersDilemma");
  const contract = await factory.deploy();
  console.log("Contract deployed to:", await contract.getAddress());

  // Try to call a function that uses FHE.asEuint8
  // We can use submitStrategy but with empty arrays to just test the defaultAction part
  try {
    const tx = await contract.submitStrategy([], 0, [], [], [], { value: ethers.parseEther("0.01") });
    await tx.wait();
    console.log("submitStrategy success");
  } catch (e) {
    console.error("submitStrategy failed:", e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
