import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config/constants'
import PrisonersDilemmaABI from '@/contracts/PrisonersDilemma.json'

export interface TournamentData {
  tournamentId: bigint
  status: number
  startTime: bigint
  playerCount: bigint
  totalGames: bigint
  isFinished: boolean
  rounds: bigint
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

  const { data: strategy } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getStrategy',
    args: address ? [address] : undefined,
  })

  const submitStrategy = async (rules: unknown[], defaultAction: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'submitStrategy',
      args: [rules, defaultAction],
      gas: 500000n,
      maxFeePerGas: 50000000000n, // 50 Gwei
      maxPriorityFeePerGas: 2000000000n, // 2 Gwei
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
      maxFeePerGas: 50000000000n, // 50 Gwei
      maxPriorityFeePerGas: 2000000000n, // 2 Gwei
    })
    return hash
  }

  const forceStartTournament = async () => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'forceStartTournament',
      gas: 200000n,
      maxFeePerGas: 50000000000n, // 50 Gwei
      maxPriorityFeePerGas: 2000000000n, // 2 Gwei
    })
    return hash
  }

  return {
    tournamentInfo,
    tournamentData,
    strategy,
    submitStrategy,
    setTournamentRounds,
    forceStartTournament,
    refetchTournament
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
