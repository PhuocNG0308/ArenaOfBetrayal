# Source: https://docs.zama.org/protocol/protocol/overview

Copy

# FHE on blockchain

This section explains in depth the Zama Confidential Blockchain Protocol (Zama Protocol) and demonstrates how it can bring encrypted computation to smart contracts using Fully Homomorphic Encryption (FHE).

FHEVM is the core technology that powers the Zama Protocol. It is composed of the following key components.

![](https://docs.zama.org/protocol/~gitbook/image?url=https%3A%2F%2F4279888132-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F06EvE9BR7kBlHwVGcFT8%252Fuploads%252Fgit-blob-64b4536b1a1605b9ccd2d0293a7df06aa358b8d3%252FFHEVM.png%3Falt%3Dmedia&width=768&dpr=4&quality=100&sign=d805f1b6&sv=2)

* [**FHEVM Solidity library**](/protocol/protocol/overview/library): Enables developers to write confidential smart contracts in plain Solidity using encrypted data types and operations.
* [**Host contracts**](/protocol/protocol/overview/hostchain) : Trusted on-chain contracts deployed on EVM-compatible blockchains. They manage access control and trigger off-chain encrypted computation.
* [**Coprocessors**](/protocol/protocol/overview/coprocessor) – Decentralized services that verify encrypted inputs, run FHE computations, and commit results.
* [**Gateway**](/protocol/protocol/overview/gateway) **–** The central orchestrator of the protocol. It validates encrypted inputs, manages access control lists (ACLs), bridges ciphertexts across chains, and coordinates coprocessors and the KMS.
* [**Key Management Service (KMS)**](/protocol/protocol/overview/kms) – A threshold MPC network that generates and rotates FHE keys, and handles secure, verifiable decryption.
* [**Relayer & oracle**](/protocol/protocol/overview/relayer_oracle) – A lightweight off-chain service that helps users interact with the Gateway by forwarding encryption or decryption requests.

[PreviousWelcome](/protocol)[NextFHE library](/protocol/protocol/overview/library)

Last updated 1 month ago