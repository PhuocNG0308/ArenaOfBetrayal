# Deploying to Vercel

This frontend is ready to be deployed on [Vercel](https://vercel.com).

## Prerequisites

- A GitHub account with this repository pushed to it.
- A Vercel account.

## Steps

1.  **Log in to Vercel** and click **"Add New..."** -> **"Project"**.
2.  **Import** your `ArenaOfBetrayal` repository.
3.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: Click "Edit" and select `frontend`. **This is crucial.**
4.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add `NEXT_PUBLIC_CONTRACT_ADDRESS` with your deployed Sepolia contract address (e.g., `0x63bf4C43a6Eb92C4c4e636f0B721426F92dA8d2e`).
5.  **Deploy**: Click "Deploy".

## Important Notes

### 1. FHE & COOP/COEP Headers
The application uses Fully Homomorphic Encryption (FHE) which relies on WebAssembly (WASM) and multi-threading. This requires specific HTTP headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`).

These are **already configured** in `next.config.js`. Vercel will serve the application with these headers automatically.

### 2. The Oracle
Vercel **only hosts the frontend interface**.

The **Oracle** (which computes the game results) **cannot run on Vercel** because it is a long-running process that needs to listen to blockchain events.

You must run the Oracle separately:
*   **Option A (Local)**: Keep your local terminal running `npx hardhat pd:run-oracle ...`
*   **Option B (VPS)**: Deploy the Oracle script to a VPS (like AWS EC2, DigitalOcean, etc.) using `pm2` or Docker.

### 3. Contract ABI
If you modify and redeploy the smart contract, make sure to copy the new ABI from `artifacts/contracts/PrisonersDilemma.sol/PrisonersDilemma.json` to `frontend/src/contracts/PrisonersDilemma.json` and push the changes before redeploying the frontend.
