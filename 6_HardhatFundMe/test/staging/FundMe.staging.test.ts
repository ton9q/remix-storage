import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FundMe } from "../../typechain-types";
import { developmentChains } from "../../helper-hardhat-config";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging", () => {
      let fundMe: FundMe;
      let deployer: SignerWithAddress;
      const sendValue = ethers.utils.parseEther("0.05");

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        fundMe = await ethers.getContract("FundMe", deployer.address);
      });

      it("allows people to fund and withdraw", async () => {
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );

        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw({
          gasLimit: 100000,
        });

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );

        console.log(
          endingFundMeBalance.toString() +
            " should equal 0, running assert equal..."
        );

        expect(endingFundMeBalance.toString()).to.equal("0");
      });
    });
