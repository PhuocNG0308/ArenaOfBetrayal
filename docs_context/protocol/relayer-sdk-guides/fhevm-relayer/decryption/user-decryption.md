# Source: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption

Copy

# User decryption

This document explains how to perform user decryption. User decryption is required when you want a user to access their private data without it being exposed to the blockchain.

User decryption in FHEVM enables the secure sharing or reuse of encrypted data under a new public key without exposing the plaintext.

This feature is essential for scenarios where encrypted data must be transferred between contracts, dApps, or users while maintaining its confidentiality.

## When to use user decryption

User decryption is particularly useful for **allowing individual users to securely access and decrypt their private data**, such as balances or counters, while maintaining data confidentiality.

## Overview

The user decryption process involves retrieving ciphertext from the blockchain and performing user-decryption on the client-side. In other words we take the data that has been encrypted by the KMS, decrypt it and encrypt it with the user's private key, so only he can access the information.

This ensures that the data remains encrypted under the blockchain’s FHE key but can be securely shared with a user by re-encrypting it under the user’s NaCl public key.

User decryption is facilitated by the **Relayer** and the **Key Management System (KMS)**. The workflow consists of the following:

1. Retrieving the ciphertext from the blockchain using a contract’s view function.
2. Re-encrypting the ciphertext client-side with the user’s public key, ensuring only the user can decrypt it.

## Step 1: retrieve the ciphertext

To retrieve the ciphertext that needs to be decrypted, you can implement a view function in your smart contract. Below is an example implementation:

Copy

```bash
import "@fhevm/solidity/lib/FHE.sol";

contract ConfidentialERC20 {
  ...
  function balanceOf(account address) public view returns (euint64) {
    return balances[msg.sender];
  }
  ...
}
```

Here, `balanceOf` allows retrieval of the user’s encrypted balance handle stored on the blockchain. Doing this will return the ciphertext handle, an identifier for the underlying ciphertext.

For the user to be able to user decrypt (also called re-encrypt) the ciphertext value the access control (ACL) needs to be set properly using the `FHE.allow(ciphertext, address)` function in the solidity contract holding the ciphertext.

For more details on the topic please refer to [the ACL documentation](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl). For more details on the topic please refer to [the ACL documentation](https://docs.zama.ai/protocol/solidity-guides/smart-contract/acl).

## Step 2: decrypt the ciphertext

Using those ciphertext handles, user decryption is performed client-side using the `@zama-fhe/relayer-sdk` library. The `userDecrypt` function takes a **list of handles**, allowing you to decrypt multiple ciphertexts in a single request. In this example, provide just one handle. The user needs to have created an instance object prior to that (for more context see [the relayer-sdk setup page](/protocol/relayer-sdk-guides/fhevm-relayer/initialization)).

The total bit length of all ciphertexts being decrypted in a single request must not exceed 2048 bits. Each encrypted type has a specific bit length, for instance `euint8` uses 8 bits and `euint16` uses 16 bits. For the full list of encrypted types and their corresponding bit lengths, refer to the [encrypted types documentation](https://docs.zama.org/protocol/solidity-guides/smart-contract/types#list-of-encrypted-types).

[PreviousDecryption](/protocol/relayer-sdk-guides/fhevm-relayer/decryption)[NextPublic decryption](/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption)

Last updated 4 days ago