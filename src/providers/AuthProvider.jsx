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
import { isTestnet } from '@/config';

const WALLET_CHAINS = {
  SOLANA: 'SOLANA',
  SUI: 'SUI'
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
  const isConnected = effectiveWalletChain === WALLET_CHAINS.SOLANA ? solanaConnected : (effectiveWalletChain === WALLET_CHAINS.SUI ? suiConnected : false);

  // Get the connected address based on the selected chain
  const connectedAddress = useMemo(() => {
    if (!isConnected) return null;

    switch (effectiveWalletChain) {
      case WALLET_CHAINS.SOLANA:
        return solanaPublicKey?.toBase58() ?? null;
      case WALLET_CHAINS.SUI:
        return suiAccount?.address ?? null;
      default:
        return null;
    }
  }, [effectiveWalletChain, isConnected, solanaPublicKey, suiAccount]);

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
      default:
        return {
          isConnected: false,
          address: null
        };
    }
  }, [effectiveWalletChain, solanaConnected, solanaPublicKey, suiConnected, suiAccount]);

  const handleSignInSolana = async () => {
    const messageData = createSolanaMessage(solanaPublicKey.toBase58(), "Welcome to Pivy!");
    const signature = await signSolanaMessage(messageData.message);

    return {
      chain: WALLET_CHAINS.SOLANA,
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
      publicKey: suiAccount.address,
      message: messageData.message, // Send the original message string
      signature: signature
    };
  };

  const handleSignIn = useCallback(async () => {
    const { isConnected, address } = getWalletState();

    if (!isConnected || !address) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      let signInData;

      switch (effectiveWalletChain) {
        case WALLET_CHAINS.SOLANA:
          signInData = await handleSignInSolana();
          break;
        case WALLET_CHAINS.SUI:
          signInData = await handleSignInSui();
          break;
        default:
          throw new Error("Invalid wallet chain");
      }

      signInData.walletChain = effectiveWalletChain;

      console.log('signInData', signInData);
      console.log('walletChain', effectiveWalletChain);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        signInData
      );

      setAccessToken(response.data);
      const from = location.state?.from || "/";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Sign in error:", error);
      navigate("/login");
    }
  }, [effectiveWalletChain, getWalletState, signSolanaMessage, signSuiPersonalMessage, navigate, location]);

  const handleDisconnect = useCallback(() => {
    switch (effectiveWalletChain) {
      case WALLET_CHAINS.SOLANA:
        disconnectSolana();
        break;
      case WALLET_CHAINS.SUI:
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
    handleDisconnect();
    setMe(null);
    navigate("/login");
  }, [setAccessToken, setLastConnectedAddress, handleDisconnect, navigate]);

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
    if (getWalletState().isConnected && getWalletState().address) {
      if (lastConnectedAddress && lastConnectedAddress !== getWalletState().address) {
        signOut();
      }
      setLastConnectedAddress(getWalletState().address);
    }
  }, [getWalletState, lastConnectedAddress]);

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
  const { isSignedIn, isLoading, walletChain } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isConnected = walletChain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;

  useEffect(() => {
    if (!isLoading && (!isConnected || !isSignedIn)) {
      navigate("/login", {
        state: { from: location.pathname },
        replace: true
      });
    }
  }, [isConnected, isSignedIn, navigate, location, isLoading]);

  if (isLoading) {
    return null;
  }

  if (isConnected && isSignedIn) {
    return <>{children}</>;
  }

  return null;
}

export { WALLET_CHAINS };
