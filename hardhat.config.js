require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("dotenv").config();

module.exports = {
  solidity: "0.7.5",
  networks: {
    kovan: {
      url: `https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      timeout: 20000000
    },
    localhost: {
      url: 'http://localhost:8545',
      accounts: ['0x4119107cae4fd43d5e735ec4877b948a3258cdcd0918ba20d28f04ee51f190d8']
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deploy: "./scripts/deploy",
    deployments: "./deployments",
},
};
