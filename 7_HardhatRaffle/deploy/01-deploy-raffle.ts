import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const FUND_AMOUNT = "100000000000000000000";

const deployRaffle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network, ethers } = hre;
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  let vrfCoordinatorV2Address: string;
  let subscriptionId: string;
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    // Fund the subscription
    // Our mock makes it so we don't actually have to worry about sending fund
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[network.name].vrfCoordinatorV2!;
    subscriptionId = networkConfig[network.name].subscriptionId!;
  }

  const args = [
    vrfCoordinatorV2Address,
    networkConfig[network.name].raffleEntranceFee,
    networkConfig[network.name].gasLane,
    subscriptionId,
    networkConfig[network.name].callbackGasLimit,
    networkConfig[network.name].keepersUpdateInterval,
  ];

  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: developmentChains.includes(network.name)
      ? 1
      : VERIFICATION_BLOCK_CONFIRMATIONS,
  });

  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...");
    await verify(raffle.address, args);
  }

  log("Run Price Feed contract with command:");
  const networkName = network.name == "hardhat" ? "localhost" : network.name;
  log(`yarn hardhat run scripts/enterRaffle.js --network ${networkName}`);
  log("----------------------------------------------------");
};

deployRaffle.tags = ["all", "raffle"];

export default deployRaffle;
