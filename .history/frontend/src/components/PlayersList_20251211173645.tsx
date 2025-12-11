'use client'

import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, SUPPORTED_CHAINS } from '@/config/constants'
import PrisonersDilemmaABI from '@/contracts/PrisonersDilemma.json'
import { usePrisonersDilemma } from '@/hooks/usePrisonersDilemma'
import { Users, Eye, ExternalLink, Shield } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export function PlayersList() {
  const { t } = useLanguage()
  const { tournamentData } = usePrisonersDilemma()
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  const { data: playersData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getTournamentPlayers',
    args: tournamentData ? [tournamentData.tournamentId] : undefined,
  })

  const players = playersData as string[] | undefined

  if (!players || players.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <Users className="text-primary-500" />
          {t('players.title')}
        </h2>
        <p className="text-gray-400 text-center py-8">
          {t('players.noPlayers')}
        </p>
      </div>
    )
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getExplorerUrl = (address: string) => {
    // Sepolia etherscan
    return `https://sepolia.etherscan.io/address/${address}`
  }

  const togglePlayer = (address: string) => {
    setExpandedPlayer(expandedPlayer === address ? null : address)
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-primary-500" />
          Tournament Participants
        </h2>
        <div className="px-4 py-2 bg-primary-900/50 rounded-lg border border-primary-700">
          <span className="text-primary-300 font-bold">{players.length} Players</span>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="text-blue-400" size={20} />
          <h3 className="font-semibold text-blue-300">FHE Privacy Protection</h3>
        </div>
        <p className="text-sm text-blue-200">
          All strategies are encrypted with Fully Homomorphic Encryption (FHE). You can see encrypted data on-chain, 
          but the actual strategy remains hidden until the tournament completes!
        </p>
      </div>

      <div className="space-y-3">
        {players.map((address, index) => (
          <PlayerCard
            key={address}
            address={address}
            index={index}
            tournamentId={tournamentData?.tournamentId}
            isExpanded={expandedPlayer === address}
            onToggle={() => togglePlayer(address)}
            explorerUrl={getExplorerUrl(address)}
            formatAddress={formatAddress}
          />
        ))}
      </div>
    </div>
  )
}

function PlayerCard({
  address,
  index,
  tournamentId,
  isExpanded,
  onToggle,
  explorerUrl,
  formatAddress,
}: {
  address: string
  index: number
  tournamentId: bigint | undefined
  isExpanded: boolean
  onToggle: () => void
  explorerUrl: string
  formatAddress: (addr: string) => string
}) {
  const { data: strategyData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PrisonersDilemmaABI.abi,
    functionName: 'getStrategy',
    args: [address],
  })

  const strategy = strategyData as [unknown[], number, boolean] | undefined
  const hasStrategy = strategy && strategy[2]

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-900/50 rounded-full flex items-center justify-center border border-primary-700">
              <span className="text-primary-300 font-bold">#{index + 1}</span>
            </div>
            <div>
              <p className="font-mono text-white font-semibold">{formatAddress(address)}</p>
              <div className="flex items-center gap-2 mt-1">
                {hasStrategy ? (
                  <span className="flex items-center gap-1 text-xs text-success-400">
                    <Shield size={12} />
                    Strategy Encrypted
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">No strategy yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink size={18} />
            </a>
            {hasStrategy && (
              <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-2 bg-primary-900/50 hover:bg-primary-900/70 text-primary-300 rounded-lg transition-colors"
              >
                <Eye size={18} />
                {isExpanded ? 'Hide' : 'View'} FHE Data
              </button>
            )}
          </div>
        </div>

        {isExpanded && hasStrategy && (
          <div className="mt-4 p-4 bg-gray-900/50 border border-gray-600 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="text-primary-400" size={20} />
              <h4 className="font-semibold text-white">Encrypted Strategy Data (FHE)</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Encrypted Rules (FHE Ciphertext):</p>
                <div className="bg-black/30 p-3 rounded border border-gray-700 font-mono text-xs text-primary-300 overflow-x-auto">
                  {strategy[0] && (strategy[0] as unknown[]).length > 0 
                    ? `[${(strategy[0] as unknown[]).length} encrypted rules]` 
                    : '[No rules - using default action]'}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Default Action (Encrypted):</p>
                <div className="bg-black/30 p-3 rounded border border-gray-700 font-mono text-xs text-primary-300">
                  {strategy[1] !== undefined ? `0x${strategy[1].toString(16).padStart(2, '0')} (encrypted)` : 'N/A'}
                </div>
              </div>

              <div className="mt-3 p-3 bg-primary-900/20 border border-primary-700 rounded">
                <p className="text-xs text-primary-300">
                  🔒 This data is encrypted with FHE. The smart contract can compute with it without ever decrypting it.
                  The actual strategy remains completely private!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
