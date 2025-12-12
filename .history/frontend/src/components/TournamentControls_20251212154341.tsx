'use client'

import { useState, useEffect } from 'react'
import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { Zap, Settings, Vote, CheckCircle, Loader2 } from 'lucide-react'
import { useWaitForTransactionReceipt } from 'wagmi'
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { t } = useLanguage()

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

  const getErrorMessage = (error: unknown) => {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMsg.includes('insufficient funds')) return t('errors.insufficientFunds')
    if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected')) return t('errors.userRejected')
    if (errorMsg.includes('Not in registration')) return t('errors.notInRegistration')
    if (errorMsg.includes('Must submit strategy')) return t('errors.mustSubmitStrategy')
    if (errorMsg.includes('Already voted')) return t('errors.alreadyVoted')
    if (errorMsg.includes('Need at least 2 players')) return t('errors.needMorePlayers')
    if (errorMsg.includes('Invalid rounds')) return t('errors.invalidRounds')
    if (errorMsg.includes('Only owner')) return t('errors.onlyOwner')
    
    return errorMsg
  }

  const handleSetRounds = async () => {
    setLoading(true)
    try {
      await setTournamentRounds(rounds)
      await refetchTournament()
      alert(`Rounds set to ${rounds}!`)
    } catch (error: unknown) {
      alert(`Error: ${getErrorMessage(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async () => {
    setLoading(true)
    try {
      const hash = await voteStartTournament()
      setVoteTxHash(hash)
      alert(t('strategy.waitingConfirmation'))
    } catch (error: unknown) {
      alert(`Error: ${getErrorMessage(error)}`)
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
      alert(`Error: ${getErrorMessage(error)}`)
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
        {t('controls.title')}
      </h2>

      {isRegistration && (
        <>
          {/* DAO Voting Section */}
          <div className="mb-6 p-5 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-200 mb-3 flex items-center gap-2">
              <Vote size={22} />
              {t('controls.daoVoting')}
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">
                  {t('controls.votes')}: <span className="font-bold text-white">{voteCount}</span> / {requiredVotes}
                </span>
                <span className="text-sm font-semibold text-purple-300">
                  {votePercentage.toFixed(0)}% ({requiredVotes - voteCount} {t('controls.needed')})
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
                <span className="text-success-300 font-semibold">{t('controls.alreadyVoted')}</span>
              </div>
            ) : !strategy?.isSubmitted ? (
              <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  {t('controls.submitStrategyFirst')}
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
                    {isVoteConfirming ? t('controls.confirmingVote') : t('controls.voting')}
                  </>
                ) : (
                  <>
                    <Vote size={20} />
                    {t('controls.castVote')}
                  </>
                )}
              </button>
            )}

            <p className="mt-3 text-xs text-gray-400 text-center">
              {t('controls.autoStart').replace('{{count}}', String(requiredVotes))}
            </p>
          </div>
        </>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('controls.setRounds')}
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
              {t('controls.set')}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            {t('controls.lowerRoundsNote')}
          </p>
        </div>

        <button
          onClick={handleForceStart}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
        >
          <Zap size={20} />
          {t('controls.forceStart')}
        </button>
        <p className="text-xs text-gray-400 text-center">
          {t('controls.emergencyOverride')}
        </p>
      </div>
    </div>
  )
}
