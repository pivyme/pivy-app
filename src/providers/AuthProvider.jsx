/*
 * AuthProvider.jsx
 * 
 * This provider handles authentication for both Solana (traditional wallet signing) 
 * and SUI (traditional wallet signing + zkLogin with Google OAuth).
 * 
 * For zkLogin to work properly, you need to set up:
 * 1. VITE_GOOGLE_CLIENT_ID in your .env file
 *    - Create a Google OAuth application at https://console.developers.google.com/
 *    - Add your domain to authorized origins
 *    - Add `${YOUR_DOMAIN}/auth/callback` to authorized redirect URIs
 * 
 * 2. Your Google Client ID must be whitelisted with Mysten Labs salt service
 *    for production use. For development, the fallback salt generation will be used.
 * 
 * Example .env:
 * VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Header, Payload, SIWS } from "@web3auth/sign-in-with-solana";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Buffer } from "buffer";
import { useWallet as useSuiWallet } from "@suiet/wallet-kit";
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import { isTestnet } from '@/config';

const WALLET_CHAINS = {
  SOLANA: 'SOLANA',
  SUI: 'SUI',
  SUI_ZKLOGIN: 'SUI_ZKLOGIN'
}



function createSolanaMessage(address, statement) {
  const header = new Header();
  header.t = "sip99";

  const payload = new Payload();
  payload.domain = "pivy.me";
  payload.address = address;
  payload.uri = window.location.origin;
  payload.statement = statement;
  payload.version = "1";
  payload.chainId = "1";

  const message = new SIWS({
    header,
    payload,
  });
  const stringMessage = message.prepareMessage();
  return {
    message: new TextEncoder().encode(stringMessage),
    payload: payload,
    header: header,
  };
}

function createSuiMessage(address, statement) {
  // Simple message for now, can be enhanced with proper Sui signing standard
  const message = `${statement}\n\nWallet address: ${address}`;
  return {
    message: message, // Return the raw string
    encoded: new TextEncoder().encode(message) // Return the encoded version for signing
  };
}

const AuthContext = createContext({
  accessToken: null,
  isSignedIn: false,
  signIn: () => { },
  signOut: () => { },
  me: null,
  fetchMe: () => { },
  isLoading: true,
  walletChain: null,
  setWalletChain: () => { },
  isConnected: false,
  connectedAddress: null,
  walletChainId: null,
  metaSpendPriv: null,
  metaViewPriv: null,
  hasMetaKeys: false,
  saveMetaKeys: () => { },
  // ZkLogin specific
  initZkLogin: () => { },
  zkLoginUserAddress: null,
  isZkLoginReady: false,
});

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useLocalStorage(
    "pivy-access-token",
    null
  );
  const [lastConnectedAddress, setLastConnectedAddress] = useLocalStorage(
    "pivy-last-connected-address",
    null
  );
  const [walletChain, setWalletChainStorage] = useLocalStorage(
    "pivy-wallet-chain",
    WALLET_CHAINS.SOLANA
  );
  const [metaSpendPriv, setMetaSpendPriv] = useLocalStorage("pivy-meta-spend-priv", null);
  const [metaViewPriv, setMetaViewPriv] = useLocalStorage("pivy-meta-view-priv", null);
  const [me, setMe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [forceChainFromNavbar, setForceChainFromNavbar] = useState(null);
  
  // Use zkLogin hook
  const { 
    zkLoginUserAddress, 
    zkLoginJwt,
    isZkLoginReady, 
    initZkLogin, 
    generateZkProof,
    clearZkLoginData 
  } = useZkLogin();

  // Effect to handle initial chain selection from URL query
  useEffect(() => {
    const chainParam = searchParams.get('c')?.toUpperCase();
    if (chainParam && Object.values(WALLET_CHAINS).includes(chainParam)) {
      setWalletChainStorage(chainParam);
    }
  }, []); // Run only once on mount

  // Strict chain management
  const setWalletChain = useCallback((newChain, fromNavbar = false) => {
    if (fromNavbar) {
      setForceChainFromNavbar(newChain);
      setWalletChainStorage(newChain);
    }
  }, []);

  // Use the forced chain from navbar or fallback to storage
  const effectiveWalletChain = forceChainFromNavbar || walletChain;

  // Compute walletChainId based on walletChain and network type
  const walletChainId = useMemo(() => {
    if (!effectiveWalletChain) return null;

    switch (effectiveWalletChain) {
      case WALLET_CHAINS.SOLANA:
        return isTestnet ? 'DEVNET' : 'MAINNET';
      case WALLET_CHAINS.SUI:
      case WALLET_CHAINS.SUI_ZKLOGIN:
        return isTestnet ? 'SUI_TESTNET' : 'SUI_MAINNET';
      default:
        return null;
    }
  }, [effectiveWalletChain]);

  // Wallet connections
  const {
    connected: solanaConnected,
    publicKey: solanaPublicKey,
    signMessage: signSolanaMessage,
    disconnect: disconnectSolana
  } = useWallet();

  const {
    connected: suiConnected,
    account: suiAccount,
    signPersonalMessage: signSuiPersonalMessage,
    disconnect: disconnectSui
  } = useSuiWallet();

  const navigate = useNavigate();
  const location = useLocation();

  // Determine if connected based on selected chain
  const isConnected = effectiveWalletChain === WALLET_CHAINS.SOLANA 
    ? solanaConnected 
    : ((effectiveWalletChain === WALLET_CHAINS.SUI || effectiveWalletChain === WALLET_CHAINS.SUI_ZKLOGIN) ? (zkLoginUserAddress || suiConnected) : false);

  // Get the connected address based on the selected chain
  const connectedAddress = useMemo(() => {
    switch (effectiveWalletChain) {
      case WALLET_CHAINS.SOLANA:
        return isConnected ? solanaPublicKey?.toBase58() ?? null : null;
      case WALLET_CHAINS.SUI:
      case WALLET_CHAINS.SUI_ZKLOGIN:
        // For SUI, prioritize zkLogin address if available
        if (zkLoginUserAddress) return zkLoginUserAddress;
        return isConnected ? suiAccount?.address ?? null : null;
      default:
        return null;
    }
  }, [effectiveWalletChain, isConnected, solanaPublicKey, suiAccount, zkLoginUserAddress]);

  const getWalletState = useCallback(() => {
    switch (effectiveWalletChain) {
      case WALLET_CHAINS.SOLANA:
        return {
          isConnected: solanaConnected,
          address: solanaPublicKey?.toBase58()
        };
      case WALLET_CHAINS.SUI:
        return {
          isConnected: suiConnected,
          address: suiAccount?.address
        };
      case WALLET_CHAINS.SUI_ZKLOGIN:
        // For zkLogin, prioritize zkLogin state
        return {
          isConnected: zkLoginUserAddress ? true : suiConnected,
          address: zkLoginUserAddress || suiAccount?.address
        };
      default:
        return {
          isConnected: false,
          address: null
        };
    }
  }, [effectiveWalletChain, solanaConnected, solanaPublicKey, suiConnected, suiAccount, zkLoginUserAddress]);

  const handleSignInSolana = async () => {
    const messageData = createSolanaMessage(solanaPublicKey.toBase58(), "Welcome to Pivy!");
    const signature = await signSolanaMessage(messageData.message);

    return {
      chain: WALLET_CHAINS.SOLANA,
      walletChain: "SOLANA",
      publicKey: solanaPublicKey.toBase58(),
      payload: messageData.payload,
      header: messageData.header,
      signature: {
        t: "sip99",
        s: Buffer.from(signature).toString("base64"),
      }
    };
  };

  const handleSignInSui = async () => {
    const messageData = createSuiMessage(suiAccount.address, "Welcome to Pivy!");
    const signature = await signSuiPersonalMessage({
      message: messageData.encoded // Use the encoded version for signing
    });

    return {
      chain: WALLET_CHAINS.SUI,
      walletChain: "SUI",
      publicKey: suiAccount.address,
      message: messageData.message, // Send the original message string
      signature: signature
    };
  };







  const handleSignIn = useCallback(async (signInData = null) => {
    console.log('🚀 Starting sign-in process...', { hasSignInData: !!signInData, walletChain: effectiveWalletChain });
    
    try {
      let authData;

      // If we already have signInData (from zkLogin callback), use it directly
      if (signInData) {
        console.log('🔐 Using provided sign-in data (zkLogin)...');
        authData = signInData;
        // For zkLogin, immediately update the wallet chain and address to prevent race conditions
        if (authData.walletChain === 'SUI_ZKLOGIN') {
          setWalletChainStorage(WALLET_CHAINS.SUI_ZKLOGIN);
          setLastConnectedAddress(authData.walletAddress);
        }
      } else {
        // Handle traditional wallet sign-in
        switch (effectiveWalletChain) {
          case WALLET_CHAINS.SOLANA: {
            console.log('🟡 Processing Solana sign-in...');
            const { isConnected: solanaIsConnected, address: solanaAddress } = getWalletState();
            if (!solanaIsConnected || !solanaAddress) {
              console.log('❌ Solana wallet not connected');
              return;
            }
            authData = await handleSignInSolana();
            break;
          }
          case WALLET_CHAINS.SUI:
          case WALLET_CHAINS.SUI_ZKLOGIN: {
            if (zkLoginUserAddress && isZkLoginReady) {
              console.log('🔵 Using existing zkLogin data...');
              // Use existing zkLogin data and update wallet chain to SUI_ZKLOGIN
              setWalletChainStorage(WALLET_CHAINS.SUI_ZKLOGIN);
              setLastConnectedAddress(zkLoginUserAddress);
              authData = {
                walletChain: 'SUI_ZKLOGIN',
                jwt: zkLoginJwt,
                walletAddress: zkLoginUserAddress
              };
            } else {
              console.log('🔵 Processing traditional SUI wallet sign-in...');
              const { isConnected: suiIsConnected, address: suiAddress } = getWalletState();
              if (!suiIsConnected || !suiAddress) {
                console.log('❌ SUI wallet not connected');
                return;
              }
              // Fallback to traditional SUI wallet signing
              authData = await handleSignInSui();
            }
            break;
          }
          default:
            throw new Error("Invalid wallet chain");
        }
      }

      console.log('Final auth data:', authData);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        authData
      );

      setAccessToken(response.data);
      
      // Clear any error parameters from URL on successful sign-in
      const currentUrl = new URL(window.location);
      if (currentUrl.searchParams.has('error')) {
        currentUrl.searchParams.delete('error');
        window.history.replaceState(null, '', currentUrl.toString());
      }
      
      const from = location.state?.from || "/";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Sign in error:", error);
      // Don't add error parameter here to avoid the error message appearing
      // The zkLogin callback component will handle error redirects with parameters
      if (signInData && signInData.walletChain === 'SUI_ZKLOGIN') {
        // This was a zkLogin sign-in failure, redirect will be handled by callback component
        return;
      }
      navigate("/login");
    }
  }, [effectiveWalletChain, getWalletState, handleSignInSolana, handleSignInSui, navigate, location, zkLoginUserAddress, isZkLoginReady, setWalletChainStorage, setLastConnectedAddress, zkLoginJwt]);

  const handleDisconnect = useCallback(() => {
    switch (effectiveWalletChain) {
      case WALLET_CHAINS.SOLANA:
        disconnectSolana();
        break;
      case WALLET_CHAINS.SUI:
      case WALLET_CHAINS.SUI_ZKLOGIN:
        disconnectSui();
        break;
    }
  }, [effectiveWalletChain, disconnectSolana, disconnectSui]);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setLastConnectedAddress(null);
    setWalletChain(null);
    setMetaSpendPriv(null);
    setMetaViewPriv(null);
    // Clear zkLogin data
    clearZkLoginData();
    handleDisconnect();
    setMe(null);
    navigate("/login");
  }, [setAccessToken, setLastConnectedAddress, handleDisconnect, navigate, clearZkLoginData]);

  const fetchMe = useCallback(async () => {
    if (!accessToken) {
      setMe(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setMe(response.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      signOut();
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchMe();
  }, [accessToken, fetchMe]);

  // Effect to handle wallet connections and maintain chain selection
  useEffect(() => {
    const { isConnected, address } = getWalletState();
    if (isConnected && address) {
      // Only trigger signOut if we have a different address AND we're not in a zkLogin flow
      // zkLogin addresses might be different from traditional wallet addresses
      if (lastConnectedAddress && 
          lastConnectedAddress !== address && 
          effectiveWalletChain !== WALLET_CHAINS.SUI_ZKLOGIN &&
          !zkLoginUserAddress) {
        console.log('🔄 Address changed, signing out...', { 
          lastConnected: lastConnectedAddress, 
          current: address,
          walletChain: effectiveWalletChain 
        });
        signOut();
        return;
      }
      setLastConnectedAddress(address);
    }
  }, [getWalletState, lastConnectedAddress, signOut, effectiveWalletChain, zkLoginUserAddress, setLastConnectedAddress]);

  // Function to save meta keys
  const saveMetaKeys = useCallback((spendPriv, viewPriv) => {
    setMetaSpendPriv(spendPriv);
    setMetaViewPriv(viewPriv);
  }, [setMetaSpendPriv, setMetaViewPriv]);

  // Check if meta keys are complete
  const hasMetaKeys = useMemo(() => {
    if (!me) return false;
    return (
      me.metaSpendPub && 
      me.metaViewPub && 
      metaSpendPriv && 
      metaViewPriv
    );
  }, [me, metaSpendPriv, metaViewPriv]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 Auth state changed:', {
      isSignedIn: !!accessToken,
      walletChain: effectiveWalletChain,
      isConnected,
      connectedAddress,
      zkLoginUserAddress,
      isZkLoginReady,
      hasAccessToken: !!accessToken,
      timestamp: new Date().toISOString()
    });
  }, [accessToken, effectiveWalletChain, isConnected, connectedAddress, zkLoginUserAddress, isZkLoginReady]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isSignedIn: !!accessToken,
        signIn: handleSignIn,
        signOut,
        me,
        fetchMe,
        isLoading,
        walletChain: effectiveWalletChain,
        setWalletChain,
        isConnected,
        connectedAddress,
        walletChainId,
        saveMetaKeys,
        hasMetaKeys,
        metaSpendPriv,
        metaViewPriv,
        // ZkLogin specific
        initZkLogin,
        zkLoginUserAddress,
        zkLoginJwt,
        isZkLoginReady,
        generateZkProof,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function ProtectedRoute({ children }) {
  const { connected: solanaConnected } = useWallet();
  const { connected: suiConnected } = useSuiWallet();
  const { isSignedIn, isLoading, walletChain, zkLoginUserAddress, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isConnected = walletChain === WALLET_CHAINS.SOLANA 
    ? solanaConnected 
    : ((walletChain === WALLET_CHAINS.SUI || walletChain === WALLET_CHAINS.SUI_ZKLOGIN) ? (zkLoginUserAddress || suiConnected) : false);

  useEffect(() => {
    // Add a small delay to prevent race conditions during auth flow
    const checkAuth = () => {
      // Only redirect if we're sure the user is not authenticated
      // Don't redirect if we have an access token (even if other states are still syncing)
      if (!isLoading && !accessToken && (!isConnected || !isSignedIn)) {
        console.log('🔄 Redirecting to login:', { 
          isLoading, 
          isConnected, 
          isSignedIn, 
          hasAccessToken: !!accessToken,
          walletChain,
          zkLoginUserAddress: !!zkLoginUserAddress 
        });
        navigate("/login", {
          state: { from: location.pathname },
          replace: true
        });
      }
    };

    // Small delay to allow state updates to complete
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [isConnected, isSignedIn, navigate, location, isLoading, accessToken, walletChain, zkLoginUserAddress]);

  if (isLoading) {
    return null;
  }

  // Allow access if we have an access token, even if other states are still syncing
  if (accessToken && (isConnected && isSignedIn)) {
    return <>{children}</>;
  }

  return null;
}

export { WALLET_CHAINS };
