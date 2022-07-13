export interface NetworkConfigItem {
  ethUsdPriceFeed?: string;
  blockConfirmations?: number;
}

export interface NetworkConfig {
  [key: string]: NetworkConfigItem;
}

export const networkConfig: NetworkConfig = {
  localhost: {},
  hardhat: {},
  // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
  // Default one is ETH/USD contract on Kovan
  rinkeby: {
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    blockConfirmations: 6,
  },
  kovan: {
    ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    blockConfirmations: 6,
  },
};

export const developmentChains = ["hardhat", "localhost"];
