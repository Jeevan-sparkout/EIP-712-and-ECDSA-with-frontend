const { ethers } = require("hardhat");

async function main() {
  // --- SETUP ---
  const [owner] = await ethers.getSigners();
  
  // --- CHANGE ---
  // Instead of creating a random wallet, we'll use your specific address.
  const claimerAddress = "0x6ca483C3ed094B88c0FF79E25f055d92c65b80af";
  
  console.log("Deployer/Signer Address:", owner.address);
  console.log("Claimer Address:", claimerAddress); // Using the new variable here
  
  // --- 1. DEPLOY THE TOKEN CONTRACT ---
  const MyToken = await ethers.getContractFactory("Ecdsa");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment();
  const tokenAddress = await myToken.getAddress();
  console.log(`MyToken deployed to: ${tokenAddress}`);

  // --- 2. DEPLOY THE TOKEN SENDER CONTRACT ---
  const TokenSender = await ethers.getContractFactory("TokenSender");
  const tokenSender = await TokenSender.deploy(owner.address, tokenAddress);
  await tokenSender.waitForDeployment();
  const tokenSenderAddress = await tokenSender.getAddress();
  console.log(`TokenSender deployed to: ${tokenSenderAddress}`);

  // --- 3. FUND THE TOKEN SENDER CONTRACT ---
  console.log("Minting tokens to the TokenSender contract...");
  const mintAmount = ethers.parseUnits("1000", 18);
  const mintTx = await myToken.mint(tokenSenderAddress, mintAmount);
  await mintTx.wait();
  console.log(`Minted 1000 MTK to TokenSender contract.`);

  // --- 4. SIGN THE MESSAGE OFF-CHAIN ---
  const amountToSend = ethers.parseUnits("100", 18);
  
  // The hash now includes your specific address
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256"],
    [claimerAddress, amountToSend] // Using the new variable here
  );

  const signature = await owner.signMessage(ethers.getBytes(messageHash));
  console.log("Generated Signature:", signature);

  // --- 5. CALL THE SMART CONTRACT TO CLAIM TOKENS ---
  //   console.log("\nAttempting to claim tokens for:", claimerAddress);
  
  // The claimTokens function is called with your specific address
  // const tx = await tokenSender.connect(owner).claimTokens(claimerAddress, amountToSend, signature); // Using the new variable here
  // await tx.wait();
  
  // console.log("Tokens claimed successfully!");

  // --- 6. VERIFY THE RESULT ---
  // We check the token balance of your specific address
  // const finalBalance = await myToken.balanceOf(claimerAddress); // Using the new variable here
  // console.log(`\nFinal token balance of claimer: ${ethers.formatUnits(finalBalance, 18)} MTK`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});