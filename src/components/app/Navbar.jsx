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
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { LogOutIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import GradientProfilePicture from "../shared/GradientProfilePicture";
import { shortenAddress } from "@/utils/misc";
import AnimateComponent from "@/components/elements/AnimateComponent";

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
              <div className="h-[2.75rem]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const WalletButton = () => {
  const { isConnected, connectedAddress, signOut, isSignedIn } = useAuth();
  const { setVisible } = useWalletModal();
  const { walletChain } = useAuth()
  console.log('walletChain', walletChain)

  const getChainLogo = () => {
    return walletChain === 'SOLANA' ? '/chains/solana.svg' : '/chains/sui.svg';
  };

  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button
          className="p-2 hover:bg-gray-50 transition-colors"
          size="lg"
          variant="light"
        >
          <div className="flex flex-row items-center gap-2">
            <GradientProfilePicture
              seed={connectedAddress ?? ""}
              className="size-8 border-2 border-black"
            />
            <div className="flex items-center gap-2">
              <p className="font-medium tracking-tight">
                {shortenAddress(connectedAddress ?? "")}
              </p>
              <img 
                src={getChainLogo()} 
                alt={`${walletChain} chain`} 
                className="w-5 h-5"
              />
            </div>
          </div>
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
