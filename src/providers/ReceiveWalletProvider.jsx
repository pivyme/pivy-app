"use client";

import React, { useMemo } from "react";
import { isTestnet, SUI_CHAINS } from "@/config";

/* --------------------------------- SOLANA --------------------------------- */
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

/* ----------------------------------- EVM ---------------------------------- */
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  lightTheme,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  // MAINNETS
  mainnet,
  base,
  polygon,
  bsc,
  arbitrum,
  avalanche,
  optimism,
  // TESTNETS
  sepolia,
  baseSepolia,
  polygonAmoy,
  bscTestnet,
  arbitrumSepolia,
  avalancheFuji,
  optimismSepolia
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

/* ----------------------------------- SUI ---------------------------------- */
import { WalletProvider as SuiWalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';

import { CHAINS } from "@/config";

const queryClient = new QueryClient();

export default function ReceiveWalletProvider({ children }) {
  /* --------------------------------- SOLANA --------------------------------- */
  const network =
    import.meta.env.VITE_IS_TESTNET === "true"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;

  const chain = CHAINS[import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"];
  const endpoint = chain.rpcUrl;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network })
    ],
    [network]
  );

  console.log('Network:', network);
  console.log('Endpoint:', endpoint);

  /* ----------------------------------- EVM ---------------------------------- */
  const config = getDefaultConfig({
    appName: 'PIVY',
    projectId: 'none',
    chains: import.meta.env.VITE_IS_TESTNET === "true" ? [sepolia, baseSepolia, polygonAmoy, bscTestnet, arbitrumSepolia, avalancheFuji, optimismSepolia] : [mainnet, base, polygon, optimism, arbitrum, bsc, avalanche],
    ssr: false,
  });

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={true}
      >
        <WalletModalProvider>
          {/* EVM Provider */}
          <WagmiProvider config={config} reconnect={true}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider
                modalSize="compact"
                theme={lightTheme({
                  borderRadius: 'large',
                  accentColor: '#479af5',
                  accentColorForeground: '#ffffff',
                  fontStack: 'system',
                  overlayBlur: 'small',
                })}
              >
                {/* SUI Provider */}
                <SuiWalletProvider
                  chains={[isTestnet ? SUI_CHAINS.TESTNET : SUI_CHAINS.MAINNET]}
                >
                  {children}
                </SuiWalletProvider>
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
