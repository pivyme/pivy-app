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
  }
}

export const RESTRICTED_USERNAME=[
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
]