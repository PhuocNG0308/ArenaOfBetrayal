'use client'

import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config/constants'
import PrisonersDilemmaABI from '@/contracts/PrisonersDilemma.json'
import { Trophy, Medal, Award, Gift, Loader2, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useState, useEffect, useMemo } from 'react'
import { formatEther } from 'viem'

interface PlayerRowProps {
  tournamentId: bigint
  address: string
  rank: number
  score: bigint
  isCurrentUser: boolean
}

function PlayerScoreRow({ tournamentId, address, rank, score, isCurrentUser }: PlayerRowProps) {
  const { t } = useLanguage()

  const getRankIcon = (rankNum: number) => {
    switch (rankNum) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />
      case 2:
        return <Medal className="text-gray-400" size={24} />
      case 3:
        return <Award className="text-orange-600" size={24} />
      default:
        return <span className="text-gray-500 font-bold text-lg">{rankNum}</span>
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
        rank === 1
          ? 'bg-yellow-900/20 border-yellow-700'
          : rank === 2
          ? 'bg-gray-700/20 border-gray-600'
          : rank === 3
          ? 'bg-orange-900/20 border-orange-700'
          : 'bg-gray-800/20 border-gray-700'
      } ${isCurrentUser ? 'ring-2 ring-primary-500' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 flex justify-center">
          {getRankIcon(rank)}
        </div>
        <div>
          <p className="font-mono text-white">
            {formatAddress(address)}
            {isCurrentUser && <span className="ml-2 text-xs text-primary-400">({t('leaderboard.you')})</span>}
          </p>
          {rank <= 3 && (
            <p className="text-xs text-gray-400">
              {rank === 1 ? t('leaderboard.champion') : rank === 2 ? t('leaderboard.runnerUp') : t('leaderboard.thirdPlace')}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-white">{score.toString()}</p>
        <p className="text-xs text-gray-400">{t('leaderboard.points')}</p>
      </div>
    </div>
  )
}

function ClaimButton({ tournamentId }: { tournamentId: bigint }) {
  const { address } = useAccount()
  const { t } = useLanguage()
  const { writeContractAsync } = useWriteContract()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: claimData, refetch: refetchClaim, isLoading: isLoadingClaimData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getClaimablePrize',
    args: address ? [tournamentId, address] : undefined,
  })

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isConfirmed) {
      refetchClaim()
      setClaiming(false)
      setTxHash(undefined)
    }
  }, [isConfirmed, refetchClaim])

  const claimInfo = claimData as [bigint, boolean] | undefined
  const claimableAmount = claimInfo?.[0] || 0n
  const hasClaimed = claimInfo?.[1] || false

  useEffect(() => {
    if (address) {
      console.log('Claim Info:', { tournamentId, address, claimableAmount, hasClaimed, isLoadingClaimData })
    }
  }, [address, tournamentId, claimableAmount, hasClaimed, isLoadingClaimData])

  if (isLoadingClaimData) {
    return <div className="animate-pulse h-10 w-32 bg-gray-800 rounded-lg"></div>
  }

  if (!address || claimableAmount === 0n) {
    return null
  }

  const handleClaim = async () => {
    setClaiming(true)
    setError(null)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrisonersDilemmaABI.abi,
        functionName: 'claimPrize',
        args: [tournamentId],
      })
      setTxHash(hash)
    } catch (e) {
      console.error('Claim failed:', e)
      setError(e instanceof Error ? e.message : 'Claim failed')
      setClaiming(false)
    }
  }

  if (hasClaimed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-success-900/30 border border-success-700 rounded-lg">
        <CheckCircle className="text-success-500" size={18} />
        <span className="text-success-300 text-sm font-medium">{t('leaderboard.claimed')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClaim}
        disabled={claiming || isConfirming}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {claiming || isConfirming ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Gift size={18} />
        )}
        <span>{t('leaderboard.claimPrize')}</span>
        <span className="ml-1 font-mono">{formatEther(claimableAmount)} ETH</span>
      </button>
      {error && <p className="text-xs text-danger-400">{error}</p>}
    </div>
  )
}

export function Leaderboard() {
  const { tournamentData } = usePrisonersDilemma()
  const { address } = useAccount()
  const { t } = useLanguage()

  const { data: lastFinishedId } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getLastFinishedTournamentId',
  })

  const finishedTournamentId = lastFinishedId as bigint | undefined

  const { data: resultsPublished } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'isResultsPublished',
    args: finishedTournamentId !== undefined ? [finishedTournamentId] : undefined,
  })

  const hasResults = resultsPublished as boolean | undefined

  const { data: playersData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournamentPlayers',
    args: finishedTournamentId !== undefined && hasResults ? [finishedTournamentId] : undefined,
  })

  const { data: finishedTournamentInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournament',
    args: finishedTournamentId !== undefined && hasResults ? [finishedTournamentId] : undefined,
  })

  const { data: winnersData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournamentWinners',
    args: finishedTournamentId !== undefined && hasResults ? [finishedTournamentId] : undefined,
  })

  const players = playersData as string[] | undefined
  const winners = winnersData as [string[], bigint[]] | undefined
  const finishedInfo = finishedTournamentInfo as { prizePool: bigint } | undefined

  const scoreContracts = useMemo(() => {
    if (!players || !finishedTournamentId || finishedTournamentId === 0n) return []
    return players.map((player) => ({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrisonersDilemmaABI.abi,
      functionName: 'getPlayerScore',
      args: [finishedTournamentId, player],
    }))
  }, [players, finishedTournamentId])

  const { data: scoresData } = useReadContracts({
    contracts: scoreContracts as any,
  })

  const rankedPlayers = useMemo(() => {
    if (!players || !scoresData) return []
    
    const playerScores = players.map((player, index) => ({
      address: player,
      score: (scoresData[index]?.result as bigint) || 0n,
    }))
    
    return playerScores.sort((a, b) => {
      if (b.score > a.score) return 1
      if (b.score < a.score) return -1
      return 0
    })
  }, [players, scoresData])

  if (finishedTournamentId === undefined || !hasResults || !players || players.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          {t('leaderboard.title')}
        </h2>
        <p className="text-gray-400 text-center py-8">
          {t('leaderboard.noFinishedTournament')}
        </p>
      </div>
    )
  }

  const tournamentId = finishedTournamentId

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      {/* Header with Claim Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            {t('leaderboard.results')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {t('leaderboard.tournamentId')}: #{tournamentId.toString()}
            {finishedInfo && ` • ${t('leaderboard.prizePool')}: ${formatEther(finishedInfo.prizePool)} ETH`}
          </p>
        </div>
        
        <ClaimButton tournamentId={tournamentId} />
      </div>

      {/* Winners Banner */}
      {winners && winners[0].length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-300 mb-2 flex items-center gap-2">
            <Trophy size={20} />
            {t('leaderboard.winners')}
          </h3>
          <div className="space-y-2">
            {winners[0].map((winner, i) => (
              <div key={winner} className="flex items-center justify-between text-sm">
                <span className="font-mono text-white">
                  {winner.slice(0, 6)}...{winner.slice(-4)}
                  {winner.toLowerCase() === address?.toLowerCase() && (
                    <span className="ml-2 text-primary-400">({t('leaderboard.you')})</span>
                  )}
                </span>
                <span className="text-yellow-300 font-semibold">
                  {formatEther(winners[1][i])} ETH
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Player Rankings - Sorted by Score */}
      <div className="space-y-3">
        {rankedPlayers.map((player, index) => (
          <PlayerScoreRow
            key={player.address}
            tournamentId={tournamentId}
            address={player.address}
            rank={index + 1}
            score={player.score}
            isCurrentUser={player.address.toLowerCase() === address?.toLowerCase()}
          />
        ))}
      </div>
    </div>
  )
}
