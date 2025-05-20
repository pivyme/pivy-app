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
  const { connected: solanaConnected } = useWallet();
  const { connected: suiConnected } = useSuiWallet();
  const { setVisible } = useWalletModal();

  // Effect to handle wallet connections and maintain chain selection
  useEffect(() => {
    if (solanaConnected && !walletChain) {
      setWalletChain(WALLET_CHAINS.SOLANA);
    } else if (suiConnected && !walletChain) {
      setWalletChain(WALLET_CHAINS.SUI);
    }
  }, [solanaConnected, suiConnected, walletChain, setWalletChain]);

  const getConnectionState = () => {
    switch (walletChain) {
      case WALLET_CHAINS.SOLANA:
        return solanaConnected;
      case WALLET_CHAINS.SUI:
        return suiConnected;
      default:
        return false;
    }
  };

  const handleAction = () => {
    const isConnected = getConnectionState();
    
    if (isConnected) {
      signIn(); // Handle signing
    } else if (walletChain === WALLET_CHAINS.SOLANA) {
      setVisible(true); // Open Solana wallet modal
    }
    // For Sui, we don't need to handle connection here as it's handled by SuiConnectButton
  };

  const getButtonText = () => {
    const isConnected = getConnectionState();

    if (isConnected) {
      return "Sign message to continue";
    }

    if (!walletChain) {
      return "Select a chain to continue";
    }

    const chainName = CHAIN_DETAILS[walletChain].name;
    return `Connect your ${chainName} Wallet`;
  };

  const getButtonStyle = () => {
    if (!walletChain) {
      return 'bg-gray-400 cursor-not-allowed';
    }
    return 'bg-primary-600 hover:bg-primary-700';
  };

  return (
    <div className='mt-8 space-y-6'>
      {/* Chain Selection */}
      <div className='flex gap-4 w-full'>
        {Object.values(WALLET_CHAINS).map((chain) => {
          const details = CHAIN_DETAILS[chain];
          const isSelected = walletChain === chain;
          
          return (
            <motion.button
              key={chain}
              className={`relative flex-1 p-4 rounded-xl border-2 transition-colors`}
              style={{
                backgroundColor: details.bgColor,
                borderColor: isSelected ? details.color : details.borderColor,
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
              onClick={() => setWalletChain(chain)}
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
              <div className='flex items-center gap-3'>
                <motion.img 
                  src={details.logo} 
                  alt={`${details.name} Logo`} 
                  className='w-8 h-8'
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
                <div className='text-left'>
                  <motion.h3 
                    className='font-semibold'
                    style={{ color: isSelected ? details.color : 'inherit' }}
                  >
                    {details.name}
                  </motion.h3>
                  <p className='text-xs text-gray-600'>{details.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Connect/Sign Button */}
      {walletChain === WALLET_CHAINS.SUI ? (
        <>
          {suiConnected ?
            <BounceButton
              onPress={handleAction}
            >
              Sign message to continue
            </BounceButton>
            :
            <SuiConnectButton
              className={`w-full py-4 px-6 rounded-full font-semibold text-white flex items-center justify-center gap-2 ${getButtonStyle()}`}
            >
              {getButtonText()}
              <ArrowRightIcon className="w-5 h-5" />
            </SuiConnectButton>
          }
        </>
      ) : (
        <motion.button
          className={`w-full py-4 px-6 rounded-full font-semibold text-white flex items-center justify-center gap-2 ${getButtonStyle()}`}
          disabled={!walletChain}
          onClick={handleAction}
          whileHover={walletChain ? { scale: 1.02 } : {}}
          whileTap={walletChain ? { scale: 0.98 } : {}}
        >
          {getButtonText()}
          <ArrowRightIcon className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}