# Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/oracle

Copy

# Decryption

## Public Decryption

This section explains how to handle public decryption in FHEVM. Public decryption allows plaintext data to be accessed when required for contract logic or user presentation, ensuring confidentiality is maintained throughout the process.

Public decryption is essential in two primary cases:

1. **Smart contract logic**: A contract requires plaintext values for computations or decision-making.
2. **User interaction**: Plaintext data needs to be revealed to all users, such as revealing the decision of the vote.

### Overview

Public decryption of a confidential on-chain result is designed as an asynchronous three-steps process that splits the work between the blockchain (on-chain) and off-chain execution environments.

**Step 1: On-Chain Setup - Enabling Permanent Public Access**

This step is executed by the smart contract using the FHE Solidity library to signal that a specific confidential result is ready to be revealed.

* **FHE Solidity Library Function:** `FHE.makePubliclyDecryptable`
* **Action:** The contract sets the ciphertext handle's status as publicly decryptable, **globally and permanently** authorizing any entity to request its off-chain cleartext value.
* **Result:** The ciphertext is now accessible to any entity, which can request its decryption from the Zama off-chain Relayer.

**Step 2: Off-chain Decryption - Decryption and Proof Generation**

This step can be executed by any off-chain client using the Relayer SDK.

* **Relayer SDK Function:** `FhevmInstance.publicDecrypt`
* **Action:** The off-chain client submits the ciphertext handle to the Zama Relayer's Key Management System (KMS).
* **Result:** The Zama Relayer returns three items:

  1. The cleartext (the decrypted value).
  2. The ABI-encoding of that cleartext.
  3. A Decryption Proof (a byte array of signatures and metadata) that serves as a cryptographic guarantee that the cleartext is the authentic, unmodified result of the decryption performed by the KMS.

**Step 3: On-Chain Verification - Submit and Guarantee Authenticity**

This final step is executed on-chain by the contrat using the FHE Solidity library with the proof generated off-chain to ensure the cleartext submitted to the contract is trustworthy.

* **FHE Solidity Library Function:** `FHE.checkSignatures`
* **Action:** The caller submits the cleartext and decryption proof back to a contract function. The contract calls `FHE.checkSignatures`, which reverts the transaction if the proof is invalid or does not match the cleartext/ciphertext pair.
* **Result:** The receiving contract gains a cryptographic guarantee that the submitted cleartext is the authentic decrypted value of the original ciphertext. The contract can then securely execute its business logic (e.g., reveal a vote, transfer funds, update state).

### Tutorial

This tutorial provides a deep dive into the three-step asynchronous public decryption process required to finalize a confidential on-chain computation by publicly revealing its result.

The Solidity contract provided below, `FooBarContract`, is used to model this entire workflow. The contract's main function `runFooBarConfidentialLogic` simulates the execution of a complex confidential computation (e.g., calculating a winner or a final price) that results in 2 encrypted final values (ciphertexts) `_encryptedFoo` and `_encryptedBar`.

Then, in order to finalize the workflow, the `FooBarContract` needs the decrypted clear values of both `_encryptedFoo` and `_encryptedBar` to decide whether to trigger some finalization logic (e.g. reveal a vote, transfer funds). The `FooBarContract`'s function `_runFooBarClearBusinessLogicFinalization` simulates this step. Since the FHEVM prevents direct on-chain decryption, the process must shift to an off-chain decryption phase, which presents a challenge: ***How can the*** `FooBarContract` ***trust that the cleartext submitted back to the chain is the authentic, unmodified result of the decryption of both*** `_encryptedFoo` ***and*** `_encryptedBar`***?***

This is where the off-chain `publicDecrypt` function and the on-chain `checkSignatures` function come into play.

#### The Solidity Contract

1

### Run On-Chain Confidential Logic

We first execute the on-chain confidential logic using a TypeScript client. This simulates the initial phase of the confidential computation.

2

### Run On-Chain Request Clear Values

