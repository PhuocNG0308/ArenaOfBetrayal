# Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/run_test

Copy

# Deploy contracts and run tests

In this section, you'll find everything you need to test your FHEVM smart contracts in your [Hardhat](https://hardhat.org) project.

### FHEVM Runtime Modes

The FHEVM Hardhat plugin provides three **FHEVM runtime modes** tailored for different stages of contract development and testing. Each mode offers a trade-off between speed, encryption, and persistence.

1. The **Hardhat (In-Memory)** default network: 🧪 *Uses mock encryption.* Ideal for regular tests, CI test coverage, and fast feedback during early contract development. No real encryption is used.
2. The **Hardhat Node (Local Server)** network: 🧪 *Uses mock encryption.* Ideal when you need persistent state - for example, when testing frontend interactions, simulating user flows, or validating deployments in a realistic local environment. Still uses mock encryption.
3. The **Sepolia Testnet** network: 🔐 *Uses real encryption.* Use this mode once your contract logic is stable and validated locally. This is the only mode that runs on the full FHEVM stack with **real encrypted values**. It simulates real-world production conditions but is slower and requires Sepolia ETH.

**Zama Testnet** is not a blockchain itself. It is a protocol that enables you to run confidential smart contracts on existing blockchains (such as Ethereum, Base, and others) with the support of encrypted types. See the [FHE on blockchain](https://docs.zama.ai/protocol/protocol/overview) guide to learn more about the protocol architecture.

Currently, **Zama Protocol** is available on the **Sepolia Testnet**. Support for additional chains will be added in the future. [See the roadmap↗](https://docs.zama.ai/protocol/zama-protocol-litepaper#roadmap)

#### Summary

Mode

Encryption

Persistent

Chain

Speed

Usage

Hardhat (default)

🧪 Mock

❌ No

In-Memory

⚡⚡ Very Fast

Fast local testing and coverage

Hardhat Node

🧪 Mock

✅ Yes

Server

⚡ Fast

Frontend integration and local persistent testing

Sepolia Testnet

🔐 Real Encryption

✅ Yes

Server

🐢 Slow

Full-stack validation with real encrypted data

### The FHEVM Hardhat Template

To demonstrate the three available testing modes, we'll use the [fhevm-hardhat-template](https://github.com/zama-ai/fhevm-hardhat-template), which comes with the FHEVM Hardhat Plugin pre-installed, a basic `FHECounter` smart contract, and ready-to-use tasks for interacting with a deployed instance of this contract.

### Run on Hardhat (default)

To run your tests in-memory using FHEVM mock values, simply run the following:

### Run on Hardhat Node

You can also run your tests against a local Hardhat node, allowing you to deploy contract instances and interact with them in a persistent environment.

1

**Launch the Hardhat Node server:**

* Open a new terminal window.
* From the root project directory, run the following:

2

**Run your test suite (optional):**

From the root project directory:

3

**Deploy the** `FHECounter` **smart contract on Hardhat Node**

From the root project directory:

Check the deployed contract FHEVM configuration:

4

**Interact with the deployed** `FHECounter` **smart contract**

From the root project directory:

1. Decrypt the current counter value:

1. Increment the counter by 1:

1. Decrypt the new counter value:

### Run on Sepolia Ethereum Testnet

To test your FHEVM smart contract using real encrypted values, you can run your tests on the Sepolia Testnet.

1

**Rebuild the project for Sepolia**

From the root project directory:

2

**Deploy the** `FHECounter` **smart contract on Sepolia**

3

**Check the deployed** `FHECounter` **contract FHEVM configuration**

From the root project directory:

If an internal exception is raised, it likely means the contract was not properly compiled for the Sepolia network.

4

**Interact with the deployed** `FHECounter` **contract**

From the root project directory:

1. Decrypt the current counter value (⏳ wait...):

1. Increment the counter by 1 (⏳ wait...):

1. Decrypt the new counter value (⏳ wait...):

[PreviousWrite FHEVM tests in Hardhat](/protocol/solidity-guides/development-guide/hardhat/write_test)[NextWrite FHEVM-enabled Hardhat Tasks](/protocol/solidity-guides/development-guide/hardhat/write_task)

Last updated 2 months ago