import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const deployFundMe: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  let ethUsdPriceFeedAddress: string;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed!;
  }

  log("----------------------------------------------------");
  log("Deploying FundMe and waiting for confirmations...");

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  });

  log(`FundMe deployed at ${fundMe.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress]);
  }
};

deployFundMe.tags = ["all", "fundMe"];

export default deployFundMe;
