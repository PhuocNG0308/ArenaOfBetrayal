import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config/constants'
import PrisonersDilemmaABI from '@/contracts/PrisonersDilemma.json'
import { parseEther, toHex } from 'viem'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web'
import { useEffect, useState } from 'react'
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

export function usePrisonersDilemma() {
  const { address, chainId } = useAccount()
  const signer = useEthersSigner()
  const { writeContractAsync } = useWriteContract()
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null)

  useEffect(() => {
    const initFhevm = async () => {
      if (!signer) {
        console.log("FHEVM Init: Signer not ready");
        return;
      }
      if (chainId !== 11155111) {
        console.log("FHEVM Init: Wrong chain ID", chainId);
        return;
      }

      try {
        console.log("FHEVM Init: Starting initialization...");
        const { createInstance, SepoliaConfig, initSDK } = await import('@zama-fhe/relayer-sdk/web');
        
        await initSDK();
        console.log("FHEVM Init: SDK initialized (WASM loaded)");

        const instance = await createInstance({
          ...SepoliaConfig,
          network: (window as any).ethereum || SepoliaConfig.network
        });

        console.log("FHEVM Init: Instance created successfully", instance);
        setFhevmInstance(instance);
      } catch (e) {
        console.error("Failed to init FHEVM instance:", e);
      }
    };
    initFhevm();
  }, [signer, chainId]);

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
    let instance = fhevmInstance;

    if (!instance && address && chainId === 11155111) {
      try {
        console.log("FHEVM: Lazy initializing instance...");
        const { createInstance, SepoliaConfig, initSDK } = await import('@zama-fhe/relayer-sdk/web');
        await initSDK();
        instance = await createInstance({
          ...SepoliaConfig,
          network: (window as any).ethereum || SepoliaConfig.network
        });
        setFhevmInstance(instance);
      } catch (e) {
        console.error("Failed to lazy init FHEVM instance:", e);
      }
    }

    if (!instance || !address) {
      throw new Error("FHEVM instance not initialized or wallet not connected");
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

    const subjects = rules.map(r => r.subject)
    const operators = rules.map(r => r.operator)
    const values = rules.map(r => BigInt(r.value))

    // Pass the handle (bytes32) and inputProof separately
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'submitStrategy',
      args: [encryptedResult.handles[0], toHex(encryptedResult.inputProof), subjects, operators, values],
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
    isFhevmInitialized: !!fhevmInstance
  }
}
