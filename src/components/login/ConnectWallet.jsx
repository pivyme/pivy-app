import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWallet as useSuiWallet } from '@suiet/wallet-kit';
import { useAuth } from '@/providers/AuthProvider';
import { WALLET_CHAINS } from '@/providers/AuthProvider';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import { ConnectButton as SuiConnectButton } from '@suiet/wallet-kit';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import BounceButton from '../elements/BounceButton';

const CHAIN_DETAILS = {
  [WALLET_CHAINS.SOLANA]: {
    name: 'Solana',
  },
  [WALLET_CHAINS.SUI]: {
    name: 'Sui',
  }
};

export default function ConnectWallet() {
  const { signIn, walletChain, setWalletChain } = useAuth();
  const { connected: solanaConnected } = useWallet();
  const { connected: suiConnected } = useSuiWallet();
  const { setVisible } = useWalletModal();

  // Ensure there's always a default chain selected
  useEffect(() => {
    if (!walletChain) {
      setWalletChain(WALLET_CHAINS.SOLANA);
    }
  }, [walletChain, setWalletChain]);

  const handleAction = () => {
    const currentChain = walletChain || WALLET_CHAINS.SOLANA;
    const isConnected = currentChain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;
    
    if (isConnected) {
      signIn();
      return;
    }

    if (currentChain === WALLET_CHAINS.SOLANA) {
      setVisible(true);
    } else if (currentChain === WALLET_CHAINS.SUI) {
      const suiConnectButton = document.getElementById('sui-connect-button');
      if (suiConnectButton) {
        const childButton = suiConnectButton.querySelector('button');
        if (childButton) {
          childButton.click();
        }
      }
    }
  };

  const getButtonText = () => {
    const currentChain = walletChain || WALLET_CHAINS.SOLANA;
    const isConnected = currentChain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;
    const chainDetails = CHAIN_DETAILS[currentChain];

    if (isConnected) {
      return "Sign message to continue";
    }
    return `Connect your ${chainDetails.name} Wallet`;
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="hidden" id="sui-connect-button">
        <SuiConnectButton />
      </div>

      <BounceButton
        className="tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full"
        onPress={handleAction}
      >
        {getButtonText()}
        <ArrowRightIcon className="w-5 h-5" />
      </BounceButton>
    </div>
  );
}