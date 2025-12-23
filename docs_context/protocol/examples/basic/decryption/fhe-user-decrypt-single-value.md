# Source: https://docs.zama.org/protocol/examples/basic/decryption/fhe-user-decrypt-single-value

Copy

# User decrypt single value

This example demonstrates the FHE user decryption mechanism with a single value.

User decryption is a mechanism that allows specific users to decrypt encrypted values while keeping them hidden from others. Unlike public decryption where decrypted values become visible to everyone, user decryption maintains privacy by only allowing authorized users with the proper permissions to view the data. While permissions are granted onchain through smart contracts, the actual **decryption call occurs off-chain in the frontend application**.

To run this example correctly, make sure the files are placed in the following directories:

* `.sol` file → `<your-project-root-dir>/contracts/`
* `.ts` file → `<your-project-root-dir>/test/`

This ensures Hardhat can compile and test your contracts as expected.

UserDecryptSingleValue.sol

UserDecryptSingleValue.ts

Copy

```bash
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * This trivial example demonstrates the FHE decryption mechanism
 * and highlights common pitfalls developers may encounter.
 */
contract UserDecryptSingleValue is ZamaEthereumConfig {
  euint32 private _trivialEuint32;

  // solhint-disable-next-line no-empty-blocks
  constructor() {}

  function initializeUint32(uint32 value) external {
    // Compute a trivial FHE formula _trivialEuint32 = value + 1
    _trivialEuint32 = FHE.add(FHE.asEuint32(value), FHE.asEuint32(1));

    // Grant FHE permissions to:
    // ✅ The contract caller (`msg.sender`): allows them to decrypt `_trivialEuint32`.
    // ✅ The contract itself (`address(this)`): allows it to operate on `_trivialEuint32` and
    //    also enables the caller to perform user decryption.
    //
    // Note: If you forget to call `FHE.allowThis(_trivialEuint32)`, the user will NOT be able
    //       to user decrypt the value! Both the contract and the caller must have FHE permissions
    //       for user decryption to succeed.
    FHE.allowThis(_trivialEuint32);
    FHE.allow(_trivialEuint32, msg.sender);
  }

  function initializeUint32Wrong(uint32 value) external {
    // Compute a trivial FHE formula _trivialEuint32 = value + 1
    _trivialEuint32 = FHE.add(FHE.asEuint32(value), FHE.asEuint32(1));

    // ❌ Common FHE permission mistake:
    // ================================================================
    // We grant FHE permissions to the contract caller (`msg.sender`),
    // expecting they will be able to user decrypt the encrypted value later.
    //
    // However, this will fail! 💥
    // The contract itself (`address(this)`) also needs FHE permissions to allow user decryption.
    // Without granting the contract access using `FHE.allowThis(...)`,
    // the user decryption attempt by the user will not succeed.
    FHE.allow(_trivialEuint32, msg.sender);
  }

  function encryptedUint32() public view returns (euint32) {
    return _trivialEuint32;
  }
}
```

[PreviousDecryption](/protocol/examples/basic/decryption)[NextUser decrypt multiple values](/protocol/examples/basic/decryption/fhe-user-decrypt-multiple-values)

Last updated 1 month ago