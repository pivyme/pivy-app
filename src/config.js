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

export const CHAINS = {
  MAINNET: {
    id: "MAINNET",
    rpcUrl: '',
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
    rpcUrl: '',
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