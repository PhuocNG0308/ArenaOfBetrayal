'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { Wallet, LogOut, X, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { sepolia } from 'wagmi/chains'

export function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [mounted, setMounted] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isConnected && chainId !== sepolia.id && switchChain) {
      // We can auto-switch here if desired, or let the user click the button
    }
  }, [isConnected, chainId, switchChain])

  if (!mounted) {
    return (
      <div className="px-6 py-3 bg-gray-700 rounded-lg">
        <span className="text-gray-400">Loading...</span>
      </div>
    )
  }

  if (isConnected && address) {
    if (chainId !== sepolia.id) {
      return (
        <button
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-semibold"
        >
          <AlertCircle size={20} />
          Switch to Sepolia
        </button>
      )
    }

    return (
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-primary-900/50 rounded-lg border border-primary-700">
          <p className="text-sm text-primary-300">Connected</p>
          <p className="font-mono text-xs">{`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold"
      >
        <Wallet size={20} />
        Connect Wallet
      </button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-white">Select Wallet</h3>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid || connector.id}
                  onClick={() => {
                    connect({ connector })
                    setShowOptions(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <Wallet size={16} className="text-gray-300"/>
                  </div>
                  <div>
                    <p className="font-medium text-white">{connector.name}</p>
                    <p className="text-xs text-gray-400">Connect with {connector.name}</p>
                  </div>
                </button>
              ))}
              {connectors.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No wallets found. Please install a wallet like MetaMask.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
