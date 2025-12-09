import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config/constants'
import PrisonersDilemmaABI from '@/contracts/PrisonersDilemma.json'
import { parseEther } from 'viem'

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
  actions: number[]
  defaultAction: number
  isSubmitted: boolean
}

export interface VoteInfo {
  voteCount: bigint
  requiredVotes: bigint
}

export function usePrisonersDilemma() {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

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
    const actions = rules.map(r => r.action)
    const subjects = rules.map(r => r.subject)
    const operators = rules.map(r => r.operator)
    const values = rules.map(r => BigInt(r.value))

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'submitStrategy',
      args: [actions, defaultAction, subjects, operators, values],
      value: parseEther('0.01'), // Entry fee
      gas: 3000000n, // Explicit gas limit for FHE operations
    })
    return hash
  }

  const voteStartTournament = async () => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'voteStartTournament',
      gas: 200000n, // Reduced gas for voting
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
      gas: 150000n,
    })
    return hash
  }

  return {
    tournamentInfo,
    tournamentData,
    strategy: strategy as StrategyData | undefined,
    voteInfo: voteInfo as VoteInfo | undefined,
    hasVoted: hasVotedData as boolean | undefined,
    submitStrategy,
    voteStartTournament,
    setTournamentRounds,
    forceStartTournament,
    refetchTournament,
    refetchStrategy,
    refetchVotes,
  }
}

export function useTournamentData(tournamentId: number) {
  const { data: players } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournamentPlayers',
    args: [tournamentId],
  })

  const { data: tournament } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournament',
    args: [tournamentId],
  })

  return {
    players: players as string[] | undefined,
    tournament,
  }
}

export function usePlayerScore(tournamentId: number, playerAddress?: string) {
  const { data: score } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getPlayerScore',
    args: playerAddress ? [tournamentId, playerAddress] : undefined,
  })

  return score as bigint | undefined
}
