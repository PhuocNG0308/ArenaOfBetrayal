import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("PrisonersDilemma", {
    from: deployer,
    log: true,
    gasLimit: 8000000, // Set explicit gas limit for FHE operations
  });

  console.log(`PrisonersDilemma contract deployed at: ${deployed.address}`);
  console.log("\nNew Features:");
  console.log("- ✅ Zama FHE encryption (fully homomorphic encryption)");
  console.log("- ✅ Offchain Oracle computation for gas optimization");
  console.log("- ✅ 0.01 ETH entry fee with prize distribution");
  console.log("- ✅ Top 30% winners share prize pool (progressive rewards)");
  console.log("- ✅ DAO voting system (50% quorum to start tournament)");
  console.log("- ✅ Gas optimized: MAX_RULES=10, DEFAULT_ROUNDS=50");
  console.log("- ✅ Complete privacy: strategies encrypted until reveal");
};

export default func;
func.tags = ["PrisonersDilemma"];
