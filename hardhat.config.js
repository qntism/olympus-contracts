require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: "0.7.5",
  networks: {
    
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
