
// require("dotenv").config();
// const { ethers } = require("hardhat");
// const MyToken = require("../artifacts/contracts/MyToken.sol/MyToken.json");

// const{RPC,PRIVATE_KEY,ETHERSCAN_API}=process.env;

// // import MyToken from "../artifacts/contracts/MyToken.sol/MyToken.json";

// async function signPermit() {
//   // Provider + signer (owner’s wallet)
//   const provider = new ethers.JsonRpcProvider(RPC);
//   const signer = new ethers.Wallet(PRIVATE_KEY, provider);

//   const tokenAddress = "0x099b118bB772DC63B478358FF6C7ddDb9104dce3";
//   const token = new ethers.Contract(tokenAddress, MyToken.abi, provider);

//   const owner = await signer.getAddress();
//   const spender = "0x148aCBa2A9a998e900A9Ab71f47B9A570016f4E7"; // the address you want to approve
//   const value = ethers.parseUnits("100", 18); // 100 tokens
//   const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
//   const nonce = await token.nonces(owner);

//   const domain = {
//     name: await token.name(),
//     version: "1",
//     chainId: (await provider.getNetwork()).chainId,
//     verifyingContract: tokenAddress,
//   };

//   const types = {
//     Permit: [
//       { name: "owner", type: "address" },
//       { name: "spender", type: "address" },
//       { name: "value", type: "uint256" },
//       { name: "nonce", type: "uint256" },
//       { name: "deadline", type: "uint256" },
//     ],
//   };

//   const values = { owner, spender, value, nonce, deadline };

//   // ✍️ Sign typed data (EIP-712)
//   const signature = await signer.signTypedData(domain, types, values);
//   const { v, r, s } = ethers.Signature.from(signature);

//   console.log("Permit Signature:", { v, r, s, deadline, value });
// }

// signPermit();





















const { ethers } = require("hardhat");
require("dotenv").config();
 const{RPC,PRIVATE_KEY,ETHERSCAN_API}=process.env;

async function main() {
  // --- 1. Configuration ---
  const owner = "0x61C2897ceF370fba33D8aA7270861f949D7fA5dc"; // Token owner (the one giving permission)
  const spender = "0x148aCBa2A9a998e900A9Ab71f47B9A570016f4E7"; // Replace with actual spender address
  const value = ethers.parseUnits("200", 18); // Amount to approve
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
  // Your deployed contract address
  const tokenAddress = "0x374F4b69f9402FCDDb975b28A5b42DA7eBC51b11"; // Replace with your actual contract address
  
  // --- 2. Setup Signer ---
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
  }
  
  const provider = ethers.provider;
  const signer = new ethers.Wallet(privateKey, provider);
  
  console.log(`Signing permit with address: ${signer.address}`);
  console.log(`Owner: ${owner}`);
  console.log(`Spender: ${spender}`);
  console.log(`Value: ${ethers.formatUnits(value, 18)} tokens`);
  console.log(`Deadline: ${new Date(deadline * 1000).toISOString()}`);

  // --- 3. Get Contract Instance and Nonce ---
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function nonces(address owner) view returns (uint256)",
      "function name() view returns (string)",
      "function DOMAIN_SEPARATOR() view returns (bytes32)"
    ],
    provider
  );

  // Get current nonce for the owner
  const nonce = await tokenContract.nonces(owner);
  const tokenName = await tokenContract.name();
  
  console.log(`Current nonce: ${nonce}`);
  console.log(`Token name: ${tokenName}`);

  // --- 4. Create EIP-712 Domain ---
  const chainId = (await provider.getNetwork()).chainId;
  
  const domain = {
    name: tokenName,
    version: "1",
    chainId: chainId,
    verifyingContract: tokenAddress
  };

  // --- 5. Create EIP-712 Types ---
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  // --- 6. Create Message ---
  const message = {
    owner: owner,
    spender: spender,
    value: value.toString(),
    nonce: nonce.toString(),
    deadline: deadline
  };

 console.log("\n--- EIP-712 Message ---");
  console.log("Domain:", JSON.stringify({...domain,chainId: domain.chainId.toString()}, null, 2));
  console.log("Message:", JSON.stringify({   ...message,value: message.value.toString(),nonce: message.nonce.toString()}, null, 2));
  // --- 7. Sign the Typed Data ---
  try {
    const signature = await signer.signTypedData(domain, types, message);
    
    // Split signature into r, s, v components
    const sig = ethers.Signature.from(signature);
    
    console.log("\n--- Signature Components ---");
    console.log(`r: ${sig.r}`);
    console.log(`s: ${sig.s}`);
    console.log(`v: ${sig.v}`);
    console.log(`Full signature: ${signature}`);
    
    console.log("\n--- Values for permit() function ---");
    console.log(`owner: ${owner}`);
    console.log(`spender: ${spender}`);
    console.log(`value: ${value.toString()}`);
    console.log(`deadline: ${deadline}`);
    console.log(`v: ${sig.v}`);
    console.log(`r: ${sig.r}`);
    console.log(`s: ${sig.s}`);

    // --- 8. Verify Signature Locally ---
    const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);

    const digest = ethers.TypedDataEncoder.hash(domain, types, message);
    const recovered = ethers.recoverAddress(digest, {
      v: sig.v,
      r: sig.r,
      s: sig.s
    });
    console.log(`Digest: ${digest}`);
    console.log(`Recovered by ecrecoverer: ${recovered}`);
    console.log(`\n--- Signature Verification ---`);
    console.log(`Expected signer: ${owner}`);
    console.log(`Recovered address: ${recoveredAddress}`);
    console.log(`Signature valid: ${recoveredAddress.toLowerCase() === owner.toLowerCase()}`);

    // --- 9. Generate Function Call Data (Optional) ---
    const permitInterface = new ethers.Interface([
      "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)"
    ]);
    
    const permitCallData = permitInterface.encodeFunctionData("permit", [
      owner,
      spender,
      value,
      deadline,
      sig.v,
      sig.r,
      sig.s
    ]);
    
    console.log(`\n--- Contract Call Data ---`);
    console.log(`Function call data: ${permitCallData}`);
    
    return {
      owner,
      spender,
      value: value.toString(),
      deadline,
      v: sig.v,
      r: sig.r,
      s: sig.s,
      signature,
      nonce: nonce.toString()
    };
    
  } catch (error) {
    console.error("Error signing permit:", error);
    throw error;
  }
}


