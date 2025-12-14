'use client'

import { useState } from 'react'
import { STRATEGIES } from '@/config/constants'
import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { CheckCircle, Loader2 } from 'lucide-react'

export function StrategySelector() {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { submitStrategy, strategy, refetchTournament } = usePrisonersDilemma()

  const handleSubmit = async () => {
    if (!selectedStrategy) return

    setLoading(true)
    try {
      const strategyConfig = STRATEGIES[selectedStrategy as keyof typeof STRATEGIES]
      await submitStrategy(strategyConfig.rules, strategyConfig.defaultAction)
      await refetchTournament()
      alert('Strategy submitted successfully!')
    } catch (error: unknown) {
      console.error(error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const hasSubmitted = strategy?.isSubmitted

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 text-white">Submit Your Strategy</h2>
      
      {hasSubmitted ? (
        <div className="flex items-center gap-3 p-4 bg-success-900/30 border border-success-700 rounded-lg">
          <CheckCircle className="text-success-500" size={24} />
          <p className="text-success-200">Strategy already submitted for this tournament!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(STRATEGIES).map(([key, strat]) => (
              <button
                key={key}
                onClick={() => setSelectedStrategy(key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedStrategy === key
                    ? 'border-primary-500 bg-primary-900/30'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <h3 className="font-bold text-white mb-2">{strat.name}</h3>
                <p className="text-sm text-gray-400">{strat.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedStrategy || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              'Submit Strategy'
            )}
          </button>
        </>
      )}
    </div>
  )
}
