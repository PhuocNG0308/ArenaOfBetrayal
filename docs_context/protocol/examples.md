# Source: https://docs.zama.org/protocol/examples

Copy

# FHE counter

This example demonstrates how to build an confidential counter using FHEVM, in comparison to a simple counter.

To run this example correctly, make sure the files are placed in the following directories:

* `.sol` file → `<your-project-root-dir>/contracts/`
* `.ts` file → `<your-project-root-dir>/test/`

This ensures Hardhat can compile and test your contracts as expected.

### A simple counter

counter.sol

counter.ts

Copy

```bash
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title A simple counter contract
contract Counter {
  uint32 private _count;

  /// @notice Returns the current count
  function getCount() external view returns (uint32) {
    return _count;
  }

  /// @notice Increments the counter by a specific value
  function increment(uint32 value) external {
    _count += value;
  }

  /// @notice Decrements the counter by a specific value
  function decrement(uint32 value) external {
    require(_count >= value, "Counter: cannot decrement below zero");
    _count -= value;
  }
}
```

### An FHE counter

FHECounter.sol

FHECounter.ts

[NextFHE Operations](/protocol/examples/basic/fhe-operations)

Last updated 1 month ago