// Alternative function if you want to test with a specific nonce
async function signPermitWithNonce(owner, spender, value, deadline, nonce, tokenAddress, tokenName) {
  const privateKey = process.env.PRIVATE_KEY;
  const provider = ethers.provider;
  const signer = new ethers.Wallet(privateKey, provider);
  
  const chainId = (await provider.getNetwork()).chainId;
  
  const domain = {
    name: tokenName,
    version: "1", 
    chainId: chainId,
    verifyingContract: tokenAddress
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  const message = {
    owner: owner,
    spender: spender,
    value: value.toString(),
    nonce: nonce.toString(),
    deadline: deadline
  };

  const signature = await signer.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature);
  
  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
    signature
  };
}

// Function to test permit on contract (if you want to test programmatically)
async function testPermit(permitData, tokenAddress) {
  const provider = ethers.provider;
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ],
    wallet
  );

  try {

// Alternative function if you want to test with a specific nonce
async function signPermitWithNonce(owner, spender, value, deadline, nonce, tokenAddress, tokenName) {
  const privateKey = process.env.PRIVATE_KEY;
  const provider = ethers.provider;
  const signer = new ethers.Wallet(privateKey, provider);
  
  const chainId = (await provider.getNetwork()).chainId;
  
  const domain = {
    name: tokenName,
    version: "1", 
    chainId: chainId,
    verifyingContract: tokenAddress
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  const message = {
    owner: owner,
    spender: spender,
    value: value.toString(),
    nonce: nonce.toString(),
    deadline: deadline
  };

  const signature = await signer.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature);
  
  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
    signature
  };
}

// Function to test permit on contract (if you want to test programmatically)
async function testPermit(permitData, tokenAddress) {
  const provider = ethers.provider;
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ],
    wallet
  );

  try {
    console.log("Testing permit transaction...");
    
    const tx = await tokenContract.permit(
      permitData.owner,
      permitData.spender,
      permitData.value,
      permitData.deadline,
      permitData.v,
      permitData.r,
      permitData.s
    );
    
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log("Permit executed successfully!");
    
    // Check allowance
    const allowance = await tokenContract.allowance(permitData.owner, permitData.spender);
    console.log(`New allowance: ${ethers.formatUnits(allowance, 18)} tokens`);
    
  } catch (error) {
    console.error("Permit failed:", error);
  }
}
    console.log("Testing permit transaction...");
    
    const tx = await tokenContract.permit(
      permitData.owner,
      permitData.spender,
      permitData.value,
      permitData.deadline,
      permitData.v,
      permitData.r,
      permitData.s
    );
    
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log("Permit executed successfully!");
    
    // Check allowance
    const allowance = await tokenContract.allowance(permitData.owner, permitData.spender);
    console.log(`New allowance: ${ethers.formatUnits(allowance, 18)} tokens`);
    
  } catch (error) {
    console.error("Permit failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });