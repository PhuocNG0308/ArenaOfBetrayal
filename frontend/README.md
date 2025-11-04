# Arena of Betrayal Frontend

A Next.js frontend for the FHE-powered Prisoner's Dilemma tournament, featuring custom strategy builder and complete privacy through Fully Homomorphic Encryption.

## 🎮 New Features

### Custom Strategy Builder
- **Build Your Own Strategy**: Create conditional rules instead of choosing predefined strategies
- **Rule-Based Logic**: Define conditions (RoundNumber, LastMove, TotalDefects, etc.) and actions
- **Unlimited Complexity**: Add as many rules as needed for your perfect strategy
- **Default Action**: Set fallback behavior when no rules match

### FHE Privacy Features
- **Encrypted Strategies**: All strategies are encrypted with FHE before submission
- **View Encrypted Data**: See FHE ciphertext on-chain while actual strategy remains hidden
- **On-Chain Verification**: Link to Etherscan to verify encrypted data storage
- **Privacy Guaranteed**: No one can see your strategy until tournament completes

### Unlimited Players
- **No Player Limit**: Anyone can join - the more, the merrier!
- **Live Player List**: See all participants and their encrypted strategies
- **Round-Robin Format**: Every player faces every other player fairly

### Enhanced UI/UX
- **Real-time Updates**: Live tournament status and player count
- **Loading States**: Clear feedback during blockchain interactions
- **Hydration Fix**: Proper client-side rendering for wallet connection
- **Responsive Design**: Works perfectly on desktop and mobile

## Features

- 🦊 MetaMask wallet connection via Wagmi v2
- 🎮 Custom strategy builder with conditional rules
- 📊 Real-time tournament information
- 👥 Live player list with FHE encrypted data viewer
- 🏆 Leaderboard with results after tournament
- ⚙️ Admin controls (set rounds 10-1000, force start)
- 🔐 Complete privacy through Zama FHEVM
- 🎨 Dark theme with modern gradients
- 📱 Fully responsive design

## Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Deployed PrisonersDilemma contract on Sepolia

## Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your contract address:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

### Quick Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/arena-of-betrayal)

### Option 1: Vercel Dashboard (GitHub Integration)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add frontend"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory
   - Configure environment variables:
     - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your deployed PrisonersDilemma contract address
   - Click "Deploy"

3. **Update Environment Variables** (if contract redeployed):
   - Go to Project Settings → Environment Variables
   - Update `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - Redeploy from Deployments tab

### Option 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```

3. **Follow prompts**:
   - Set up and deploy: `Y`
   - Link to existing project: Choose or create new
   - Add environment variables when prompted
   - Deploy to production: `Y`

4. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
   # Enter your contract address when prompted
   ```

5. **Redeploy with env vars**:
   ```bash
   vercel --prod
   ```

### Post-Deployment

- Your site will be live at: `https://your-project.vercel.app`
- Vercel provides automatic HTTPS and CDN
- Each push to `main` branch triggers automatic deployment
- Preview deployments created for PRs

### Environment Variables on Vercel

In your Vercel project settings:
1. Go to "Settings" → "Environment Variables"
2. Add `NEXT_PUBLIC_CONTRACT_ADDRESS` with your contract address
3. Redeploy for changes to take effect

## Contract Deployment

Before using the frontend, deploy the contract:

```bash
# In the parent directory
cd ..

# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Copy the deployed address to frontend/.env.local
```

## Supported Networks

- **Hardhat Localhost** (Chain ID: 31337)
- **Sepolia Testnet** (Chain ID: 11155111)

Switch networks in MetaMask to match your deployed contract.

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks (contract interactions)
│   ├── config/          # Contract address and constants
│   └── contracts/       # Contract ABI
├── public/              # Static assets
└── package.json
```

## Key Components

- **ConnectWallet**: MetaMask connection button
- **StrategySelector**: Submit your strategy to the tournament
- **TournamentInfo**: View current tournament status
- **TournamentControls**: Admin panel (rounds, force start)
- **Leaderboard**: Tournament results and rankings

## Troubleshooting

### "Contract not deployed" error
- Ensure the contract address in `.env.local` is correct
- Verify you're connected to the right network (Sepolia/localhost)

### MetaMask connection issues
- Check that MetaMask is installed and unlocked
- Ensure you're on a supported network
- Try refreshing the page

### Build errors
- Delete `.next` folder and node_modules
- Run `npm install` again
- Check Node.js version (18+ required)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Web3**: Wagmi v2, Ethers.js v6
- **State**: React Query (@tanstack/react-query)
- **Icons**: Lucide React
- **Language**: TypeScript

## License

Same as parent project
