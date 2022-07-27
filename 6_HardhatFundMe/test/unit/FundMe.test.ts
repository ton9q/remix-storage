import { expect } from "chai";
import { deployments, ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe: FundMe;
      let deployer: SignerWithAddress;
      let mockV3Aggregator: MockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async () => {
        // deployerAddress = (await getNamedAccounts()).deployer;
        const accounts = await ethers.getSigners();
        deployer = accounts[0];

        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer.address);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer.address
        );
      });

      describe("constructor", () => {
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed();
          expect(response).to.equal(mockV3Aggregator.address);
        });
      });

      describe("fund", () => {
        it("fails when you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updates the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(
            deployer.address
          );

          expect(response.toString()).to.equal(sendValue.toString());
        });

        it("adds funder to array of funders", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunder(0);
          expect(response).to.equal(deployer.address);
        });
      });

      describe("withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it("gives a single funder all their ETH back", async () => {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          expect(endingFundMeBalance).to.equal(0);
          expect(startingFundMeBalance.add(startingDeployerBalance)).to.equal(
            endingDeployerBalance.add(gasCost)
          );
        });

        it("is allows us to withdraw with multiple funders", async () => {
          // Arrange
          const accounts = await ethers.getSigners();
          const numberOfAccounts = 5;

          for (let i = 0; i < numberOfAccounts; i++) {
            await fundMe.connect(accounts[i]).fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          const transactionResponse = await fundMe.cheaperWithdraw();
          //   const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
          console.log(`GasCost: ${withdrawGasCost}`);
          console.log(`GasUsed: ${gasUsed}`);
          console.log(`GasPrice: ${effectiveGasPrice}`);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          expect(endingFundMeBalance).to.equal(0);
          expect(startingFundMeBalance.add(startingDeployerBalance)).to.equal(
            endingDeployerBalance.add(withdrawGasCost)
          );
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 0; i < numberOfAccounts; i++) {
            expect(
              await fundMe.getAddressToAmountFunded(accounts[i].address)
            ).to.equal(0);
          }
        });

        it("only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(accounts[1]);

          await expect(
            fundMeConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(
            fundMeConnectedContract,
            "FundMe__NotOwner"
          );
        });
      });
    });
