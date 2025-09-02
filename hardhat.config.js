require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify")
require('dotenv').config();


const{RPC,PRIVATE_KEY,ETHERSCAN_API}=process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  
  solidity: "0.8.30",
  networks: {
    sepolia: {
      url: RPC,
      accounts: [PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey:{
      sepolia: ETHERSCAN_API
    },
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }

};