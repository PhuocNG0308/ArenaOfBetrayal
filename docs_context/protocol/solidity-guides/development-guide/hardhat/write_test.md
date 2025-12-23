# Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test

Copy

# Write FHEVM tests in Hardhat

In this section, you'll find everything you need to set up a new [Hardhat](https://hardhat.org) project and start developing FHEVM smart contracts from scratch using the [FHEVM Hardhat Plugin](https://www.npmjs.com/package/@fhevm/hardhat-plugin)

### Enabling the FHEVM Hardhat Plugin in your Hardhat project

Like any Hardhat plugin, the [FHEVM Hardhat Plugin](https://www.npmjs.com/package/@fhevm/hardhat-plugin) must be enabled by adding the following `import` statement to your `hardhat.config.ts` file:

Copy

```bash
import "@fhevm/hardhat-plugin";
```

Without this import, the Hardhat FHEVM API will **not** be available in your Hardhat runtime environment (HRE).

### Accessing the Hardhat FHEVM API

The plugin extends the standard [Hardhat Runtime Environment](https://hardhat.org/hardhat-runner/docs/advanced/hardhat-runtime-environment) (or `hre` in short) with the new `fhevm` Hardhat module.

You can access it in either of the following ways:

Copy

```bash
import { fhevm } from "hardhat";
```

or

Copy

```bash
import * as hre from "hardhat";

// Then access: hre.fhevm
```

### Encrypting Values Using the Hardhat FHEVM API

Suppose the FHEVM smart contract you want to test has a function called `foo` that takes an encrypted `uint32` value as input. The Solidity function `foo` should be declared as follows:

Copy

```bash
function foo(externalEunit32 value, bytes calldata memory inputProof);
```

Where:

* `externalEunit32 value` : is a `bytes32` representing the encrypted `uint32`
* `bytes calldata memory inputProof` : is a `bytes` array representing the zero-knowledge proof of knowledge that validates the encryption

To compute these arguments in TypeScript, you need:

* The **address of the target smart contract**
* The **signer’s address** (i.e., the account sending the transaction)

1

**Create a new encryted input**

2

**Add the value you want to encrypt.**

3

**Perform local encryption.**

4

**Call the Solidity function**

#### Encryption examples

* [Basic encryption examples](https://docs.zama.ai/protocol/examples/basic/encryption)
* [FHECounter](https://docs.zama.ai/protocol/examples#an-fhe-counter)

### Decrypting values using the Hardhat FHEVM API

Suppose user **Alice** wants to decrypt a `euint32` value that is stored in a smart contract exposing the following Solidity `view` function:

For simplicity, we assume that both Alice’s account and the target smart contract already have the necessary FHE permissions to decrypt this value. For a detailed explanation of how FHE permissions work, see the [`initializeUint32()`](https://docs.zama.ai/protocol/examples/basic/decryption/fhe-decrypt-single-value#tab-decryptsinglevalue.sol) function in [DecryptSingleValue.sol](https://docs.zama.ai/protocol/examples/basic/decryption/fhe-decrypt-single-value#tab-decryptsinglevalue.sol).

1

**Retrieve the encrypted value (a** `bytes32` **handle) from the smart contract:**

2

**Perform the decryption using the FHEVM API:**

If either the target smart contract or the user does **NOT** have FHE permissions, then the decryption call will fail!

#### Supported Decryption Types

Use the appropriate function for each encrypted data type:

Type

Function

`euintXXX`

`fhevm.userDecryptEuint(...)`

`ebool`

`fhevm.userDecryptEbool(...)`

`eaddress`

`fhevm.userDecryptEaddress(...)`

#### Decryption examples

* [Basic decryption examples](https://docs.zama.ai/protocol/examples/basic/decryption)
* [FHECounter](https://docs.zama.ai/protocol/examples#an-fhe-counter)

[PreviousHardhat plugin](/protocol/solidity-guides/development-guide/hardhat)[NextDeploy contracts and run tests](/protocol/solidity-guides/development-guide/hardhat/run_test)

Last updated 2 months ago