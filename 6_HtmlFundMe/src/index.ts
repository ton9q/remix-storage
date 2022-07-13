import {
  ExternalProvider,
  Provider,
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import { MetaMaskInpageProvider } from "@metamask/providers";
// @ts-ignore
import { ethers } from "../libs/ethers-5.6.esm.min.js";
import { contractAddress, abi } from "./constants";

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
  }
}

async function main() {
  const { connectButton, withdrawButton, fundButton, balanceButton } =
    getButtonElements();

  connectButton.onclick = connect;
  withdrawButton.onclick = withdraw;
  fundButton.onclick = fund;
  balanceButton.onclick = getBalance;

  const accounts = (await window.ethereum.request({
    method: "eth_accounts",
  })) as string[];

  if (!accounts.length) {
    connectButton.disabled = false;
    withdrawButton.disabled = true;
    fundButton.disabled = true;
    balanceButton.disabled = true;
  } else {
    connectButton.disabled = true;
    const status = document.getElementById("status")!;
    status.innerText = "Connected";
  }
}

main();

function getButtonElements() {
  const connectButton = document.getElementById(
    "button__connect"
  ) as HTMLButtonElement;

  const withdrawButton = document.getElementById(
    "button__withdraw"
  ) as HTMLButtonElement;

  const fundButton = document.getElementById(
    "button__fund"
  ) as HTMLButtonElement;

  const balanceButton = document.getElementById(
    "button__balance"
  ) as HTMLButtonElement;

  return {
    connectButton,
    withdrawButton,
    fundButton,
    balanceButton,
  };
}

export async function connect() {
  const statusEl = document.getElementById("status")!;

  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log("Error", error);
    }

    const { connectButton, withdrawButton, fundButton, balanceButton } =
      getButtonElements();

    connectButton.disabled = true;
    withdrawButton.disabled = false;
    fundButton.disabled = false;
    balanceButton.disabled = false;

    statusEl.innerText = "Connected";
    statusEl.style.color = "black";

    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    console.log("Accounts", accounts);
  } else {
    statusEl.innerText = "Please install MetaMask";
    statusEl.style.color = "red";
  }
}

export async function withdraw() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);

  try {
    const transactionResponse =
      (await contract.withdraw()) as TransactionResponse;
    await listenForTransactionMine(transactionResponse, provider);
  } catch (error) {
    console.log("Error", error);
  }
}

export async function fund() {
  const ethAmount = (document.getElementById("eth-amount") as HTMLInputElement)
    .value;
  console.log(`Funding with ${ethAmount}...`);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);

  try {
    const transactionResponse = (await contract.fund({
      value: ethers.utils.parseEther(ethAmount),
    })) as TransactionResponse;
    await listenForTransactionMine(transactionResponse, provider);
  } catch (error) {
    console.log("Error", error);
  }
}

export async function getBalance() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  try {
    const balance = await provider.getBalance(contractAddress);
    const balanceEth = ethers.utils.formatEther(balance);
    console.log("Balance", balanceEth);

    const balanceEl = document.getElementById("balance")!;
    balanceEl.innerText = `${balanceEth} ETH`;
  } catch (error) {
    console.log("Error", error);
  }
}

export function listenForTransactionMine(
  transactionResponse: TransactionResponse,
  provider: Provider
) {
  console.log(`Mining ${transactionResponse.hash}`);

  return new Promise((resolve, _reject) => {
    provider.once(
      transactionResponse.hash,
      (transactionReceipt: TransactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations. `
        );
        resolve(true);
      }
    );
  });
}
