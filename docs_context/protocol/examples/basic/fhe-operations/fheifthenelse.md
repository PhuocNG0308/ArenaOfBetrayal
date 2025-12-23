# Source: https://docs.zama.org/protocol/examples/basic/fhe-operations/fheifthenelse

Copy

# If then else

This example demonstrates how to write a simple contract with conditions using FHEVM, in comparison to a simple counter.

To run this example correctly, make sure the files are placed in the following directories:

* `.sol` file → `<your-project-root-dir>/contracts/`
* `.ts` file → `<your-project-root-dir>/test/`

This ensures Hardhat can compile and test your contracts as expected.

FHEIfThenElse.sol

FHEIfThenElse.ts

Copy

```bash
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, ebool, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FHEIfThenElse is ZamaEthereumConfig {
  euint8 private _a;
  euint8 private _b;
  euint8 private _max;

  // solhint-disable-next-line no-empty-blocks
  constructor() {}

  function setA(externalEuint8 inputA, bytes calldata inputProof) external {
    _a = FHE.fromExternal(inputA, inputProof);
    FHE.allowThis(_a);
  }

  function setB(externalEuint8 inputB, bytes calldata inputProof) external {
    _b = FHE.fromExternal(inputB, inputProof);
    FHE.allowThis(_b);
  }

  function computeMax() external {
    // a >= b
    // solhint-disable-next-line var-name-mixedcase
    ebool _a_ge_b = FHE.ge(_a, _b);

    // a >= b ? a : b
    _max = FHE.select(_a_ge_b, _a, _b);

    // For more information about FHE permissions in this case,
    // read the `computeAPlusB()` commentaries in `FHEAdd.sol`.
    FHE.allowThis(_max);
    FHE.allow(_max, msg.sender);
  }

  function result() public view returns (euint8) {
    return _max;
  }
}
```

[PreviousAdd](/protocol/examples/basic/fhe-operations/fheadd)[NextEncryption](/protocol/examples/basic/encryption)

Last updated 1 month ago