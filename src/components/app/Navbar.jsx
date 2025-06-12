import { Button } from "@heroui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useWalletModal,
  WalletConnectButton,
  WalletDisconnectButton,
  WalletModalButton,
} from "@solana/wallet-adapter-react-ui";
import React, { useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { useZkLogin } from "../../providers/ZkLoginProvider";
import { Popover, PopoverTrigger, PopoverContent, Select, SelectItem } from "@heroui/react";
import { LogOutIcon, ChevronDownIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import GradientProfilePicture from "../shared/GradientProfilePicture";
import { shortenAddress } from "@/utils/misc";
import AnimateComponent from "@/components/elements/AnimateComponent";
import { useWallet as useSuiWallet } from '@suiet/wallet-kit';
import { WALLET_CHAINS } from '@/providers/AuthProvider';
import { jwtDecode } from 'jwt-decode';

const CHAIN_DETAILS = {
  [WALLET_CHAINS.SOLANA]: {
    name: 'Solana',
    logo: '/chains/solana.svg',
    color: '#9945FF',
  },
  [WALLET_CHAINS.SUI]: {
    name: 'Sui',
    logo: '/chains/sui.svg',
    color: '#6FBCF0',
  },
};

export default function Navbar() {
  const { isConnected } = useAuth();
  const isSubdomain = window.location.hostname !== 'localhost' && (
    window.location.hostname.split('.').length > 2 ||
    (window.location.hostname.endsWith('.localhost') && window.location.hostname !== 'localhost')
  );

  const getMainDomainUrl = () => {
    if (!isSubdomain) return '/';

    const port = window.location.port ? `:${window.location.port}` : '';
    let mainDomain = window.location.hostname;

    if (window.location.hostname.endsWith('.localhost')) {
      mainDomain = `localhost${port}`;
    } else {
      mainDomain = window.location.hostname.split('.').slice(-2).join('.');
    }

    return `${window.location.protocol}//${mainDomain}`;
  };

  return (
    <div className="w-full max-w-2xl z-50 fixed py-4 left-1/2 -translate-x-1/2 top-[1rem]">
      <div className="flex flex-row items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 min-h-[4.5rem]">
        {isConnected ? (
          <>
            <AnimateComponent delay={100}>
              <Link to={getMainDomainUrl()} className="hover:opacity-80 transition-opacity">
                <img src="/pivy-horizontal-logo.svg" alt="Pivy Logo" className="h-9" />
              </Link>
            </AnimateComponent>

            <AnimateComponent delay={200}>
              <div className="flex flex-row items-center gap-2 h-full">
                <ChainSelector />
                <WalletButton />
              </div>
            </AnimateComponent>
          </>
        ) : (
          <>
            <Link to={getMainDomainUrl()} className="hover:opacity-80 transition-opacity">
              <img src="/pivy-horizontal-logo.svg" alt="Pivy Logo" className="h-9" />
            </Link>
            <div className="flex flex-row items-center gap-2 h-full">
              <ChainSelector />
              <div className="h-[2.75rem]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ChainSelector = () => {
  const { walletChain, setWalletChain } = useAuth();
  const { connected: solanaConnected, disconnect: disconnectSolana } = useWallet();
  const { connected: suiConnected, disconnect: disconnectSui } = useSuiWallet();

  // For display purposes, treat SUI_ZKLOGIN as SUI
  const displayChain = walletChain === WALLET_CHAINS.SUI_ZKLOGIN ? WALLET_CHAINS.SUI : walletChain;
  const chainDetails = CHAIN_DETAILS[displayChain];

  const handleChainSwitch = async (newChain) => {
    if (!newChain) return; // Prevent undefined chain selection
    
    if (newChain !== walletChain) {
      // Disconnect current wallet if connected
      if (solanaConnected && walletChain === WALLET_CHAINS.SOLANA) {
        await disconnectSolana();
      } else if (suiConnected && (walletChain === WALLET_CHAINS.SUI || walletChain === WALLET_CHAINS.SUI_ZKLOGIN)) {
        await disconnectSui();
      }
      // Force chain change from navbar
      setWalletChain(newChain, true);
    }
  };

  return (
    <Select
      selectedKeys={[displayChain]}
      onChange={(e) => handleChainSwitch(e.target.value)}
      className="w-[8rem]"
      startContent={chainDetails ? <img src={chainDetails.logo} alt={chainDetails.name} className="w-4 h-4" /> : null}
    >
      {Object.entries(CHAIN_DETAILS).map(([chain, details]) => (
        <SelectItem
          key={chain}
          value={chain}
          textValue={details.name}
        >
          <div className="flex items-center gap-2">
            <img src={details.logo} alt={details.name} className="w-4 h-4" />
            <span>{details.name}</span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
};

const WalletButton = () => {
  const { isConnected, connectedAddress, signOut, isSignedIn, walletChain } = useAuth();
  const { zkLoginJwt, zkLoginUserAddress } = useZkLogin();
  const { setVisible } = useWalletModal();

  // Check if user is using zkLogin
  const isZkLoginUser = (walletChain === WALLET_CHAINS.SUI || walletChain === WALLET_CHAINS.SUI_ZKLOGIN) && zkLoginUserAddress;
  
  // Decode Google profile info from JWT for zkLogin users
  let googleProfile = null;
  if (isZkLoginUser && zkLoginJwt) {
    try {
      const decoded = jwtDecode(zkLoginJwt);
      googleProfile = {
        email: decoded.email,
        picture: decoded.picture,
        name: decoded.name
      };
    } catch (error) {
      console.error('Error decoding zkLogin JWT:', error);
    }
  }

  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button
          className="p-2 hover:bg-gray-50 transition-colors"
          size="lg"
          variant="light"
        >
          {isZkLoginUser && googleProfile ? (
            // zkLogin user display with Google profile
            <div className="flex flex-row items-center gap-1">
              <img
                src={googleProfile.picture}
                alt="Google Profile"
                className="size-8 rounded-full border-2 border-gray-200"
                onError={(e) => {
                  // Fallback to gradient picture if Google image fails
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <GradientProfilePicture
                seed={connectedAddress ?? ""}
                className="size-8 border-2 border-black hidden"
              />
              <div className="flex flex-col items-start">
                <p className="font-medium tracking-tight text-sm leading-tight">
                  {googleProfile.email}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {shortenAddress(connectedAddress ?? "")}
                </p>
              </div>
            </div>
          ) : (
            // Traditional wallet display
            <div className="flex flex-row items-center gap-2">
              <GradientProfilePicture
                seed={connectedAddress ?? ""}
                className="size-8 border-2 border-black"
              />
              <p className="font-medium tracking-tight">
                {shortenAddress(connectedAddress ?? "")}
              </p>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2">
        <Button
          onPress={signOut}
          color="danger"
          variant="light"
          className="w-full font-semibold hover:bg-red-50 transition-colors"
        >
          <div className="flex flex-row items-center gap-2">
            <LogOutIcon className="size-4" />
            {isConnected && !isSignedIn && <p className="text-sm">Disconnect</p>}
            {isConnected && isSignedIn && <p className="text-sm">Sign Out</p>}
          </div>
        </Button>
      </PopoverContent>
    </Popover>
  );
};
