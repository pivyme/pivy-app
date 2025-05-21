export const BUY_LINK = "";
export const DOCS_LINK = "";
export const CONTRACT_ADDRESS = "";
export const TWITTER_LINK = "";
export const GITHUB_LINK = "";
export const TELEGRAM_LINK = "";

export const CONFIG = {
  BUY_LINK: "",
  DOCS_LINK: "",
  CONTRACT_ADDRESS: "",
  TWITTER_LINK: "",
  GITHUB_LINK: "",
  TELEGRAM_LINK: "",
};

export const isTestnet = import.meta.env.VITE_IS_TESTNET === 'true';

export const COLORS = [
  { id: 'blue', value: '#60A5FA', light: '#DBEAFE' },
  { id: 'purple', value: '#A78BFA', light: '#EDE9FE' },
  { id: 'pink', value: '#F472B6', light: '#FCE7F3' },
  { id: 'green', value: '#34D399', light: '#D1FAE5' },
  { id: 'yellow', value: '#FBBF24', light: '#FEF3C7' },
  { id: 'red', value: '#F87171', light: '#FEE2E2' },
  { id: 'orange', value: '#FB923C', light: '#FFEDD5' },
  { id: 'teal', value: '#2DD4BF', light: '#CCFBF1' },
  { id: 'gray', value: '#6B7280', light: '#E5E7EB' },
]

export const SPECIAL_THEMES = [
  {
    id: 'mindblowon',
    name: 'Mindblowon',
    icon: '/special-theme/mindblowon/logo.png',
    headerLogo: '/special-theme/mindblowon/c-logo.png',
  },
  {
    id: 'tahilalats',
    name: 'Tahilalats',
    icon: '/special-theme/tahilalats/logo.png',
    headerLogo: '/special-theme/tahilalats/c-logo.png',
  },
  {
    id: 'hai-dudu',
    name: 'Hai Dudu',
    icon: '/special-theme/hai-dudu/logo.png',
    headerLogo: '/special-theme/hai-dudu/c-logo.png',
  }
]

export const CHAINS = {
  MAINNET: {
    id: "MAINNET",
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_MAINNET,
    stealthProgramId: import.meta.env.VITE_PIVY_STEALTH_PROGRAM_ID_MAINNET,
    tokens: [
      {
        name: "SOL",
        symbol: "SOL",
        address: "So11111111111111111111111111111111111111112",
        decimals: 9,
        image: "/tokens/sol.png",
        isNative: true,
      },
      {
        name: "USDC",
        symbol: "USDC",
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
        image: "/tokens/usdc.png",
        isNative: false,
      },
    ]
  },
  DEVNET: {
    id: "DEVNET",
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_DEVNET,
    stealthProgramId: import.meta.env.VITE_PIVY_STEALTH_PROGRAM_ID_DEVNET,
    tokens: [
      {
        name: "USDC",
        symbol: "USDC",
        address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        decimals: 6,
        image: "/tokens/usdc.png",
        isNative: false,
      },
      {
        name: "SOL",
        symbol: "SOL",
        address: "So11111111111111111111111111111111111111112",
        decimals: 9,
        image: "/tokens/sol.png",
      }
    ]
  },
  SUI_MAINNET: {
    id: "SUI_MAINNET",
    rpcUrl: import.meta.env.VITE_SUI_RPC_MAINNET,
    stealthProgramId: import.meta.env.VITE_PIVY_STEALTH_PROGRAM_ID_SUI_MAINNET,
    tokens: [
      {
        name: "USDC",
        symbol: "USDC",
        address: "",
        decimals: 6,
        image: "/tokens/usdc.png",
        isNative: false,
      },
      {
        name: "SUI",
        symbol: "SUI",
        address: "0x2::sui::SUI",
        decimals: 9,
        image: "/tokens/sui.png",
        isNative: true,
      }
    ]
  },
  SUI_TESTNET: {
    id: "SUI_TESTNET",
    rpcUrl: import.meta.env.VITE_SUI_RPC_TESTNET,
    stealthProgramId: import.meta.env.VITE_PIVY_STEALTH_PROGRAM_ID_SUI_TESTNET,
    tokens: [
      {
        name: "USDC",
        symbol: "USDC",
        address: "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC",
        decimals: 6,
        image: "/tokens/usdc.png",
        isNative: false,
      },
      {
        name: "SUI",
        symbol: "SUI",
        address: "0x2::sui::SUI",
        decimals: 9,
        image: "/tokens/sui.png",
        isNative: true,
      }
    ]
  }
}

