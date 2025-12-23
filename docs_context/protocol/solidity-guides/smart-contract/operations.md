# Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/operations

Copy

# Operations on encrypted types

This document outlines the operations supported on encrypted types in the `FHE` library, enabling arithmetic, bitwise, comparison, and more on Fully Homomorphic Encryption (FHE) ciphertexts.

## Arithmetic operations

The following arithmetic operations are supported for encrypted integers (`euintX`):

Name

Function name

Symbol

Type

Add

`FHE.add`

`+`

Binary

Subtract

`FHE.sub`

`-`

Binary

Multiply

`FHE.mul`

`*`

Binary

Divide (plaintext divisor)

`FHE.div`

Binary

Reminder (plaintext divisor)

`FHE.rem`

Binary

Negation

`FHE.neg`

`-`

Unary

Min

`FHE.min`

Binary

Max

`FHE.max`

Binary

Division (FHE.div) and remainder (FHE.rem) operations are currently supported only with plaintext divisors.

## Bitwise operations

The FHE library also supports bitwise operations, including shifts and rotations:

Name

Function name

Symbol

Type

Bitwise AND

`FHE.and`

`&`

Binary

Bitwise OR

`FHE.or`

`|`

Binary

Bitwise XOR

`FHE.xor`

`^`

Binary

Bitwise NOT

`FHE.not`

`~`

Unary

Shift Right

`FHE.shr`

Binary

Shift Left

`FHE.shl`

Binary

Rotate Right

`FHE.rotr`

Binary

Rotate Left

`FHE.rotl`

Binary

The shift operators `FHE.shr` and `FHE.shl` can take any encrypted type `euintX` as a first operand and either a `uint8`or a `euint8` as a second operand, however the second operand will always be computed modulo the number of bits of the first operand. For example, `FHE.shr(euint64 x, 70)` is equivalent to `FHE.shr(euint64 x, 6)` because `70 % 64 = 6`. This differs from the classical shift operators in Solidity, where there is no intermediate modulo operation, so for instance any `uint64` shifted right via `>>` would give a null result.

## Comparison operations

Encrypted integers can be compared using the following functions:

Name

Function name

Symbol

Type

Equal

`FHE.eq`

Binary

Not equal

`FHE.ne`

Binary

Greater than or equal

`FHE.ge`

Binary

Greater than

`FHE.gt`

Binary

Less than or equal

`FHE.le`

Binary

Less than

`FHE.lt`

Binary

## Ternary operation

The `FHE.select` function is a ternary operation that selects one of two encrypted values based on an encrypted condition:

Name

Function name

Symbol

Type

Select

`FHE.select`

Ternary

## Random operations

You can generate cryptographically secure random numbers fully on-chain:

**Name**

**Function Name**

**Symbol**

**Type**

Random Unsigned Integer

`FHE.randEuintX()`

Random

For more details, refer to the [Random Encrypted Numbers](/protocol/solidity-guides/smart-contract/operations/random) document.

## Best Practices

Here are some best practices to follow when using encrypted operations in your smart contracts:

### Use the appropriate encrypted type size

Choose the smallest encrypted type that can accommodate your data to optimize gas costs. For example, use `euint8` for small numbers (0-255) rather than `euint256`.

❌ Avoid using oversized types:

✅ Instead, use the smallest appropriate type:

### Use scalar operands when possible to save gas

Some FHE operators exist in two versions: one where all operands are ciphertexts handles, and another where one of the operands is an unencrypted scalar. Whenever possible, use the scalar operand version, as this will save a lot of gas.

❌ For example, this snippet cost way more in gas:

✅ Than this one:

Despite both leading to the same encrypted result!

### Beware of overflows of FHE arithmetic operators

FHE arithmetic operators can overflow. Do not forget to take into account such a possibility when implementing FHEVM smart contracts.

❌ For example, if you wanted to create a mint function for an encrypted ERC20 token with an encrypted `totalSupply` state variable, this code is vulnerable to overflows:

✅ But you can fix this issue by using `FHE.select` to cancel the mint in case of an overflow:

Notice that we did not check separately the overflow on `balances[msg.sender]` but only on `totalSupply` variable, because `totalSupply` is the sum of the balances of all the users, so `balances[msg.sender]` could never overflow if `totalSupply` did not.

[PreviousSupported types](/protocol/solidity-guides/smart-contract/types)[NextCasting and trivial encryption](/protocol/solidity-guides/smart-contract/operations/casting)

Last updated 2 months ago