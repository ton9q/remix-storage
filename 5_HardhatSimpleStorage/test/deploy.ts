import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleStorage, SimpleStorage__factory } from "../typechain-types";

describe("SimpleStorage", function () {
  let simpleStorage: SimpleStorage;

  beforeEach(async () => {
    const SimpleStorageFactory = (await ethers.getContractFactory(
      "SimpleStorage"
    )) as SimpleStorage__factory;
    simpleStorage = await SimpleStorageFactory.deploy();
  });

  it("should start with a favorite number of 0", async function () {
    let currentValue = await simpleStorage.retrieve();
    expect(currentValue).to.equal(0);
  });

  it("should update when we call store", async function () {
    let expectedValue = 9;
    let transactionResponse = await simpleStorage.store(expectedValue);
    await transactionResponse.wait();

    let currentValue = await simpleStorage.retrieve();
    expect(currentValue).to.equal(expectedValue);
  });
});