export const SUI_CHAINS = {
  MAINNET: {
    id: 'sui:mainnet',
    name: 'Sui Mainnet',
    rpcUrl: "https://rpc.mainnet.sui.io"
  },
  TESTNET: {
    id: "sui:testnet",
    name: "Sui Testnet",
    rpcUrl: "https://fullnode.testnet.sui.io",
  }
}

export const RESTRICTED_USERNAME = [
  "app",
  "api",
  "assets",
  "static",
  "favicon",
  "robots",
  "sitemap",
  "ads",
  "analytics",
  "cdn",
  "funds",
  "links",
  "alerts",
  "notifications",
  "settings",
  "dashboard",
  "login",
  "register",
  "logout",
  "profile",
  "settings",
  "help",
  "support",
  "terms",
  "privacy",
  "about",
  "contact",
  "blog",
  "news",
  "updates",
  "releases",
  "changelog",
  "docs",
  "faq",
  "help",
  "support",
  "terms",
  "privacy",
  "about",
  "contact",
  "pivy",
  "tokens"
]

export const USDC_CONTRACT_ADDRESS = {
  MAINNET: {
    // Ethereum Mainnet
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    // Base Mainnet
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    // Polygon Mainnet
    137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    // Arbitrum One
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    // Avalanche Mainnet
    43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    // Optimism Mainnet
    10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
  },
  DEVNET: {
    // Ethereum Sepolia
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    // Base Sepolia
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    // Polygon Amoy
    80002: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    // Arbitrum Sepolia
    421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    // Avalanche Fuji
    43113: "0x5425890298aed601595a70AB815c96711a31Bc65",
    // Optimism Sepolia
    11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
  }
}

export const CCTP_CONTRACTS = {
  TOKEN_MESSENGER: {
    1: {
      domain: 0,
      address: "0xBd3fa81B58Ba92a82136038B25aDec7066af3155" // Ethereum
    },
    43114: {
      domain: 1,
      address: "0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982" // Avalanche
    },
    10: {
      domain: 2,
      address: "0x2B4069517957735bE00ceE0fadAE88a26365528f" // Optimism
    },
    42161: {
      domain: 3,
      address: "0x19330d10D9Cc8751218eaf51E8885D058642E08A" // Arbitrum
    },
    8453: {
      domain: 6,
      address: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962" // Base
    },
    137: {
      domain: 7,
      address: "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE" // Polygon PoS
    },
    11155111: {
      domain: 0,
      address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5" // Ethereum Sepolia
    },
    43113: {
      domain: 1,
      address: "0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0" // Avalanche Fuji
    },
    11155420: {
      domain: 2,
      address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5" // OP Sepolia
    },
    421614: {
      domain: 3,
      address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5" // Arbitrum Sepolia
    },
    84532: {
      domain: 6,
      address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5" // Base Sepolia
    },
    80002: {
      domain: 7,
      address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5" // Polygon Amoy
    }
  },

  TOKEN_TRANSMITTER_PROGRAM: {
    MAINNET: {
      domain: 5,
      address: "CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd"
    },
    DEVNET: {
      domain: 5,
      address: "CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd"
    }
  },

  TOKEN_MESSENGER_MINTER_PROGRAM: {
    MAINNET: {
      domain: 5,
      address: "CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3"
    },
    DEVNET: {
      domain: 5,
      address: "CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3"
    }
  }
}
