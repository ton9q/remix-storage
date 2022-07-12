import { ethers, run, network } from "hardhat";

async function main() {
  const SimpleStorageFactoryy = await ethers.getContractFactory(
    "SimpleStorage"
  );
  console.log("Deploying contract...");
  const simpleStorage = await SimpleStorageFactoryy.deploy();
  await simpleStorage.deployed();

  if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
    await simpleStorage.deployTransaction.wait(6);
    await verify(simpleStorage.address, []);
  }

  console.log(`Deployed contract at ${simpleStorage.address}`);

  const currentValue = await simpleStorage.retrieve();
  console.log(`Current value: ${currentValue}`);

  console.log("Updating contract...");
  const transactionResponse = await simpleStorage.store(9);
  await transactionResponse.wait(1);
  const updatedValue = await simpleStorage.retrieve();
  console.log(`Current value: ${updatedValue}`);
}

async function verify(contractAddress: string, args: any[]) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
