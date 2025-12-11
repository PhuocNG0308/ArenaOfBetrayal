'use client'

import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config/constants'
import PrisonersDilemmaABI from '@/contracts/PrisonersDilemma.json'
import { Trophy, Medal, Award } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

function PlayerScoreRow({ 
  tournamentId, 
  address, 
  index 
}: { 
  tournamentId: bigint
  address: string
  index: number
}) {
  const { t } = useLanguage()
  const { data: scoreData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getPlayerScore',
    args: [tournamentId, address],
  })

  const score = scoreData as bigint | undefined

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="text-yellow-500" size={24} />
      case 1:
        return <Medal className="text-gray-400" size={24} />
      case 2:
        return <Award className="text-orange-600" size={24} />
      default:
        return <span className="text-gray-500 font-bold text-lg">{rank + 1}</span>
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${
        index === 0
          ? 'bg-yellow-900/20 border-yellow-700'
          : index === 1
          ? 'bg-gray-700/20 border-gray-600'
          : index === 2
          ? 'bg-orange-900/20 border-orange-700'
          : 'bg-gray-800/20 border-gray-700'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 flex justify-center">
          {getRankIcon(index)}
        </div>
        <div>
          <p className="font-mono text-white">{formatAddress(address)}</p>
          {index < 3 && (
            <p className="text-xs text-gray-400">
              {index === 0 ? t('leaderboard.champion') : index === 1 ? t('leaderboard.runnerUp') : t('leaderboard.thirdPlace')}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-white">{score?.toString() || '0'}</p>
        <p className="text-xs text-gray-400">{t('leaderboard.points')}</p>
      </div>
    </div>
  )
}

export function Leaderboard() {
  const { tournamentData } = usePrisonersDilemma()
  const { t } = useLanguage()

  const { data: playersData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournamentPlayers',
    args: tournamentData ? [tournamentData.tournamentId] : undefined,
  })

  const players = playersData as string[] | undefined

  if (!tournamentData || tournamentData.status !== 2 || !players || players.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-gray-400 text-center py-8">
          Tournament results will appear here after completion
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Trophy className="text-yellow-500" />
        Tournament Results
      </h2>
      
      <div className="space-y-3">
        {players.map((address, index) => (
          <PlayerScoreRow
            key={address}
            tournamentId={tournamentData.tournamentId}
            address={address}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
