"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AuthProvider } from "./AuthProvider";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { CHAINS } from "@/config";

export default function ReceiveWalletProvider({ children }) {
  console.log('ReceiveWalletProvider mounted');

  const network =
    import.meta.env.VITE_IS_TESTNET === "true"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;

  const chain = CHAINS[import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"];
  // const endpoint = useMemo(() => clusterApiUrl(network), [network]);
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

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={true}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
