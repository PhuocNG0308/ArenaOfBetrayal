# Arena of Betrayal - FHE Prisoner's Dilemma Tournament

A Prisoner's Dilemma tournament game with Fully Homomorphic Encryption (FHE) on Ethereum Sepolia testnet. Players submit encrypted strategies that remain hidden until tournament completion.

## 🎮 Demo Live

**Contract Address (Sepolia):** `0x63bf4C43a6Eb92C4c4e636f0B721426F92dA8d2e`

[View on Etherscan](https://sepolia.etherscan.io/address/0x63bf4C43a6Eb92C4c4e636f0B721426F92dA8d2e)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager
- **MetaMask**: Browser wallet with Sepolia ETH

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Set the required Hardhat variables:

```bash
# Set your wallet mnemonic (12-word seed phrase)
npx hardhat vars set MNEMONIC

# Set your Infura API key for network access
npx hardhat vars set INFURA_API_KEY

# Optional: Set Etherscan API key for contract verification
npx hardhat vars set ETHERSCAN_API_KEY
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Deploy to Sepolia Testnet

```bash
npx hardhat deploy --network sepolia
```

After deployment, note the contract address from the console output.

### 5. Configure Frontend Environment

**Important:** Create a `.env` file in the `frontend/` folder based on the example:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` and set your deployed contract address:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x63bf4C43a6Eb92C4c4e636f0B721426F92dA8d2e
```

### 6. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚠️ Important: Oracle Setup on Sepolia

The Oracle **must be deployed on Sepolia** to interact with FHE encrypted data. Even if you run the Oracle script from your local machine, it operates on the Sepolia network.

### What the Oracle Does

- Reads encrypted strategies from the Sepolia contract
- Decrypts player strategies using Zama's FHE infrastructure
- Simulates all Prisoner's Dilemma games
- Publishes results back to the Sepolia blockchain

### Running Oracle (Sepolia Network)

```bash
# Run the Oracle task on Sepolia (requires MNEMONIC with Sepolia ETH)
npx hardhat pd:run-oracle --contract 0x63bf4C43a6Eb92C4c4e636f0B721426F92dA8d2e --network sepolia
```

> **Note:** The Oracle wallet needs Sepolia ETH to pay gas fees for publishing results.

---

## 📁 Project Structure

```
├── contracts/           # Solidity smart contracts
│   └── PrisonersDilemma.sol
├── deploy/              # Deployment scripts
├── frontend/            # Next.js web application
│   └── src/
│       ├── app/         # Pages
│       ├── components/  # React components
│       ├── hooks/       # Custom hooks (FHEVM integration)
│       └── config/      # Configuration
├── tasks/               # Hardhat tasks (Oracle, etc.)
├── test/                # Contract tests
└── hardhat.config.ts    # Hardhat configuration
```

---

## 🎮 How to Play

1. **Connect Wallet**: Connect MetaMask to Sepolia network
2. **Submit Strategy**: Build your strategy using conditions and actions
3. **Pay Entry Fee**: 0.01 ETH to join the tournament
4. **Vote to Start**: Vote when ready to start the tournament
5. **Wait for Results**: Oracle computes games off-chain
6. **Claim Prize**: Winners can claim their ETH prizes

---

## 🔐 How FHE Powers Provably Fair Games

### The Trust Problem in Private Game State

In traditional blockchain games, there's a fundamental dilemma:

| Approach | Problem |
|----------|---------|
| **On-chain (public)** | Everyone sees your strategy → opponents can exploit it |
| **Off-chain (private)** | Server can cheat → no verifiability |
| **Commit-reveal** | Requires 2+ transactions → complex UX, timing attacks |

**FHE Solution:** Players submit encrypted strategies that:
- ✅ Remain private on-chain (no one can read them)
- ✅ Can be computed on without decryption
- ✅ Are verifiably correct (blockchain guarantees)

### FHE Architecture Flow (High-Level)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Player    │     │   Smart Contract │     │     Oracle      │
│  (Browser)  │     │    (Sepolia)     │     │   (Off-chain)   │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                     │                        │
       │ 1. Encrypt strategy │                        │
       │    (client-side)    │                        │
       │────────────────────>│                        │
       │                     │                        │
       │                     │ 2. Store encrypted     │
       │                     │    ciphertext on-chain │
       │                     │                        │
       │                     │ 3. Tournament starts   │
       │                     │────────────────────────>
       │                     │                        │
       │                     │ 4. Oracle decrypts     │
       │                     │    & computes games    │
       │                     │                        │
       │                     │<───────────────────────│
       │                     │ 5. Publish results     │
       │                     │                        │
       │<────────────────────│                        │
       │ 6. Claim prizes     │                        │
```

---

## 🧠 Deep Dive: FHE Patterns and Practical Notes

### FHE vs Commit-Reveal — Short Technical Explanation

| Feature | Commit-Reveal | FHE (Zama FHEVM) |
|---------|---------------|------------------|
| **Privacy during game** | Hash only (value hidden) | Fully encrypted value |
| **Computation on private data** | ❌ Must reveal first | ✅ Compute on ciphertext |
| **Number of transactions** | 2 (commit + reveal) | 1 (submit encrypted) |
| **Timing attacks** | Possible (reveal timing) | Not applicable |
| **Trust model** | Users must reveal | Oracle/KMS decrypts |

**Commit-Reveal:**
```
1. Player commits: hash(strategy + salt)
2. Wait for all players
3. Player reveals: strategy + salt
4. Contract verifies hash
```
*Problem: Complex coordination, reveal timing can leak info*

**FHE Approach:**
```
1. Player encrypts strategy with FHE public key
2. Contract stores ciphertext
3. Oracle decrypts when authorized
4. Results published
```
*Advantage: Single transaction, no reveal phase*

### Meaningful FHE Usage (Summary)

FHE is **most valuable** when you need:

1. **Private state that affects game logic** — Hidden strategies, secret bids
2. **Computation on encrypted data** — Without revealing intermediate values
3. **Trustless privacy** — No single party can see private data

FHE is **overkill** for:
- Simple random number generation (use VRF)
- Public game state
- Data that will be revealed immediately

---

## 💻 Practical Code Examples (Common Patterns)

### Pattern 1: Encrypting Input (Client-Side)

```typescript
import { createInstance, SepoliaConfig, initSDK } from '@zama-fhe/relayer-sdk/web';

// Initialize FHEVM
await initSDK();
const instance = await createInstance({
  ...SepoliaConfig,
  network: window.ethereum
});

// Create encrypted input for contract
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add128(BigInt(strategyValue));  // Encrypt a 128-bit value

const { handles, inputProof } = await input.encrypt();

// Submit to contract
await contract.submitStrategy(handles[0], inputProof, ...otherArgs);
```

### Pattern 2: Storing Encrypted Data (Solidity)

```solidity
import "@fhevm/solidity/lib/FHE.sol";

contract PrivateGame {
    mapping(address => euint128) private encryptedStrategies;
    
    function submitStrategy(
        externalEuint128 encryptedHandle,
        bytes calldata inputProof
    ) external {
        // Convert external handle to on-chain encrypted value
        euint128 strategy = FHE.fromExternal(encryptedHandle, inputProof);
        
        // Set ACL permissions
        FHE.allowThis(strategy);           // Contract can use it
        FHE.allow(strategy, msg.sender);   // Player can decrypt their own
        FHE.allow(strategy, oracleAddress); // Oracle can decrypt for computation
        
        encryptedStrategies[msg.sender] = strategy;
    }
}
```

### Pattern 3: User Decryption (Read Own Private Data)

```typescript
// Generate keypair for decryption
const keypair = instance.generateKeypair();

// Create EIP-712 signature for authorization
const eip712 = instance.createEIP712(
  keypair.publicKey,
  [contractAddress],
  startTimestamp,
  durationDays
);

const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message
);

// Decrypt the value
const result = await instance.userDecrypt(
  [{ handle: ciphertextHandle, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace('0x', ''),
  [contractAddress],
  userAddress,
  startTimestamp,
  durationDays
);

const decryptedValue = result[ciphertextHandle];
```

### Pattern 4: Public Decryption (Reveal to Everyone)

```typescript
const handles = [
  '0x830a61b343d2f3de67ec59cb18961fd086085c1c73ff0000000000aa36a70000',
  '0x98ee526413903d4613feedb9c8fa44fe3f4ed0dd00ff0000000000aa36a70400',
];

const results = await instance.publicDecrypt(handles);

// results.clearValues = {
//   '0x830a...': decryptedValue1,
//   '0x98ee...': decryptedValue2,
// }
```

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run contract tests |
| `npm run deploy:sepolia` | Deploy to Sepolia |
| `npm run clean` | Clean build artifacts |

---

## 📚 Documentation

- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [Zama Relayer SDK](https://docs.zama.ai/protocol/relayer-sdk-guides)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Sepolia Faucet](https://sepoliafaucet.com)

---

## 📄 License

BSD-3-Clause-Clear License
