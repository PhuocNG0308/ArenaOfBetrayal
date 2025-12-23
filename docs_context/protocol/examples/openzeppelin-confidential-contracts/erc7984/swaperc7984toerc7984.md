# Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984/swaperc7984toerc7984

Copy

# Swap ERC7984 to ERC7984

This example demonstrates how to swap between a confidential token - the ERC7984 and the ERC20 tokens using OpenZeppelin's smart contract library powered by ZAMA's FHEVM.

To run this example correctly, make sure the files are placed in the following directories:

* `.sol` file → `<your-project-root-dir>/contracts/`
* `.ts` file → `<your-project-root-dir>/test/`

This ensures Hardhat can compile and test your contracts as expected.

SwapERC7984ToERC20.sol

Copy

```bash
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

contract SwapERC7984ToERC7984 {
    function swapConfidentialForConfidential(
        IERC7984 fromToken,
        IERC7984 toToken,
        externalEuint64 amountInput,
        bytes calldata inputProof
    ) public virtual {
        require(fromToken.isOperator(msg.sender, address(this)));

        euint64 amount = FHE.fromExternal(amountInput, inputProof);

        FHE.allowTransient(amount, address(fromToken));
        euint64 amountTransferred = fromToken.confidentialTransferFrom(msg.sender, address(this), amount);

        FHE.allowTransient(amountTransferred, address(toToken));
        toToken.confidentialTransfer(msg.sender, amountTransferred);
    }
}
```

[PreviousSwap ERC7984 to ERC20](/protocol/examples/openzeppelin-confidential-contracts/erc7984/swaperc7984toerc20)[NextVesting Wallet](/protocol/examples/openzeppelin-confidential-contracts/vesting-wallet)

Last updated 12 days ago