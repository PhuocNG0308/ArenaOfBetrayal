'use client'

import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { Trophy, Users, Clock, Play, Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const STATUS_LABELS = ['Registration', 'Countdown', 'Running', 'Finished']
const STATUS_COLORS = [
  'bg-blue-900/30 border-blue-700 text-blue-200',
  'bg-yellow-900/30 border-yellow-700 text-yellow-200',
  'bg-green-900/30 border-green-700 text-green-200',
  'bg-gray-900/30 border-gray-700 text-gray-200',
]

export function TournamentInfo() {
  const { tournamentData } = usePrisonersDilemma()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-primary-500" size={24} />
          <p className="text-gray-400">Initializing...</p>
        </div>
      </div>
    )
  }

  if (!tournamentData) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="animate-spin text-primary-500" size={24} />
          <p className="text-gray-400">Loading tournament data from blockchain...</p>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-400" size={18} />
            <p className="text-yellow-300 text-sm font-semibold">Connection Tips:</p>
          </div>
          <ul className="text-yellow-200 text-xs space-y-1 ml-6 list-disc">
            <li>Make sure MetaMask is connected to Sepolia Testnet</li>
            <li>Check if contract address is correct in .env.local</li>
            <li>Verify you have a stable internet connection</li>
          </ul>
        </div>
      </div>
    )
  }

  const status = Number(tournamentData.status)

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy size={28} className="text-primary-500" />
          Tournament #{String(tournamentData.tournamentId)}
        </h2>
        <span className={`px-4 py-2 rounded-lg border font-semibold ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-primary-400" />
            <p className="text-gray-400 text-sm">Players Joined</p>
          </div>
          <p className="text-3xl font-bold text-white">{String(tournamentData.playerCount)}</p>
          <p className="text-xs text-gray-500 mt-1">No limit - all welcome!</p>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Play size={20} className="text-primary-400" />
            <p className="text-gray-400 text-sm">Total Games</p>
          </div>
          <p className="text-3xl font-bold text-white">{String(tournamentData.totalGames)}</p>
          <p className="text-xs text-gray-500 mt-1">Round-robin format</p>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-primary-400" />
            <p className="text-gray-400 text-sm">Rounds per Game</p>
          </div>
          <p className="text-3xl font-bold text-white">{String(tournamentData.rounds || 100)}</p>
          <p className="text-xs text-gray-500 mt-1">Configurable (10-1000)</p>
        </div>
      </div>

      {status === 0 && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-blue-300 text-sm">
            🎮 Tournament is open! Submit your strategy and wait for other players to join.
            An authorized user will start the tournament when ready.
          </p>
        </div>
      )}

      {status === 2 && (
        <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-300 text-sm">
            ⚔️ Tournament is running! Games are being played automatically on-chain.
          </p>
        </div>
      )}

      {status === 3 && (
        <div className="mt-4 p-4 bg-gray-800/50 border border-gray-600 rounded-lg">
          <p className="text-gray-300 text-sm">
            🏆 Tournament completed! Check the leaderboard below to see the results.
          </p>
        </div>
      )}
    </div>
  )
}
