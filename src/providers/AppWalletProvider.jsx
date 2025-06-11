"use client";

import React, { useMemo } from "react";

/* --------------------------------- Solana --------------------------------- */
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AuthProvider } from "./AuthProvider";
import { ZkLoginProvider } from "./ZkLoginProvider";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import '@/styles/wallet.css'

/* ----------------------------------- SUI ---------------------------------- */
import { WalletProvider as SuiWalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';

export default function AppWalletProvider({ children }) {
  /* --------------------------------- Solana --------------------------------- */
  const network =
    import.meta.env.VITE_IS_TESTNET === "true"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  /* ----------------------------------- SUI ---------------------------------- */


  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <SuiWalletProvider>
          <WalletModalProvider>
            <ZkLoginProvider>
              <AuthProvider>{children}</AuthProvider>
            </ZkLoginProvider>
          </WalletModalProvider>
        </SuiWalletProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
