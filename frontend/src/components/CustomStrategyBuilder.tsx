'use client'

import { useState } from 'react'
import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { Plus, Trash2, Loader2, CheckCircle, Info } from 'lucide-react'

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
  const { submitStrategy, strategy, refetchTournament } = usePrisonersDilemma()

  const hasSubmitted = strategy && (strategy as { [key: number]: boolean })[2]

  const addRule = () => {
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
    setLoading(true)
    try {
      await submitStrategy(rules, defaultAction)
      await refetchTournament()
      alert('Custom strategy submitted successfully! 🎉')
    } catch (error: unknown) {
      console.error(error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (hasSubmitted) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-white">Your Strategy</h2>
        <div className="flex items-center gap-3 p-4 bg-success-900/30 border border-success-700 rounded-lg">
          <CheckCircle className="text-success-500" size={24} />
          <div>
            <p className="text-success-200 font-semibold">Strategy Submitted!</p>
            <p className="text-success-300 text-sm">Your strategy is encrypted with FHE and stored on-chain</p>
          </div>
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
          <span>Encrypted with FHE</span>
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
                className="text-danger-400 hover:text-danger-300 transition-colors"
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
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
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-600 hover:border-primary-500 text-gray-400 hover:text-primary-400 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Rule
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
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
              defaultAction === 0
                ? 'border-success-500 bg-success-900/30 text-success-300'
                : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
            }`}
          >
            Cooperate
          </button>
          <button
            onClick={() => setDefaultAction(1)}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
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
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Submitting & Encrypting...
          </>
        ) : (
          'Submit Strategy (FHE Encrypted)'
        )}
      </button>

      {/* Info */}
      <div className="mt-4 p-3 bg-primary-900/20 border border-primary-700 rounded-lg">
        <p className="text-xs text-primary-300">
          🔐 Your strategy will be encrypted using Fully Homomorphic Encryption (FHE) before being stored on-chain.
          This ensures complete privacy - nobody can see your strategy until the tournament ends!
        </p>
      </div>
    </div>
  )
}
