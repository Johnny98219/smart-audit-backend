require("@nomicfoundation/hardhat-toolbox");
require("hardhat-preprocessor");
require("dotenv").config();
const fs = require('fs')


//Example of how to use environment variables
// const INFURA_API_KEY_POLYGON_MUMBAI = process.env.INFURA_API_KEY_POLYGON_MUMBAI;
// const INFURA_API_KEY_LINEA_GOERLI = process.env.INFURA_API_KEY_LINEA_GOERLI;
// const INFURA_API_KEY_BASE_GOERLI = process.env.INFURA_API_KEY_BASE_GOERLI;
// const INFURA_API_KEY_ETHEREUM_SEPOLIA =
//   process.env.INFURA_API_KEY_ETHEREUM_SEPOLIA;
// const INFURA_API_KEY_AURORA_TESTNET = process.env.INFURA_API_KEY_AURORA_TESTNET;
// const INFURA_API_KEY_AVALANCHE_FIJI = process.env.INFURA_API_KEY_AVALANCHE_FUJI;
// const INFURA_API_KEY_CELO_ALFAJORES = process.env.INFURA_API_KEY_CELO_ALFAJORES;
// const INFURA_API_KEY_OPTIMISIM_GOERLI =
//   process.env.INFURA_API_KEY_OPTIMISIM_GOERLI;
// const INFURA_API_KEY_ARBITRUM_GOERLI =
//   process.env.INFURA_API_KEY_ARBITRUM_GOERLI;
// const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
      compilers: [
        { 
            version: '0.8.12',
            settings: {
              // viaIR: true,
              optimizer: {
                enabled: true,
                runs: 10000,
              },
            }
          }
      ]
    },
  networks: {
    hardhat: {},
    // metisAndromeda: {
    //   url: "https://andromeda.metis.io/?owner=1088",
    //   accounts: [process.env.WALLET_PRIVATE_KEY],
    //   verify: {
    //     etherscan: {
    //       apiKey: "apiKey is not required, just set a placeholder",
    //       apiUrl:
    //         "https://api.routescan.io/v2/network/mainnet/evm/1088/etherscan",
    //     },
    //   },
    // },
    // ethereumSepolia: {
    //   url: `https://eth-sepolia.g.alchemy.com/v2/${INFURA_API_KEY_ETHEREUM_SEPOLIA}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // polygonMumbai: {
    //   url: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY_POLYGON_MUMBAI}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // lineaGoerli: {
    //   url: `https://linea-goerli.infura.io/v3/${INFURA_API_KEY_LINEA_GOERLI}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // baseGoerli: {
    //   url: `https://base-goerli.infura.io/v3/${INFURA_API_KEY_BASE_GOERLI}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // arbitrumGoerli: {
    //   url: `https://base-goerli.infura.io/v3/${INFURA_API_KEY_ARBITRUM_GOERLI}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // auroraTestnet: {
    //   url: `https://base-goerli.infura.io/v3/${INFURA_API_KEY_AURORA_TESTNET}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // avalancheFiji: {
    //   url: `https://base-goerli.infura.io/v3/${INFURA_API_KEY_AVALANCHE_FIJI}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // avalancheFiji: {
    //   url: `https://base-goerli.infura.io/v3/${INFURA_API_KEY_AVALANCHE_FUJI}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // celoAlfajores: {
    //   url: `https://base-goerli.infura.io/v3/${INFURA_API_KEY_CELO_ALFAJORES}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // celoAlfajores: {
    //   url: `https://base-goerli.infura.io/v3/${INFURA_API_KEY_CELO_ALFAJORES}`,
    //   accounts: [PRIVATE_KEY],
    // },
    // optimisimGoerli: {
    //   url: `https://optimism-goerli.infura.io/v3/${INFURA_API_KEY_OPTIMISIM_GOERLI}`,
    //   accounts: [PRIVATE_KEY],
    // },
  },
}
