# Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/openzeppelin

Copy

# Library installation and overview

This section contains comprehensive guides and examples for using [OpenZeppelin's confidential smart contracts library](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts) with FHEVM. OpenZeppelin's confidential contracts library provides a secure, audited foundation for building privacy-preserving applications on fully homomorphic encryption (FHE) enabled blockchains.

The library includes implementations of popular standards like ERC20, ERC721, and ERC1155, adapted for confidential computing with FHEVM, ensuring your applications maintain privacy while leveraging battle-tested security patterns.

### Getting Started

This guide will help you set up a development environment for working with OpenZeppelin's confidential contracts and FHEVM.

#### Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** >= 20
* **Hardhat** ^2.24
* **Access to an FHEVM-enabled network** and the Zama gateway/relayer

#### Project Setup

1. **Clone the FHEVM Hardhat template repository:**

   Copy

   ```bash
   git clone https://github.com/zama-ai/fhevm-hardhat-template conf-token
   cd conf-token
   ```
2. **Install project dependencies:**

   Copy

   ```bash
   npm ci
   ```
3. **Install OpenZeppelin's confidential contracts library:**

   Copy

   ```bash
   npm i @openzeppelin/confidential-contracts
   ```
4. **Compile the contracts:**

   Copy

   ```bash
   npm run compile
   ```
5. **Run the test suite:**

   Copy

   ```bash
   npm test
   ```

### Available Guides

Explore the following guides to learn how to implement confidential contracts using OpenZeppelin's library:

* [**ERC7984 Standard**](/protocol/examples/openzeppelin-confidential-contracts/erc7984) - Learn about the ERC7984 standard for confidential tokens
* [**ERC7984 Tutorial**](/protocol/examples/openzeppelin-confidential-contracts/erc7984/erc7984-tutorial) - Step-by-step tutorial for implementing ERC7984 tokens
* [**ERC7984 to ERC20 Wrapper**](/protocol/examples/openzeppelin-confidential-contracts/erc7984/erc7984erc20wrappermock) - Convert between confidential and public token standards
* [**Swap ERC7984 to ERC20**](/protocol/examples/openzeppelin-confidential-contracts/erc7984/swaperc7984toerc20) - Implement cross-standard token swapping
* [**Swap ERC7984 to ERC7984**](/protocol/examples/openzeppelin-confidential-contracts/erc7984/swaperc7984toerc7984) - Confidential token-to-token swapping
* [**Vesting Wallet**](/protocol/examples/openzeppelin-confidential-contracts/vesting-wallet) - Implement confidential token vesting mechanisms

[PreviousPublic Decrypt multiple values](/protocol/examples/basic/decryption/highest-die-roll)[NextERC7984 Standard](/protocol/examples/openzeppelin-confidential-contracts/erc7984)

Last updated 2 months ago