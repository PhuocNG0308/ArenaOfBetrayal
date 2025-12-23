# Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984/erc7984erc20wrappermock

Copy

# ERC7984 to ERC20 Wrapper

This example demonstrates how to wrap between the ERC20 token into a ERC7984 token using OpenZeppelin's smart contract library powered by ZAMA's FHEVM.

To run this example correctly, make sure the files are placed in the following directories:

* `.sol` file → `<your-project-root-dir>/contracts/`
* `.ts` file → `<your-project-root-dir>/test/`

This ensures Hardhat can compile and test your contracts as expected.

ERC7984ERC20WrapperExample.sol

Copy

```bash
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC7984ERC20Wrapper, ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

contract ERC7984ERC20WrapperExample is ERC7984ERC20Wrapper, ZamaEthereumConfig {
    constructor(
        IERC20 token,
        string memory name,
        string memory symbol,
        string memory uri
    ) ERC7984ERC20Wrapper(token) ERC7984(name, symbol, uri) {}
}
```

[PreviousERC7984 Tutorial](/protocol/examples/openzeppelin-confidential-contracts/erc7984/erc7984-tutorial)[NextSwap ERC7984 to ERC20](/protocol/examples/openzeppelin-confidential-contracts/erc7984/swaperc7984toerc20)

Last updated 12 days ago