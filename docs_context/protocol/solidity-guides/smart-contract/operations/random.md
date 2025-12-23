# Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random

Copy

# Generate random numbers

This document explains how to generate cryptographically secure random encrypted numbers fully on-chain using the `FHE` library in fhevm. These numbers are encrypted and remain confidential, enabling privacy-preserving smart contract logic.

## **Key notes on random number generation**

* **On-chain execution**: Random number generation must be executed during a transaction, as it requires the pseudo-random number generator (PRNG) state to be updated on-chain. This operation cannot be performed using the `eth_call` RPC method.
* **Cryptographic security**: The generated random numbers are cryptographically secure and encrypted, ensuring privacy and unpredictability.

Random number generation must be performed during transactions, as it requires the pseudo-random number generator (PRNG) state to be mutated on-chain. Therefore, it cannot be executed using the `eth_call` RPC method.

## **Basic usage**

The `FHE` library allows you to generate random encrypted numbers of various bit sizes. Below is a list of supported types and their usage:

Copy

```bash
// Generate random encrypted numbers
ebool rb = FHE.randEbool();       // Random encrypted boolean
euint8 r8 = FHE.randEuint8();     // Random 8-bit number
euint16 r16 = FHE.randEuint16();  // Random 16-bit number
euint32 r32 = FHE.randEuint32();  // Random 32-bit number
euint64 r64 = FHE.randEuint64();  // Random 64-bit number
euint128 r128 = FHE.randEuint128(); // Random 128-bit number
euint256 r256 = FHE.randEuint256(); // Random 256-bit number
```

### **Example: Random Boolean**

## **Bounded random numbers**

To generate random numbers within a specific range, you can specify an **upper bound**. The specified upper bound must be a power of 2. The random number will be in the range `[0, upperBound - 1]`.

### **Example: Random number with upper bound**

## **Security Considerations**

* **Cryptographic security**:
  The random numbers are generated using a cryptographically secure pseudo-random number generator (CSPRNG) and remain encrypted until explicitly decrypted.
* **Gas consumption**:
  Each call to a random number generation function consumes gas. Developers should optimize the use of these functions, especially in gas-sensitive contracts.
* **Privacy guarantee**:
  Random values are fully encrypted, ensuring they cannot be accessed or predicted by unauthorized parties.

[PreviousCasting and trivial encryption](/protocol/solidity-guides/smart-contract/operations/casting)[NextEncrypted inputs](/protocol/solidity-guides/smart-contract/inputs)

Last updated 2 months ago