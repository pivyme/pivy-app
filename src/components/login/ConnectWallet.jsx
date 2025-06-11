import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWallet as useSuiWallet } from '@suiet/wallet-kit';
import { useAuth } from '@/providers/AuthProvider';
import { WALLET_CHAINS } from '@/providers/AuthProvider';
import { ArrowRightIcon } from 'lucide-react';
import { ConnectButton as SuiConnectButton } from '@suiet/wallet-kit';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import BounceButton from '../elements/BounceButton';

const CHAIN_DETAILS = {
  [WALLET_CHAINS.SOLANA]: {
    name: 'Solana',
  },
  [WALLET_CHAINS.SUI]: {
    name: 'SUI',
  }
};

export default function ConnectWallet() {
  const { signIn, walletChain, initZkLogin, zkLoginUserAddress, isZkLoginReady } = useAuth();
  const { connected: solanaConnected } = useWallet();
  const { connected: suiConnected } = useSuiWallet();
  const { setVisible } = useWalletModal();

  const currentChain = walletChain || WALLET_CHAINS.SOLANA; // Default to SOLANA if undefined
  const isConnected = currentChain === WALLET_CHAINS.SOLANA ? solanaConnected : (currentChain === WALLET_CHAINS.SUI ? (zkLoginUserAddress || suiConnected) : false);

  const handleAction = () => {
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

  const handleZkLogin = () => {
    initZkLogin();
  };

  const getButtonText = () => {
    const chainDetails = CHAIN_DETAILS[currentChain];
    if (isConnected) {
      if (currentChain === WALLET_CHAINS.SUI && zkLoginUserAddress) {
        return "Continue with Google Account";
      }
      return "Sign message to continue";
    }
    // Add safety check for chainDetails
    const chainName = chainDetails?.name || 'Wallet';
    return `Connect your ${chainName} Wallet`;
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="hidden" id="sui-connect-button">
        <SuiConnectButton />
      </div>

      {/* For SUI, show both options */}
      {currentChain === WALLET_CHAINS.SUI && (
        <>
          <BounceButton
            className="tracking-tight font-bold px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm w-full text-white"
            onPress={handleZkLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google (zkLogin)
          </BounceButton>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
        </>
      )}

      <BounceButton
        className="tracking-tight font-bold px-8 py-6 text-lg bg-primary hover:bg-primary-500 transition-colors shadow-sm w-full"
        onPress={handleAction}
      >
        {getButtonText()}
        <ArrowRightIcon className="w-5 h-5" />
      </BounceButton>
    </div>
  );
}