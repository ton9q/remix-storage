import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "dotenv/config";

const {
  RINKEBY_RPC_URL = "",
  KOVAN_RPC_URL = "",
  MAINNET_RPC_URL = "",
  POLYGON_MAINNET_RPC_URL = "",
  PRIVATE_KEY = "",
  ETHERSCAN_API_KEY = "",
  POLYGONSCAN_API_KEY = "",
  COINMARKETCAP_API_KEY = "",
} = process.env;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    rinkeby: {
      chainId: 4,
      url: RINKEBY_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    kovan: {
      chainId: 42,
      url: KOVAN_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    mainnet: {
      chainId: 1,
      url: MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    polygon: {
      chainId: 137,
      url: POLYGON_MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [{ version: "0.8.9" }, { version: "0.4.24" }],
  },
  etherscan: {
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY,
      kovan: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 300000,
  },
};

export default config;
