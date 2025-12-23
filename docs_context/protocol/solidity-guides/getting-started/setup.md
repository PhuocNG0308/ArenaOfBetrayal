# Source: https://docs.zama.org/protocol/solidity-guides/getting-started/setup

Copy

# Set up Hardhat

In this section, you’ll learn how to set up a FHEVM Hardhat development environment using the **FHEVM Hardhat template** as a starting point for building and testing fully homomorphic encrypted smart contracts.

## Create a local Hardhat Project

1

#### Install a Node.js TLS version

Ensure that Node.js is installed on your machine.

* Download and install the recommended LTS (Long-Term Support) version from the [official website](https://nodejs.org/en).
* Use an **even-numbered** version (e.g., `v18.x`, `v20.x`)

**Hardhat** does not support odd-numbered Node.js versions. If you’re using one (e.g., v21.x, v23.x), Hardhat will display a persistent warning message and may behave unexpectedly.

To verify your installation:

Copy

```bash
node -v
npm -v
```

2

#### Create a new GitHub repository from the FHEVM Hardhat template.

1. On GitHub, navigate to the main page of the [FHEVM Hardhat template](https://github.com/zama-ai/fhevm-hardhat-template) repository.
2. Above the file list, click the green **Use this template** button.
3. Follow the instructions to create a new repository from the FHEVM Hardhat template.

See Github doc: [Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template)

3

#### Clone your newly created GitHub repository locally

Now that your GitHub repository has been created, you can clone it to your local machine:

Copy

```bash
cd <your-preferred-location>
git clone <url-to-your-new-repo>

# Navigate to the root of your new FHEVM Hardhat project
cd <your-new-repo-name>
```

Next, let’s install your local Hardhat development environment.

4

#### Install your FHEVM Hardhat project dependencies

From the project root directory, run:

Copy

```bash
npm install
```

This will install all required dependencies defined in your `package.json`, setting up your local FHEVM Hardhat development environment.

5

#### Set up the Hardhat configuration variables (optional)

If you do plan to deploy to the Sepolia Ethereum Testnet, you'll need to set up the following [Hardhat Configuration variables](https://hardhat.org/hardhat-runner/docs/guides/configuration-variables).

`MNEMONIC`

A mnemonic is a 12-word seed phrase used to generate your Ethereum wallet keys.

1. Get one by creating a wallet with [MetaMask](https://metamask.io/), or using any trusted mnemonic generator.
2. Set it up in your Hardhat project:

Copy

```bash
npx hardhat vars set MNEMONIC
```

`INFURA_API_KEY`

The INFURA project key allows you to connect to Ethereum testnets like Sepolia.

1. Obtain one by following the [Infura + MetaMask](https://docs.metamask.io/services/get-started/infura/) setup guide.
2. Configure it in your project:

Copy

```bash
npx hardhat vars set INFURA_API_KEY
```

**Default Values**

If you skip this step, Hardhat will fall back to these defaults:

* `MNEMONIC` = "test test test test test test test test test test test junk"
* `INFURA_API_KEY` = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"

These defaults are not suitable for real deployments.

#### Missing variable error:

If any of the requested Hardhat Configuration Variables is missing, you'll get an error message like this one:`Error HH1201: Cannot find a value for the configuration variable 'MNEMONIC'. Use 'npx hardhat vars set MNEMONIC' to set it or 'npx hardhat var setup' to list all the configuration variables used by this project.`

Congratulations! You're all set to start building your confidential dApp.

## Optional settings

### Install VSCode extensions

If you're using Visual Studio Code, there are some extensions available to improve you your development experience:

* [Prettier - Code formatter by prettier.io](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) — ID:`esbenp.prettier-vscode`,
* [ESLint by Microsoft](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) — ID:`dbaeumer.vscode-eslint`

Solidity support (pick one only):

* [Solidity by Juan Blanco](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity) — ID:`juanblanco.solidity`
* [Solidity by Nomic Foundation](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity) — ID:`nomicfoundation.hardhat-solidity`

### Reset the Hardhat project

If you'd like to start from a clean slate, you can reset your FHEVM Hardhat project by removing all example code and generated files.

Then run:

[PreviousWhat is FHEVM Solidity](/protocol/solidity-guides/getting-started/overview)[NextQuick start tutorial](/protocol/solidity-guides/getting-started/quick-start-tutorial)

Last updated 2 months ago