With the confidential logic complete, the next step is to execute the on-chain function that requests and enables public decryption of the computed encrypted values `_encryptedFoo` and `_encryptedBar`. In a production scenario, we might use a Solidity event to notify the off-chain client that the necessary encrypted values are ready for off-chain public decryption.

3

### Run Off-Chain Public Decryption

Now that the ciphertexts are marked as publicly decryptable, we call the off-chain function `publicDecrypt` using the `relayer-sdk`. This fetches the clear values along with the Zama KMS decryption proof required for the final on-chain verification.

**Crucial Ordering Constraint:** The decryption proof is cryptographically bound to the specific order of handles passed in the input array. The proof computed for `[efoo, ebar]` is different from the proof computed for `[ebar, efoo]`.

4

### Run On-Chain

On the client side, we have computed all the clear values and, crucially, obtained the associated decryption proof. We can now securely move on to the final step: sending this data on-chain to trigger verification and final business logic simulated in the `_runFooBarClearBusinessLogicFinalization` contract function. If verification succeeds, the contract securely executes the `_runFooBarClearBusinessLogicFinalization` (e.g., transfers funds, publishes the vote result, etc.), completing the full confidential workflow.

## Public Decryption On-Chain & Off-Chain API

#### On-chain `FHE.makePubliclyDecryptable` function

The contract sets the ciphertext handle's status as publicly decryptable, globally and permanently authorizing any entity to request its off-chain cleartext value. Note the calling contract must have ACL permission to access the handle in the first place.

**Function arguments**

**Function return**

This function has no return value

#### Off-chain relayer-sdk `publicDecrypt` function

The relayer-sdk `publicDecrypt` function is defined as follow:

**Function arguments**

Argument

Description

Constraints

`handles`

The list of ciphertext handles (represented as bytes32 values) to decrypt.

These handles must correspond to ciphertexts that have been marked as publicly decryptable on-chain.

**Function return type** `PublicDecryptResults`

The function returns an object containing the three essential components required for the final on-chain verification in Step 3 of the public decryption workflow:

Property

Type

Description

On-Chain usage

`clearValues`

`Record<`0x${string}`, bigint | boolean |` 0x${string}`>`

An object mapping each input ciphertext handle to its raw decrypted cleartext value.

N/A

`abiEncodedClearValues`

`0x${string}`

The ABI-encoded byte string of all decrypted cleartext values, preserving the exact order of the input handles list.

`abiEncodedCleartexts` argument when calling the on-chain `FHE.checkSignatures`

`decryptionProof`

`0x${string}`

A byte array containing the KMS cryptographic signatures and necessary metadata that proves the decryption was legitimately performed.

`decryptionProof` argument when calling the on-chain `FHE.checkSignatures`

#### On-chain `FHE.checkSignatures` function

**Function arguments**

Argument

Description

Constraint

`handlesList`

The list of ciphertext handles (represented as bytes32 values) whose decryption is being verified.

Must contain the exact same number of elements as the cleartext values in abiEncodedCleartexts.

`abiEncodedCleartexts`

The ABI encoding of the decrypted cleartext values associated with the handles. (Use abi.encode to prepare this argument.)

Order is critical: The i-th value in this encoding must be the cleartext that corresponds to the i-th handle in handlesList. Types must match.

`decryptionProof`

A byte array containing the KMS cryptographic signatures and necessary metadata that prove the off-chain decryption was performed by the authorized Zama Key Management System.

This proof is generated by the Zama KMS and is obtained via the `relayer-sdk.publicDecrypt` function.

**Function return**

This function has no return value and simply reverts if the proof verification failed.

Notice that the callback should always verify the signatures and implement a replay protection mechanism (see below).

[PreviousError handling](/protocol/solidity-guides/smart-contract/logics/error_handling)[NextHardhat plugin](/protocol/solidity-guides/development-guide/hardhat)

Last updated 1 month ago