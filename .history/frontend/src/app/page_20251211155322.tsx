'use client'

import { ConnectWallet } from '@/components/ConnectWallet'
import { CustomStrategyBuilder } from '@/components/CustomStrategyBuilder'
import { TournamentInfo } from '@/components/TournamentInfo'
import { TournamentControls } from '@/components/TournamentControls'
import { PlayersList } from '@/components/PlayersList'
import { Leaderboard } from '@/components/Leaderboard'
import { PayoffMatrix } from '@/components/PayoffMatrix'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAccount } from 'wagmi'
import { Sword, Shield } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { isConnected } = useAccount()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <header className="border-b border-gray-800 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sword size={32} className="text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">{t('header.title')}</h1>
                <p className="text-sm text-gray-400">{t('header.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <Shield size={64} className="mx-auto mb-6 text-primary-500" />
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('welcome.title')}
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              {t('welcome.description')}
            </p>
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">{t('welcome.whyFHE')}</h3>
              <div className="text-left space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <Shield className="text-primary-500 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-white">{t('welcome.privacy.title')}</p>
                    <p className="text-sm">{t('welcome.privacy.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="text-primary-500 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-white">{t('welcome.fairness.title')}</p>
                    <p className="text-sm">{t('welcome.fairness.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="text-primary-500 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-white">{t('welcome.strategic.title')}</p>
                    <p className="text-sm">{t('welcome.strategic.description')}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-500 mb-8">
              Connect your MetaMask wallet to participate in the tournament!
            </p>
            <div className="inline-block">
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <TournamentInfo />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomStrategyBuilder />
              <TournamentControls />
            </div>

            <PayoffMatrix />

            <PlayersList />

            <Leaderboard />

            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-4 text-white">{t('about.title')}</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">🎮 {t('about.customStrategies')}</h3>
                  <p className="text-sm">{t('about.customStrategiesDescription')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">👥 {t('about.unlimitedPlayers')}</h3>
                  <p className="text-sm">{t('about.unlimitedPlayersDescription')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">⚔️ {t('about.roundRobin')}</h3>
                  <p className="text-sm">{t('about.roundRobinDescription')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">🔐 {t('about.fheEncryption')}</h3>
                  <p className="text-sm">{t('about.fheEncryptionDescription')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">🏛️ {t('about.daoGovernance')}</h3>
                  <p className="text-sm">{t('about.daoGovernanceDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>{t('footer.builtWith')} <span className="text-primary-400">Zama FHEVM</span> • {t('footer.tagline')} 🔐</p>
        </div>
      </footer>
    </div>
  )
}
