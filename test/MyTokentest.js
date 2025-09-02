const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken - Permit", function () {
  let token, owner, spender;

  beforeEach(async function () {
    [owner, spender] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy(1000n); // initial supply = 1000 * 1e18
    await token.waitForDeployment();
  });

  it("should approve tokens via permit", async function () {
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const domain = {
      name: await token.name(),
      version: "1",
      chainId,
      verifyingContract: await token.getAddress(),
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const value = ethers.parseUnits("100", 18);
    const nonce = await token.nonces(owner.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const message = {
      owner: owner.address,
      spender: spender.address,
      value,
      nonce,
      deadline,
    };

    // Sign permit off-chain
    const signature = await owner.signTypedData(domain, types, message);
    const { v, r, s } = ethers.Signature.from(signature);

    // Call permit on-chain
    await token.permit(owner.address, spender.address, value, deadline, v, r, s);

    // ✅ Verify allowance updated
    expect(await token.allowance(owner.address, spender.address)).to.equal(value);
  });

  it("should let spender transferFrom after permit", async function () {
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const domain = {
      name: await token.name(),
      version: "1",
      chainId,
      verifyingContract: await token.getAddress(),
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const value = ethers.parseUnits("50", 18);
    const nonce = await token.nonces(owner.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const message = {
      owner: owner.address,
      spender: spender.address,
      value,
      nonce,
      deadline,
    };

    const signature = await owner.signTypedData(domain, types, message);
    const { v, r, s } = ethers.Signature.from(signature);

    // Permit first
    await token.permit(owner.address, spender.address, value, deadline, v, r, s);

    // Spender transfers tokens
    await token.connect(spender).transferFrom(owner.address, spender.address, value);

    // ✅ Balance check
    expect(await token.balanceOf(spender.address)).to.equal(value);
  });

  it("should revert if permit expired", async function () {
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const domain = {
      name: await token.name(),
      version: "1",
      chainId,
      verifyingContract: await token.getAddress(),
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const value = ethers.parseUnits("10", 18);
    const nonce = await token.nonces(owner.address);
    const deadline = Math.floor(Date.now() / 1000) - 1; // already expired

    const message = {
      owner: owner.address,
      spender: spender.address,
      value,
      nonce,
      deadline,
    };

    const signature = await owner.signTypedData(domain, types, message);
    const { v, r, s } = ethers.Signature.from(signature);

    await expect(
      token.permit(owner.address, spender.address, value, deadline, v, r, s)
    ).to.be.revertedWith("PERMIT_EXPIRED");
  });
});
