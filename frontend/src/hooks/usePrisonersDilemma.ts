import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config/constants'
import PrisonersDilemmaABI from '@/contracts/PrisonersDilemma.json'
import { parseEther } from 'viem'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useEthersSigner } from './useEthersSigner'

export interface TournamentData {
  tournamentId: bigint
  status: number
  startTime: bigint
  playerCount: bigint
  totalGames: bigint
  isFinished: boolean
  rounds: bigint
  prizePool: bigint
}

export interface StrategyData {
  subjects: number[]
  operators: number[]
  values: bigint[]
  isSubmitted: boolean
}

export interface VoteInfo {
  voteCount: bigint
  requiredVotes: bigint
}

// Singleton for FHEVM instance to prevent multiple initializations
let globalFhevmInstance: FhevmInstance | null = null;
let globalFhevmInitPromise: Promise<FhevmInstance> | null = null;

// Helper function to initialize FHEVM with timeout
async function initializeFhevm(): Promise<FhevmInstance> {
  if (globalFhevmInstance) {
    return globalFhevmInstance;
  }

  if (globalFhevmInitPromise) {
    return globalFhevmInitPromise;
  }

  globalFhevmInitPromise = (async () => {
    console.log("FHEVM Init: Starting initialization...");
    
    // Use /web import instead of /bundle to avoid window.relayerSDK dependency
    const { createInstance, SepoliaConfig, initSDK } = await import('@zama-fhe/relayer-sdk/web');
    
    console.log("FHEVM Init: Loaded SDK module, initializing WASM...");
    await initSDK();
    console.log("FHEVM Init: SDK initialized (WASM loaded)");

    // Create instance with SepoliaConfig
    // Use the default RPC from SepoliaConfig for reliability
    const instance = await createInstance({
      ...SepoliaConfig,
      // Only use window.ethereum if available, otherwise fallback to SepoliaConfig.network
      network: typeof window !== 'undefined' && (window as any).ethereum 
        ? (window as any).ethereum 
        : SepoliaConfig.network
    });

    console.log("FHEVM Init: Instance created successfully");
    globalFhevmInstance = instance;
    return instance;
  })();

  try {
    return await globalFhevmInitPromise;
  } catch (error) {
    // Reset promise on error so retry is possible
    globalFhevmInitPromise = null;
    throw error;
  }
}

