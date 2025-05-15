import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Header, Payload, SIWS } from "@web3auth/sign-in-with-solana";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Buffer } from "buffer";

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

const AuthContext = createContext({
  accessToken: null,
  isSignedIn: false,
  signIn: () => {},
  signOut: () => {},
  me: null,
  fetchMe: () => {},
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
  const [me, setMe] = useState(null);
  const { connected, publicKey, signMessage, signIn, disconnect } = useWallet();
  const navigate = useNavigate();

  const fetchMe = useCallback(async () => {
    if (!accessToken) {
      setMe(null);
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
    }
  }, [accessToken]);

  useEffect(() => {
    fetchMe();
  }, [accessToken, fetchMe]);

  useEffect(() => {
    if (connected && publicKey) {
      const currentAddress = publicKey.toBase58();
      if (lastConnectedAddress && lastConnectedAddress !== currentAddress) {
        signOut();
      }
      setLastConnectedAddress(currentAddress);
    }
  }, [connected, publicKey, lastConnectedAddress]);

  const handleSignIn = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) {
      navigate("/login");
      return;
    }

    try {
      const message = createSolanaMessage(
        publicKey.toBase58(),
        "Welcome to Pivy!"
      );
      const signature = await signMessage(message.message);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        {
          publicKey: publicKey.toBase58(),
          payload: message.payload,
          header: message.header,
          signature: {
            t: "sip99",
            s: Buffer.from(signature).toString("base64"),
          },
        }
      );

      setAccessToken(response.data);
      navigate("/");
    } catch (error) {
      console.error("Sign in error:", error);
      navigate("/login");
    }
  }, [connected, publicKey, signMessage, navigate]);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setLastConnectedAddress(null);
    disconnect();
    setMe(null);
  }, [setAccessToken, setLastConnectedAddress]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isSignedIn: !!accessToken,
        signIn: handleSignIn,
        signOut,
        me,
        fetchMe,
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
  const { connected } = useWallet();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!connected || !isSignedIn) {
      navigate("/login");
    }
  }, [connected, isSignedIn, navigate]);

  if (!connected || !isSignedIn) {
    return null;
  }

  return <>{children}</>;
}
