import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains } from "../helper-hardhat-config";

const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 is this the premium in LINK
const GAS_PRICE_LINK = 1e9;

const deployMocks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });

    log("Mocks Deployed!");
    log("----------------------------------");
    log("You are deploying to a local network, you'll need a local network running to interact");
    log(
      "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!"
    );
    log("----------------------------------");
  }
};

deployMocks.tags = ["all", "mocks"];

export default deployMocks;
