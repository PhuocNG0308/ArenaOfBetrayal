'use client'

import { useState, useEffect } from 'react'
import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { Plus, Trash2, Loader2, CheckCircle, Info, Coins } from 'lucide-react'
import { useWaitForTransactionReceipt } from 'wagmi'
import { useLanguage } from '@/contexts/LanguageContext'

// Enum types from contract
const SUBJECTS = {
  0: 'RoundNumber',
  1: 'MyLastMove',
  2: 'OpponentLastMove',
  3: 'MyTotalDefects',
  4: 'OpponentTotalDefects',
  5: 'OpponentTotalCooperates',
}

const OPERATORS = {
  0: 'Is',
  1: 'IsNot',
  2: 'GreaterThan',
  3: 'LessThan',
  4: 'Equals',
}

const ACTIONS = {
  0: 'Cooperate',
  1: 'Defect',
}

const MAX_RULES = 10 // Contract limit for gas optimization

interface Rule {
  subject: number
  operator: number
  value: number
  action: number
}

export function CustomStrategyBuilder() {
  const [rules, setRules] = useState<Rule[]>([])
  const [defaultAction, setDefaultAction] = useState(0) // Cooperate by default
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const { submitStrategy, strategy, refetchTournament, refetchStrategy } = usePrisonersDilemma()
  const { t } = useLanguage()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isConfirmed) {
      refetchStrategy()
      refetchTournament()
      setLoading(false)
      setTxHash(undefined)
    }
  }, [isConfirmed, refetchStrategy, refetchTournament])

  const hasSubmitted = strategy?.isSubmitted
  const MAX_RULES = 10 // Match contract constant

  const addRule = () => {
    if (rules.length >= MAX_RULES) {
      alert(`Maximum ${MAX_RULES} rules allowed for gas optimization`)
      return
    }
    setRules([...rules, { subject: 0, operator: 0, value: 0, action: 0 }])
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const updateRule = (index: number, field: keyof Rule, value: number) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setRules(newRules)
  }

  const handleSubmit = async () => {
    if (rules.length > MAX_RULES) {
      alert(`Maximum ${MAX_RULES} rules allowed`)
      return
    }
    setLoading(true)
    try {
      const hash = await submitStrategy(rules, defaultAction)
      setTxHash(hash)
      alert('Transaction submitted! Waiting for confirmation... 🎉')
    } catch (error: unknown) {
      console.error(error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      // Better error messages
      if (errorMsg.includes('insufficient funds')) {
        alert('❌ Insufficient ETH. You need at least 0.01 ETH + gas fees.')
      } else if (errorMsg.includes('user rejected')) {
        alert('Transaction cancelled by user')
      } else if (errorMsg.includes('gas')) {
        alert('❌ Gas estimation failed. Try with fewer rules or contact support.')
      } else {
        alert(`Error: ${errorMsg}`)
      }
      setLoading(false)
    }
  }

  if (hasSubmitted) {
    const submittedRules = strategy.subjects.map((subject, i) => ({
      subject: subject,
      operator: strategy.operators[i],
      value: Number(strategy.values[i]),
      action: strategy.actions[i]
    }))
    const submittedDefaultAction = strategy.defaultAction

    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-white">Your Strategy</h2>
        
        {/* Success Banner */}
        <div className="flex items-center gap-3 p-4 bg-success-900/30 border border-success-700 rounded-lg mb-6">
          <CheckCircle className="text-success-500" size={24} />
          <div>
            <p className="text-success-200 font-semibold">Strategy Submitted!</p>
            <p className="text-success-300 text-sm">Your strategy is encrypted with FHE and stored on-chain</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 bg-orange-900/30 border border-orange-700 rounded-lg mb-6">
          <Info className="text-orange-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="text-orange-200 font-semibold">Cannot Edit Strategy</p>
            <p className="text-orange-300 text-sm">
              Once submitted, your strategy is locked and cannot be changed. 
              This ensures fair play for all participants.
            </p>
          </div>
        </div>

        {/* Decrypted Strategy View */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>Your Decrypted Strategy</span>
            <span className="text-xs text-gray-400 font-normal">(Only visible to you)</span>
          </h3>

          {/* Rules List */}
          {submittedRules.length > 0 ? (
            <div className="space-y-3 mb-5">
              <p className="text-sm text-gray-400 mb-2">Conditional Rules:</p>
              {submittedRules.map((rule, index) => (
                <div key={index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-400">Rule #{index + 1}</span>
                  </div>
                  <div className="text-sm text-gray-200">
                    <span className="text-blue-400">If</span>{' '}
                    <span className="font-semibold text-white">{SUBJECTS[rule.subject as keyof typeof SUBJECTS]}</span>{' '}
                    <span className="text-blue-400">{OPERATORS[rule.operator as keyof typeof OPERATORS]}</span>{' '}
                    <span className="font-semibold text-white">{rule.value}</span>{' '}
                    <span className="text-blue-400">then</span>{' '}
                    <span className={`font-semibold ${rule.action === 0 ? 'text-success-400' : 'text-danger-400'}`}>
                      {ACTIONS[rule.action as keyof typeof ACTIONS]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-5">No conditional rules. Using default action only.</p>
          )}

          {/* Default Action */}
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Default Action (when no rules match):</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              submittedDefaultAction === 0
                ? 'bg-success-900/30 border border-success-700'
                : 'bg-danger-900/30 border border-danger-700'
            }`}>
              <span className={`font-semibold ${
                submittedDefaultAction === 0 ? 'text-success-300' : 'text-danger-300'
              }`}>
                {ACTIONS[submittedDefaultAction as keyof typeof ACTIONS]}
              </span>
            </div>
          </div>
        </div>

        {/* FHE Info */}
        <div className="mt-4 p-3 bg-primary-900/20 border border-primary-700 rounded-lg">
          <p className="text-xs text-primary-300">
            🔐 While you can view your own strategy here, it remains encrypted on-chain. 
            Other players cannot see your strategy until the tournament ends.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Build Your Strategy</h2>
        <div className="flex items-center gap-2 text-primary-400 text-sm">
          <Info size={16} />
          <span>FHE Encrypted</span>
        </div>
      </div>

      {/* Entry Fee Warning */}
      <div className="bg-orange-900/30 border border-orange-700 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <Coins className="text-orange-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-orange-200 mb-1">Entry Fee Required</h3>
            <p className="text-sm text-orange-300">
              You need to pay <span className="font-bold">0.01 ETH</span> to submit your strategy and join the tournament.
              Top 30% of players will share the prize pool!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-300 mb-2">How it works</h3>
        <p className="text-sm text-blue-200">
          Create conditional rules for your strategy. Each rule checks a condition and performs an action.
          Rules are evaluated in order. If no rule matches, the default action is used.
        </p>
      </div>

      {/* Rules */}
      <div className="space-y-4 mb-6">
        {rules.map((rule, index) => (
          <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold">Rule #{index + 1}</span>
              <button
                onClick={() => removeRule(index)}
                disabled={loading || isConfirming}
                className="text-danger-400 hover:text-danger-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Subject */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">If</label>
                <select
                  value={rule.subject}
                  onChange={(e) => updateRule(index, 'subject', parseInt(e.target.value))}
                  disabled={loading || isConfirming}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(SUBJECTS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Condition</label>
                <select
                  value={rule.operator}
                  onChange={(e) => updateRule(index, 'operator', parseInt(e.target.value))}
                  disabled={loading || isConfirming}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(OPERATORS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Value</label>
                <input
                  type="number"
                  value={rule.value}
                  onChange={(e) => updateRule(index, 'value', parseInt(e.target.value) || 0)}
                  disabled={loading || isConfirming}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  min="0"
                  max="1000"
                />
              </div>

              {/* Action */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Then</label>
                <select
                  value={rule.action}
                  onChange={(e) => updateRule(index, 'action', parseInt(e.target.value))}
                  disabled={loading || isConfirming}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(ACTIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addRule}
          disabled={loading || isConfirming || rules.length >= MAX_RULES}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-600 hover:border-primary-500 text-gray-400 hover:text-primary-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          {rules.length >= MAX_RULES ? `Max ${MAX_RULES} Rules` : 'Add Rule'}
        </button>
      </div>

      {/* Default Action */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Default Action (when no rules match)
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setDefaultAction(0)}
            disabled={loading || isConfirming}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              defaultAction === 0
                ? 'border-success-500 bg-success-900/30 text-success-300'
                : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
            }`}
          >
            Cooperate
          </button>
          <button
            onClick={() => setDefaultAction(1)}
            disabled={loading || isConfirming}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              defaultAction === 1
                ? 'border-danger-500 bg-danger-900/30 text-danger-300'
                : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
            }`}
          >
            Defect
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || isConfirming}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
      >
        {loading || isConfirming ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {isConfirming ? 'Waiting for Confirmation...' : 'Submitting...'}
          </>
        ) : (
          <>
            <Coins size={20} />
            Submit Strategy (0.01 ETH)
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-4 p-3 bg-primary-900/20 border border-primary-700 rounded-lg">
        <p className="text-xs text-primary-300">
          🔐 Your strategy will be encrypted using Zama FHE (Fully Homomorphic Encryption) before being stored on-chain.
          Complete privacy guaranteed - even the owner cannot see strategies until tournament reveal!
        </p>
      </div>
    </div>
  )
}
