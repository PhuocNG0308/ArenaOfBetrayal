'use client'

import { useState, useEffect } from 'react'
import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { Zap, Settings, Vote, CheckCircle, Loader2 } from 'lucide-react'
import { useWaitForTransactionReceipt } from 'wagmi'

export function TournamentControls() {
  const [rounds, setRounds] = useState(100)
  const [loading, setLoading] = useState(false)
  const [voteTxHash, setVoteTxHash] = useState<`0x${string}` | undefined>()
  const { 
    setTournamentRounds, 
    forceStartTournament, 
    voteStartTournament,
    voteInfo,
    hasVoted,
    strategy,
    tournamentData,
    refetchTournament,
    refetchVotes 
  } = usePrisonersDilemma()

  const { isLoading: isVoteConfirming, isSuccess: isVoteConfirmed } = useWaitForTransactionReceipt({
    hash: voteTxHash,
  })

  useEffect(() => {
    if (isVoteConfirmed) {
      refetchVotes()
      refetchTournament()
      setLoading(false)
      setVoteTxHash(undefined)
    }
  }, [isVoteConfirmed, refetchVotes, refetchTournament])

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

  const handleVote = async () => {
    setLoading(true)
    try {
      const hash = await voteStartTournament()
      setVoteTxHash(hash)
      alert('Vote submitted! Waiting for confirmation...')
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const handleForceStart = async () => {
    if (!confirm('Are you sure you want to force start the tournament? (Owner only)')) return
    
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

  const isRegistration = tournamentData?.status === 0
  const canVote = strategy?.isSubmitted && !hasVoted && isRegistration
  const voteCount = voteInfo ? Number(voteInfo.voteCount) : 0
  const requiredVotes = voteInfo ? Number(voteInfo.requiredVotes) : 0
  const votePercentage = requiredVotes > 0 ? (voteCount / requiredVotes) * 100 : 0

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <Settings size={28} className="text-primary-500" />
        Tournament Controls
      </h2>

      {isRegistration && (
        <>
          {/* DAO Voting Section */}
          <div className="mb-6 p-5 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-200 mb-3 flex items-center gap-2">
              <Vote size={22} />
              DAO Voting to Start Tournament
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">
                  Votes: <span className="font-bold text-white">{voteCount}</span> / {requiredVotes}
                </span>
                <span className="text-sm font-semibold text-purple-300">
                  {votePercentage.toFixed(0)}% ({requiredVotes - voteCount} needed)
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(votePercentage, 100)}%` }}
                />
              </div>
            </div>

            {hasVoted ? (
              <div className="flex items-center gap-2 p-3 bg-success-900/30 border border-success-700 rounded-lg">
                <CheckCircle className="text-success-400" size={20} />
                <span className="text-success-300 font-semibold">You've already voted!</span>
              </div>
            ) : !strategy?.isSubmitted ? (
              <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  Submit your strategy first to participate in voting
                </p>
              </div>
            ) : (
              <button
                onClick={handleVote}
                disabled={loading || isVoteConfirming || !canVote}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-semibold"
              >
                {loading || isVoteConfirming ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {isVoteConfirming ? 'Confirming Vote...' : 'Voting...'}
                  </>
                ) : (
                  <>
                    <Vote size={20} />
                    Cast Your Vote to Start
                  </>
                )}
              </button>
            )}

            <p className="mt-3 text-xs text-gray-400 text-center">
              Tournament auto-starts when {requiredVotes} votes reached (50% quorum)
            </p>
          </div>
        </>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Set Rounds (10-1000) - Owner Only
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="10"
              max="1000"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
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
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
        >
          <Zap size={20} />
          Force Start Tournament (Owner)
        </button>
        <p className="text-xs text-gray-400 text-center">
          Emergency override - bypasses voting requirement
        </p>
      </div>
    </div>
  )
}
