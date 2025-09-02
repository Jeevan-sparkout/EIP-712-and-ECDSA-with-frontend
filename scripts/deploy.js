const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy(1_000_000); // 1M supply
  await token.waitForDeployment();

  
  console.log("MyToken deployed at:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
