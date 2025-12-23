# Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_task

Copy

# Write FHEVM-enabled Hardhat Tasks

In this section, you'll learn how to write a custom FHEVM Hardhat task.

Writing tasks is a gas-efficient and flexible way to test your FHEVM smart contracts on the Sepolia network. Creating a custom task is straightforward.

## Prerequisite

* You should be familiar with Hardhat tasks. If you're new to them, refer to the [Hardhat Tasks official documentation](https://hardhat.org/hardhat-runner/docs/guides/tasks#writing-tasks).
* You should have already **completed** the [FHEVM Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup).
* This page provides a step-by-step walkthrough of the `task:decrypt-count` tasks included in the file [tasks/FHECounter.ts](https://github.com/zama-ai/fhevm-hardhat-template/blob/main/tasks/FHECounter.ts) file, located in the [fhevm-hardhat-template](https://github.com/zama-ai/fhevm-hardhat-template) repository.

1

## A Basic Hardhat Task.

Let’s start with a simple example: fetching the current counter value from a basic `Counter.sol` contract.

If you're already familiar with Hardhat and custom tasks, the TypeScript code below should look familiar and be easy to follow:

Copy

```bash
task("task:get-count", "Calls the getCount() function of Counter Contract")
  .addOptionalParam("address", "Optionally specify the Counter contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const CounterDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("Counter");
    console.log(`Counter: ${CounterDeployement.address}`);

    const counterContract = await ethers.getContractAt("Counter", CounterDeployement.address);

    const clearCount = await counterContract.getCount();

    console.log(`Clear count    : ${clearCount}`);
});
```

Now, let’s modify this task to work with FHEVM encrypted values.

2

## Comment Out Existing Logic and rename

First, comment out the existing logic so we can incrementally add the necessary changes for FHEVM integration.

Copy

```bash
task("task:get-count", "Calls the getCount() function of Counter Contract")
  .addOptionalParam("address", "Optionally specify the Counter contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    // const { ethers, deployments } = hre;

    // const CounterDeployement = taskArguments.address
    //   ? { address: taskArguments.address }
    //   : await deployments.get("Counter");
    // console.log(`Counter: ${CounterDeployement.address}`);

    // const counterContract = await ethers.getContractAt("Counter", CounterDeployement.address);

    // const clearCount = await counterContract.getCount();

    // console.log(`Clear count    : ${clearCount}`);
});
```

Next, rename the task by replacing:

Copy

```bash
task("task:get-count", "Calls the getCount() function of Counter Contract")
```

With:

Copy

```bash
task("task:decrypt-count", "Calls the getCount() function of Counter Contract")
```

This updates the task name from `task:get-count` to `task:decrypt-count`, reflecting that it now includes decryption logic for FHE-encrypted values.

3

## Initialize FHEVM CLI API

Replace the line:

Copy

```bash
    // const { ethers, deployments } = hre;
```

With:

Copy

```bash
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();
```

Calling `initializeCLIApi()` is essential. Unlike built-in Hardhat tasks like `test` or `compile`, which automatically initialize the FHEVM runtime environment, custom tasks require you to call this function explicitly. **Make sure to call it at the very beginning of your task** to ensure the environment is properly set up.

4

## Call the view function `getCount` from the FHECounter contract

Replace the following commented-out lines:

Copy

```bash
    // const CounterDeployement = taskArguments.address
    //   ? { address: taskArguments.address }
    //   : await deployments.get("Counter");
    // console.log(`Counter: ${CounterDeployement.address}`);

    // const counterContract = await ethers.getContractAt("Counter", CounterDeployement.address);

    // const clearCount = await counterContract.getCount();
```

With the FHEVM equivalent:

Copy

```bash
    const FHECounterDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHECounter");
    console.log(`FHECounter: ${FHECounterDeployement.address}`);

    const fheCounterContract = await ethers.getContractAt("FHECounter", FHECounterDeployement.address);

    const encryptedCount = await fheCounterContract.getCount();
    if (encryptedCount === ethers.ZeroHash) {
      console.log(`encrypted count: ${encryptedCount}`);
      console.log("clear count    : 0");
      return;
    }
```

Here, `encryptedCount` is an FHE-encrypted `euint32` primitive. To retrieve the actual value, we need to decrypt it in the next step.

5

## Decrypt the encrypted count value.

Now replace the following commented-out line:

Copy

```bash
    // console.log(`Clear count    : ${clearCount}`);
```

With the decryption logic:

Copy

```bash
    const signers = await ethers.getSigners();
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      FHECounterDeployement.address,
      signers[0],
    );
    console.log(`Encrypted count: ${encryptedCount}`);
    console.log(`Clear count    : ${clearCount}`);
```

At this point, your custom Hardhat task is fully configured to work with FHE-encrypted values and ready to run!

6

## Step 6: Run your custom task using Hardhat Node

**Start the Local Hardhat Node:**

* Open a new terminal window.
* From the root project directory, run the following:

Copy

```bash
npx hardhat node
```

**Deploy the FHECounter smart contract on the local Hardhat Node**

Copy

```bash
npx hardhat deploy --network localhost
```

**Run your custom task**

Copy

```bash
npx hardhat task:decrypt-count --network localhost
```

7

## Step 7: Run your custom task using Sepolia

**Deploy the FHECounter smart contract on Sepolia Testnet (if not already deployed)**

Copy

```bash
npx hardhat deploy --network sepolia
```

**Execute your custom task**

Copy

```bash
npx hardhat task:decrypt-count --network sepolia
```

[PreviousDeploy contracts and run tests](/protocol/solidity-guides/development-guide/hardhat/run_test)[NextFoundry](/protocol/solidity-guides/development-guide/foundry)

Last updated 2 months ago