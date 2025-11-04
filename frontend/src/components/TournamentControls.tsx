'use client'

import { useState } from 'react'
import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { Zap, Settings } from 'lucide-react'

export function TournamentControls() {
  const [rounds, setRounds] = useState(100)
  const [loading, setLoading] = useState(false)
  const { setTournamentRounds, forceStartTournament, refetchTournament } = usePrisonersDilemma()

  const handleSetRounds = async () => {
    setLoading(true)
    try {
      await setTournamentRounds(rounds)
      await refetchTournament()
      alert(`Rounds set to ${rounds}!`)
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleForceStart = async () => {
    if (!confirm('Are you sure you want to force start the tournament?')) return
    
    setLoading(true)
    try {
      await forceStartTournament()
      await refetchTournament()
      alert('Tournament started!')
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <Settings size={28} className="text-primary-500" />
        Tournament Controls
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Set Rounds (10-1000)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="10"
              max="1000"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
            />
            <button
              onClick={handleSetRounds}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
            >
              Set
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Lower rounds = less gas. Recommended: 50 for 4+ players
          </p>
        </div>

        <button
          onClick={handleForceStart}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-success-600 hover:bg-success-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
        >
          <Zap size={20} />
          Force Start Tournament
        </button>
      </div>
    </div>
  )
}