export function usePrisonersDilemma() {
  const { address, chainId } = useAccount()
  const signer = useEthersSigner()
  const { writeContractAsync } = useWriteContract()
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(globalFhevmInstance)
  const [fhevmInitializing, setFhevmInitializing] = useState(false)
  const [fhevmError, setFhevmError] = useState<string | null>(null)
  const initAttemptedRef = useRef(false)

  useEffect(() => {
    // Only initialize on Sepolia chain
    if (chainId !== 11155111) {
      console.log("FHEVM Init: Skipping - not on Sepolia (chain ID:", chainId, ")");
      setFhevmError("Please switch to Sepolia network to use FHEVM features");
      return;
    }

    // Need address to be connected
    if (!address) {
      console.log("FHEVM Init: Wallet not connected");
      return;
    }

    // Already initialized globally
    if (globalFhevmInstance) {
      setFhevmInstance(globalFhevmInstance);
      return;
    }

    // Prevent duplicate initialization attempts
    if (initAttemptedRef.current) {
      return;
    }

    initAttemptedRef.current = true;
    setFhevmInitializing(true);
    setFhevmError(null);

    initializeFhevm()
      .then((instance) => {
        setFhevmInstance(instance);
        setFhevmError(null);
      })
      .catch((e) => {
        console.error("Failed to init FHEVM instance:", e);
        setFhevmError(e instanceof Error ? e.message : "Failed to initialize FHEVM");
        initAttemptedRef.current = false; // Allow retry
      })
      .finally(() => {
        setFhevmInitializing(false);
      });
  }, [address, chainId]);

  const { data: tournamentInfo, refetch: refetchTournament } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournamentInfo',
  })

  const tournamentData = tournamentInfo as TournamentData | undefined

  const { data: strategy, refetch: refetchStrategy } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getStrategy',
    args: address ? [address] : undefined,
  })

  const { data: voteInfo, refetch: refetchVotes } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getVoteInfo',
    args: tournamentData ? [tournamentData.tournamentId] : undefined,
  })

  const { data: hasVotedData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'hasVoted',
    args: tournamentData && address ? [tournamentData.tournamentId, address] : undefined,
  })

  const submitStrategy = async (rules: { subject: number; operator: number; value: number; action: number }[], defaultAction: number) => {
    // Check wallet connection first
    if (!address) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    // Check chain ID
    if (chainId !== 11155111) {
      throw new Error("Please switch to Sepolia network to submit a strategy.");
    }

    let instance = fhevmInstance;

    // Lazy initialize if not yet done - use the singleton helper
    if (!instance) {
      try {
        console.log("FHEVM: Lazy initializing instance...");
        instance = await initializeFhevm();
        setFhevmInstance(instance);
        console.log("FHEVM: Lazy initialization successful");
      } catch (e) {
        console.error("Failed to lazy init FHEVM instance:", e);
        throw new Error("Failed to initialize FHEVM encryption. Please refresh the page and try again.");
      }
    }

    if (!instance) {
      throw new Error("FHEVM instance not initialized. Please refresh the page and ensure you are on Sepolia network.");
    }

    // Pack actions: defaultAction (8 bits) | rule0.action (8 bits) | rule1.action (8 bits) ...
    let packedActions = BigInt(defaultAction);
    for (let i = 0; i < rules.length; i++) {
      packedActions |= BigInt(rules[i].action) << BigInt(8 * (i + 1));
    }

    const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
    input.add128(packedActions);

    // encrypt() returns { handles, inputProof }
    const encryptedResult = await input.encrypt();
    console.log("Encrypted result:", encryptedResult);
    console.log("Handle type:", typeof encryptedResult.handles[0], encryptedResult.handles[0]);
    console.log("InputProof type:", typeof encryptedResult.inputProof, encryptedResult.inputProof);

    // Helper to convert Uint8Array or other types to hex string for viem
    const toHex = (value: unknown): `0x${string}` => {
      if (typeof value === 'string') {
        return value.startsWith('0x') ? value as `0x${string}` : `0x${value}` as `0x${string}`;
      }
      if (value instanceof Uint8Array) {
        return `0x${Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
      }
      if (typeof value === 'bigint') {
        return `0x${value.toString(16).padStart(64, '0')}` as `0x${string}`;
      }
      throw new Error(`Cannot convert ${typeof value} to hex`);
    };

    const handleHex = toHex(encryptedResult.handles[0]);
    const inputProofHex = toHex(encryptedResult.inputProof);
    
    console.log("Handle hex:", handleHex);
    console.log("InputProof hex:", inputProofHex);

    const subjects = rules.map(r => r.subject)
    const operators = rules.map(r => r.operator)
    const values = rules.map(r => BigInt(r.value))

    // Pass the handle (bytes32) and inputProof separately as hex strings for viem
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'submitStrategy',
      args: [handleHex, inputProofHex, subjects, operators, values],
      value: parseEther('0.01'),
      gas: 5000000n,
    })
    return hash
  }

  const voteStartTournament = async () => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'voteStartTournament',
      gas: 200000n,
    })
    return hash
  }

  const setTournamentRounds = async (rounds: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'setTournamentRounds',
      args: [rounds],
      gas: 100000n,
    })
    return hash
  }

  const forceStartTournament = async () => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'forceStartTournament',
      gas: 200000n,
    })
    return hash
  }

  return {
    tournamentData,
    strategy: strategy as StrategyData | undefined,
    voteInfo: voteInfo as VoteInfo | undefined,
    hasVoted: hasVotedData as boolean | undefined,
    submitStrategy,
    voteStartTournament,
    forceStartTournament,
    setTournamentRounds,
    refetchTournament,
    refetchStrategy,
    refetchVotes,
    isFhevmInitialized: !!fhevmInstance,
    isFhevmInitializing: fhevmInitializing,
    fhevmError
  }
}
