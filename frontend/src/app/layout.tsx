import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

// Polyfill for global in browser environment
if (typeof window !== 'undefined' && typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arena of Betrayal - Prisoner\'s Dilemma Tournament',
  description: 'FHE-Powered Iterated Prisoner\'s Dilemma Tournament on Blockchain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
