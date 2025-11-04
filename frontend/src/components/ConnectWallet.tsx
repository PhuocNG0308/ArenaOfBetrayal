'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="px-6 py-3 bg-gray-700 rounded-lg">
        <span className="text-gray-400">Loading...</span>
      </div>
    )
  }

  if (isConnected && address) {
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

  const injectedConnector = connectors.find((c) => c.id === 'injected') || connectors[0]

  return (
    <button
      onClick={() => connect({ connector: injectedConnector })}
      className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold"
    >
      <Wallet size={20} />
      Connect Wallet
    </button>
  )
}
