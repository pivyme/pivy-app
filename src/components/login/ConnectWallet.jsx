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
    logo: '/chains/solana.svg',
    description: 'Fast & scalable',
    color: '#9945FF',
    bgColor: '#F6F1FF',
    borderColor: '#E5D8FF'
  },
  [WALLET_CHAINS.SUI]: {
    name: 'Sui',
    logo: '/chains/sui.svg',
    description: 'Next-gen smart contracts',
    color: '#6FBCF0',
    bgColor: '#F0F9FF',
    borderColor: '#D8EEFF'
  }
};

export default function ConnectWallet() {
  const { signIn, walletChain, setWalletChain } = useAuth();
  const { connected: solanaConnected, disconnect: disconnectSolana } = useWallet();
  const { connected: suiConnected, disconnect: disconnectSui } = useSuiWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    console.log('walletChain', walletChain);
  }, [walletChain]);

  // Handle chain switching
  const handleChainSwitch = async (newChain) => {
    // Only disconnect if switching to a different chain and currently connected
    if (newChain !== walletChain) {
      if (solanaConnected && walletChain === WALLET_CHAINS.SOLANA) {
        await disconnectSolana();
      } else if (suiConnected && walletChain === WALLET_CHAINS.SUI) {
        await disconnectSui();
      }
      setWalletChain(newChain);
    }
  };

  const handleAction = () => {
    const isConnected = walletChain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;
    
    if (isConnected) {
      signIn();
      return;
    }

    if (walletChain === WALLET_CHAINS.SOLANA) {
      setVisible(true);
    } else if (walletChain === WALLET_CHAINS.SUI) {
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
    const isConnected = walletChain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;

    if (isConnected) {
      return "Sign message to continue";
    }
    if (!walletChain) {
      return "Select a chain to continue";
    }
    return `Connect your ${CHAIN_DETAILS[walletChain].name} Wallet`;
  };

  const renderChainButton = (chain) => {
    const details = CHAIN_DETAILS[chain];
    const isSelected = walletChain === chain;
    const isConnected = chain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;
    
    return (
      <motion.button
        key={chain}
        className="relative flex-1 p-4 rounded-xl border-2 transition-colors"
        style={{
          backgroundColor: details.bgColor,
          borderColor: isSelected ? details.color : details.borderColor,
          transform: isSelected ? 'scale(1.02)' : 'scale(1)'
        }}
        onClick={() => handleChainSwitch(chain)}
        whileHover={{
          scale: 1.03,
          transition: { type: "spring", stiffness: 400, damping: 10 }
        }}
        whileTap={{
          scale: 0.95,
          transition: { type: "spring", stiffness: 400, damping: 10 }
        }}
        animate={{
          scale: isSelected ? 1.02 : 1,
          transition: { type: "spring", stiffness: 400, damping: 15 }
        }}
      >
        <div className="flex items-center gap-3">
          <motion.img
            src={details.logo}
            alt={`${details.name} Logo`}
            className="w-8 h-8"
            animate={{
              rotate: isSelected ? [0, -10, 10, -5, 5, 0] : 0,
              scale: isSelected ? [1, 1.2, 1] : 1
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
              times: [0, 0.2, 0.4, 0.6, 0.8, 1]
            }}
          />
          <div className="text-left">
            <motion.h3
              className="font-semibold"
              style={{ color: isSelected ? details.color : 'inherit' }}
            >
              {details.name}
              {isConnected && <span className="ml-2 text-green-500">•</span>}
            </motion.h3>
            <p className="text-xs text-gray-600">{details.description}</p>
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex gap-4 w-full">
        {Object.values(WALLET_CHAINS).map(renderChainButton)}
      </div>

      <div className="hidden" id="sui-connect-button">
        <SuiConnectButton />
      </div>

      <BounceButton
        className="tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full"
        isDisabled={!walletChain}
        onPress={handleAction}
      >
        {getButtonText()}
        <ArrowRightIcon className="w-5 h-5" />
      </BounceButton>
    </div>
  );
}