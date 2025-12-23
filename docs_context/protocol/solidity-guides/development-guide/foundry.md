# Source: https://docs.zama.org/protocol/solidity-guides/development-guide/foundry

Copy

# Foundry

This guide explains how to use Foundry with FHEVM for developing smart contracts.

While a Foundry template is currently in development, we strongly recommend using the [Hardhat template](/protocol/solidity-guides/getting-started/setup)) for now, as it provides a fully tested and supported development environment for FHEVM smart contracts.

However, you could still use Foundry with the mocked version of the FHEVM, but please be aware that this approach is **NOT** recommended, since the mocked version is not fully equivalent to the real FHEVM node's implementation (see warning in hardhat). In order to do this, you will need to rename your `FHE.sol` imports from `@fhevm/solidity/lib/FHE.sol` to `fhevm/mocks/FHE.sol` in your solidity source files.

[PreviousWrite FHEVM-enabled Hardhat Tasks](/protocol/solidity-guides/development-guide/hardhat/write_task)[NextHCU](/protocol/solidity-guides/development-guide/hcu)

Last updated 2 months ago