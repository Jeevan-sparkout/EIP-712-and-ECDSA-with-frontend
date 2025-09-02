const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // --- 1. Configuration ---
  // Paste the address that you want to authorize for claiming tokens.
  const recipientAddress = "0x678816a740c5103B54853750D8e6AA1E7a6A210A";
  const amountToClaim = ethers.parseUnits("200", 18); // Must match the amount in the contract (100 tokens)

  // --- 2. Setup Signer ---
  // This sets up a wallet object from your private key to sign the message.
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
  }
  const signer = new ethers.Wallet(privateKey);
  
  console.log(`Signing a message with the address: ${signer.address}`);
  console.log(`Authorizing recipient: ${recipientAddress}`);

  // --- 3. Create the Message Hash ---
  // This must be the EXACT same hashing mechanism as in the smart contract.
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256"],
    [recipientAddress, amountToClaim]
  );
  
  // --- 4. Sign the Hash ---
  // The signer's wallet signs the hash to produce a unique signature.
  // Note: We sign the raw bytes of the hash.
  const signature = await signer.signMessage(ethers.getBytes(messageHash));

  // --- 5. Print the Results ---
  // These are the values you would use to call the `claimTokens` function.
  console.log("\n--- Signature Details ---");
  console.log(`Recipient: ${recipientAddress}`);
  console.log(`Amount (wei): ${amountToClaim.toString()}`);
  console.log(`Signature: ${signature}`);
  console.log("\nThese values can now be used to call the claimTokens() function.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});