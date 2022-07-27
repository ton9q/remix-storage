import { ethers } from "hardhat";
import { Raffle } from "../typechain-types";

async function main() {
  const raffle: Raffle = await ethers.getContract("Raffle");

  console.log(`Got contract Raffle at ${raffle.address}`);

  const entranceFee = await raffle.getEntranceFee();
  await raffle.enterRaffle({ value: entranceFee });

  console.log("Entered!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
