# Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl/reorgs_handling

Copy

# Reorgs handling

This page provides detailed instructions on how to handle reorg risks on Ethereum when using FHEVM.

Since ACL events are propagated from the FHEVM host chain to the [Gateway](https://docs.zama.ai/protocol/protocol/overview/gateway) immediately after being included in a block, dApp developers must take special care when encrypted information is critically important. For example, if an encrypted handle conceals the private key of a Bitcoin wallet holding significant funds, we need to ensure that this information cannot inadvertently leak to the wrong person due to a reorg on the FHEVM host chain. Therefore, it's the responsibility of dApp developers to prevent such scenarios by implementing a two-step ACL authorization process with a timelock between the request and the ACL call.

## Simple example: Handling reorg risk on Ethereum

On Ethereum, a reorg can be up to 95 slots deep in the worst case, so waiting for more than 95 blocks should ensure that a previously sent transaction has been finalized—unless more than 1/3 of the nodes are malicious and willing to lose their stake, which is highly improbable.

❌ **Instead of writing this contract:**

Copy

```bash
contract PrivateKeySale {
  euint256 privateKey;
  bool isAlreadyBought = false;

  constructor(externalEuint256 _privateKey, bytes inputProof) {
    privateKey = FHE.fromExternal(_privateKey, inputProof);
    FHE.allowThis(privateKey);
  }

  function buyPrivateKey() external payable {
    require(msg.value == 1 ether, "Must pay 1 ETH");
    require(!isBought, "Private key already bought");
    isBought = true;
    FHE.allow(encryptedPrivateKey, msg.sender);
  }
}
```

Since the `privateKey`` encrypted variable contains critical information, we don't want to mistakenly leak it for free if a reorg occurs. This could happen in the previous example because we immediately grant authorization to the buyer in the same transaction that processes the sale.

✅ **We recommend writing something like this instead:**

This approach ensures that at least 96 blocks have elapsed between the transaction that purchases the private key and the transaction that authorizes the buyer to decrypt it.

This type of contract worsens the user experience by adding a timelock before users can decrypt data, so it should be used sparingly: only when leaked information could be critically important and high-value.

[PreviousACL examples](/protocol/solidity-guides/smart-contract/acl/acl_examples)[NextLogics](/protocol/solidity-guides/smart-contract/logics)

Last updated 2 months ago