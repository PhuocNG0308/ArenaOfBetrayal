# Source: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input

Copy

# Input

This document explains how to register ciphertexts to the FHEVM. Registering ciphertexts to the FHEVM allows for future use on-chain using the `FHE.fromExternal` solidity function. All values encrypted for use with the FHEVM are encrypted under a public key of the protocol.

Copy

```bash
// We first create a buffer for values to encrypt and register to the fhevm
const buffer = instance.createEncryptedInput(
  // The address of the contract allowed to interact with the "fresh" ciphertexts
  contractAddress,
  // The address of the entity allowed to import ciphertexts to the contract at `contractAddress`
  userAddress,
);

// We add the values with associated data-type method
buffer.add64(BigInt(23393893233));
buffer.add64(BigInt(1));
// buffer.addBool(false);
// buffer.add8(BigInt(43));
// buffer.add16(BigInt(87));
// buffer.add32(BigInt(2339389323));
// buffer.add128(BigInt(233938932390));
// buffer.addAddress('0xa5e1defb98EFe38EBb2D958CEe052410247F4c80');
// buffer.add256(BigInt('2339389323922393930'));

// This will encrypt the values, generate a proof of knowledge for it, and then upload the ciphertexts using the relayer.
// This action will return the list of ciphertext handles.
const ciphertexts = await buffer.encrypt();
```

With a contract `MyContract` that implements the following it is possible to add two "fresh" ciphertexts.

With `my_contract` the contract in question using `ethers` it is possible to call the add function as following.

[PreviousInitialization](/protocol/relayer-sdk-guides/fhevm-relayer/initialization)[NextDecryption](/protocol/relayer-sdk-guides/fhevm-relayer/decryption)

Last updated 19 days ago