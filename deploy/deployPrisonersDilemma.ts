import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("PrisonersDilemma", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default func;
func.id = "deploy_prisoners_dilemma";
func.tags = ["PrisonersDilemma"];
