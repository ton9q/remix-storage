import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { network, deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", function () {
      let raffleContract: Raffle;
      let raffle: Raffle;
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;

      let raffleEntranceFee: BigNumber;
      let interval: number;
      let player: SignerWithAddress;
      let accounts: SignerWithAddress[];

      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        //   deployer = accounts[0]
        player = accounts[1];
        await deployments.fixture(["all"]);

        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        raffleContract = await ethers.getContract("Raffle");
        raffle = raffleContract.connect(player);

        raffleEntranceFee = await raffle.getEntranceFee();
        interval = (await raffle.getInterval()).toNumber();
      });

      describe("constructor", function () {
        it("initializes the raffle correctly", async () => {
          const raffleState = (await raffle.getRaffleState()).toString();
          assert.equal(raffleState, "0");
          assert.equal(interval.toString(), networkConfig[network.name].keepersUpdateInterval);
        });
      });

      describe("enterRaffle", function () {
        it("reverts when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
            raffle,
            "Raffle__SendMoreToEnterRaffle"
          );
        });

        it("records player when they enter", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const contractPlayer = await raffle.getPlayer(0);
          assert.equal(player.address, contractPlayer);
        });

        it("emits event on enter", async () => {
          await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
            raffle,
            "RaffleEnter"
          );
        });

        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          // we pretend to be a keeper for a second
          await raffle.performUpkeep([]);
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWithCustomError(raffle, "Raffle__RaffleNotOpen");
        });
      });

      describe("checkUpkeep", function () {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });

        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await raffle.performUpkeep([]);
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert.equal(raffleState.toString() === "1", upkeepNeeded === false);
        });

        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval - 2]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });

        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", function () {
        it("can only run if checkUpkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await raffle.performUpkeep("0x");
          assert(tx);
        });

        it("reverts if checkup is false", async () => {
          await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(
            raffle,
            "Raffle__UpkeepNotNeeded"
          );
        });

        it("updates the raffle state and emits a requestId", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const txResponse = await raffle.performUpkeep("0x");
          const txReceipt = await txResponse.wait(1);
          const raffleState = await raffle.getRaffleState();
          const requestId = txReceipt.events![1].args!.requestId;
          assert(requestId.toNumber() > 0);
          assert(raffleState === 1);
        });
      });

      describe("fulfillRandomWords", function () {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });

        it("can only be called after performUpkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWith("nonexistent request");
        });

        it("picks a winner, resets, and sends money", async () => {
          const additionalEntrances = 3;
          const startingIndex = 2;
          for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
            raffle = raffleContract.connect(accounts[i]);
            await raffle.enterRaffle({ value: raffleEntranceFee });
          }
          const startingTimeStamp = await raffle.getLastTimeStamp();

          await new Promise<void>(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
              //   console.log("WinnerPicked event fired!");
              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerBalance = await accounts[2].getBalance();
                const endingTimeStamp = await raffle.getLastTimeStamp();

                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[2].address);
                assert.equal(raffleState, 0);
                assert.equal(
                  winnerBalance.toString(),
                  startingBalance
                    .add(raffleEntranceFee.mul(additionalEntrances).add(raffleEntranceFee))
                    .toString()
                );
                assert(endingTimeStamp > startingTimeStamp);

                resolve();
              } catch (e) {
                reject(e);
              }
            });

            const tx = await raffle.performUpkeep("0x");
            const txReceipt = await tx.wait(1);
            const startingBalance = await accounts[2].getBalance();
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txReceipt.events![1].args!.requestId,
              raffle.address
            );
          });
        });
      });
    });
