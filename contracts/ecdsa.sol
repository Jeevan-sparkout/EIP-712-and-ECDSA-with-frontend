
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract TokenSender {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public signerAddress;
    IERC20 public token;

    // Mapping to prevent the same signature from being used twice (replay attack)
    mapping(bytes32 => bool) public usedHashes;

    event TokensClaimed(address indexed recipient, uint256 amount);

    constructor(address _signerAddress, address _tokenAddress) {
        signerAddress = _signerAddress;
        token = IERC20(_tokenAddress);
    }

    function claimTokens(address recipient, uint256 amount, bytes memory signature) public {
        // require(amount == 100 * 10**18, "Can only claim 100 tokens");
        
        // 1. Recreate the message hash that was signed off-chain
        bytes32 messageHash = getMessageHash(recipient, amount);
        require(!usedHashes[messageHash], "Signature already used");

        // 2. Recover the address from the signature
        address recoveredSigner = messageHash.toEthSignedMessageHash().recover(signature);
        
        // 3. Verify that the recovered address is the authorized signer
        require(recoveredSigner == signerAddress, "Invalid signature");
        
        // Mark hash as used
        usedHashes[messageHash] = true;

        // 4. If verification is successful, send 100 tokens
        uint256 tokenBalance = token.balanceOf(address(this));
        require(tokenBalance >= amount, "Not enough tokens in contract");
        token.transfer(recipient, amount);
        
        emit TokensClaimed(recipient, amount);
    }

    /**
     * @dev Creates a hash of the message to be signed.
     * This must be IDENTICAL to the hashing method used in the JavaScript client.
     */
    function getMessageHash(address _recipient, uint256 _amount) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_recipient, _amount));
    }
}
