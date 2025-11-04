export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export const SUPPORTED_CHAINS = {
  hardhat: {
    id: 31337,
    name: 'Hardhat',
    network: 'hardhat',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
      public: { http: ['http://127.0.0.1:8545'] },
    },
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    network: 'sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia Ether',
      symbol: 'SEP',
    },
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.org'] },
      public: { http: ['https://rpc.sepolia.org'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
  },
}

export const STRATEGIES = {
  'tit-for-tat': {
    name: 'Tit-for-Tat',
    description: 'Mirror opponent\'s last move. Start with cooperation.',
    rules: [
      {
        subject: 2,
        operator: 0,
        value: 1,
        action: 1,
      },
    ],
    defaultAction: 0,
  },
  'always-cooperate': {
    name: 'Always Cooperate',
    description: 'Always choose to cooperate, regardless of opponent.',
    rules: [],
    defaultAction: 0,
  },
  'always-defect': {
    name: 'Always Defect',
    description: 'Always choose to defect, regardless of opponent.',
    rules: [],
    defaultAction: 1,
  },
  'grudger': {
    name: 'Grudger',
    description: 'Cooperate until opponent defects once, then always defect.',
    rules: [
      {
        subject: 4,
        operator: 2,
        value: 0,
        action: 1,
      },
    ],
    defaultAction: 0,
  },
}

export const PAYOFF_MATRIX = {
  bothCooperate: 3,
  defectVsCooperate: 5,
  cooperateVsDefect: 0,
  bothDefect: 1,
}
