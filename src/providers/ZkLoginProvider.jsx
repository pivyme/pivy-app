/*
 * ZkLoginProvider.jsx
 * 
 * Dedicated provider for zkLogin functionality on Sui network.
 * Handles Google OAuth flow, wallet creation, proof generation, and state management.
 * 
 * Required environment variables:
 * - VITE_GOOGLE_CLIENT_ID: Google OAuth application client ID
 * - VITE_BACKEND_URL: Backend API URL
 */

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";
import { 
  generateNonce, 
  generateRandomness,
  getExtendedEphemeralPublicKey
} from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { jwtDecode } from 'jwt-decode';
import { isTestnet } from '@/config';

// Configuration constants
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URL = `${window.location.origin}/auth/callback`;
const SUI_DEVNET_URL = 'https://fullnode.devnet.sui.io';
const SUI_TESTNET_URL = 'https://fullnode.testnet.sui.io';

// Context definition
const ZkLoginContext = createContext({
  // State
  isZkLoginReady: false,
  zkLoginUserAddress: null,
  zkLoginJwt: null,
  zkLoginUserSalt: null,
  zkLoginEphemeralKeyPair: null,
  zkLoginMaxEpoch: null,
  
  // Actions
  initZkLogin: () => {},
  handleZkLoginCallback: () => {},
  generateZkProof: () => {},
  clearZkLoginData: () => {},
  deriveZkLoginMetaKeys: () => {},
  
  // Setters (for callback component)
  setZkLoginUserAddress: () => {},
  setZkLoginJwt: () => {},
  setZkLoginUserSalt: () => {},
});

export function ZkLoginProvider({ children }) {
  // ZkLogin state management with localStorage persistence
  const [zkLoginEphemeralKeyPair, setZkLoginEphemeralKeyPair] = useLocalStorage("pivy-zklogin-ephemeral-keypair", null);
  const [zkLoginRandomness, setZkLoginRandomness] = useLocalStorage("pivy-zklogin-randomness", null);
  const [zkLoginMaxEpoch, setZkLoginMaxEpoch] = useLocalStorage("pivy-zklogin-max-epoch", null);
  const [zkLoginUserSalt, setZkLoginUserSalt] = useLocalStorage("pivy-zklogin-user-salt", null);
  const [zkLoginJwt, setZkLoginJwt] = useLocalStorage("pivy-zklogin-jwt", null);
  const [zkLoginUserAddress, setZkLoginUserAddress] = useLocalStorage("pivy-zklogin-user-address", null);
  const [zkLoginProof, setZkLoginProof] = useLocalStorage("pivy-zklogin-proof", null);

  // Check if zkLogin is ready for use
  const isZkLoginReady = useMemo(() => {
    return !!(zkLoginUserAddress && zkLoginJwt);
  }, [zkLoginUserAddress, zkLoginJwt]);

  // Initialize zkLogin flow - generates ephemeral keys and redirects to Google OAuth
  const initZkLogin = useCallback(async () => {
    try {
      console.log('🚀 Initializing zkLogin flow...');
      
      // Initialize SUI client
      const suiClient = new SuiClient({ 
        url: isTestnet ? SUI_TESTNET_URL : SUI_DEVNET_URL 
      });
      
      // Get current epoch info
      const { epoch } = await suiClient.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2; // Active for 2 epochs
      
      // Generate ephemeral key pair
      const ephemeralKeyPair = new Ed25519Keypair();
      const randomness = generateRandomness();
      const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
      
      // Store ephemeral data
      setZkLoginEphemeralKeyPair({
        privateKey: ephemeralKeyPair.getSecretKey(),
        publicKey: ephemeralKeyPair.getPublicKey().toSuiBytes()
      });
      setZkLoginRandomness(randomness);
      setZkLoginMaxEpoch(maxEpoch);
      
      // Create OAuth URL
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&response_type=id_token&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&scope=openid profile email&nonce=${nonce}`;
      
      console.log('✅ zkLogin initialized, redirecting to Google...');
      
      // Redirect to Google OAuth
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('❌ Error initializing zkLogin:', error);
      throw error;
    }
  }, [setZkLoginEphemeralKeyPair, setZkLoginRandomness, setZkLoginMaxEpoch]);

  // Handle zkLogin callback after Google OAuth
  const handleZkLoginCallback = useCallback(async (jwt) => {
    try {
      console.log('🔐 Processing zkLogin callback...');
      
      // Store the JWT
      setZkLoginJwt(jwt);
      
      // Call backend to get or create zkLogin wallet using Shinami
      console.log('🏦 Creating zkLogin wallet via backend...');
      const zkLoginResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/zklogin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedJWTToken: jwt })
      });
      
      if (!zkLoginResponse.ok) {
        const errorData = await zkLoginResponse.json();
        throw new Error(`Backend zkLogin API error: ${errorData.message || zkLoginResponse.statusText}`);
      }
      
      const zkLoginData = await zkLoginResponse.json();
      console.log('✅ zkLogin wallet data received:', zkLoginData);
      
      // Extract wallet info from Shinami response
      const { result } = zkLoginData;
      const userSalt = result.salt;
      const zkLoginUserAddr = result.address;
      
      console.log('✅ zkLogin wallet created:', { 
        address: zkLoginUserAddr, 
        salt: userSalt,
        userId: result.userId 
      });
      
      // Store the zkLogin data
      setZkLoginUserSalt(userSalt);
      setZkLoginUserAddress(zkLoginUserAddr);
      
      // Return the auth data for login
      return {
        walletChain: 'SUI_ZKLOGIN',
        jwt: jwt,
        walletAddress: zkLoginUserAddr
      };
    } catch (error) {
      console.error('❌ Error handling zkLogin callback:', error);
      throw error;
    }
  }, [setZkLoginJwt, setZkLoginUserSalt, setZkLoginUserAddress]);

  // Generate ZK proof for transactions
  const generateZkProof = useCallback(async () => {
    try {
      if (!zkLoginEphemeralKeyPair || !zkLoginRandomness || !zkLoginMaxEpoch || !zkLoginJwt || !zkLoginUserSalt) {
        throw new Error('Missing zkLogin data for proof generation');
      }

      console.log('🔮 Generating ZK proof for transaction...');
      
      // Reconstruct ephemeral key pair
      const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(zkLoginEphemeralKeyPair.privateKey);
      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());
      
      const proofPayload = {
        jwt: zkLoginJwt,
        extendedEphemeralPublicKey: extendedEphemeralPublicKey.toString(),
        maxEpoch: zkLoginMaxEpoch.toString(),
        jwtRandomness: zkLoginRandomness.toString(),
        salt: zkLoginUserSalt.toString(),
        keyClaimName: 'sub'
      };
      
      const proofResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/zkproof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofPayload)
      });
      
      if (!proofResponse.ok) {
        const errorData = await proofResponse.json();
        throw new Error(`Failed to get ZK proof: ${errorData.message || proofResponse.statusText}`);
      }
      
      const proof = await proofResponse.json();
      console.log('✅ ZK proof generated successfully');
      
      return proof.result.zkProof;
    } catch (error) {
      console.error('❌ Error generating ZK proof:', error);
      throw error;
    }
  }, [zkLoginEphemeralKeyPair, zkLoginRandomness, zkLoginMaxEpoch, zkLoginJwt, zkLoginUserSalt]);

  // Derive meta keys for zkLogin users (for GenerateMetaKey component)
  const deriveZkLoginMetaKeys = useCallback(async (pinCode) => {
    if (!zkLoginJwt) {
      throw new Error('zkLogin JWT not available');
    }

    // Import required dependencies
    const { sha512 } = await import('@noble/hashes/sha512');
    const suiKeypairModule = await import('@mysten/sui/keypairs/ed25519');
    const SuiEd25519Keypair = suiKeypairModule.Ed25519Keypair;
    const { getPrivBytes, getPubBytes } = await import('@/lib/pivy-stealth/pivy-stealth-sui');
    const bs58Module = await import('bs58');
    const { Buffer } = await import('buffer');

    // Use JWT as the base signature for deterministic key derivation
    const decodedJwt = jwtDecode(zkLoginJwt);
    const jwtSignatureBase = `${decodedJwt.sub}_${decodedJwt.aud}_${decodedJwt.iss}`;
    const baseSignature = new TextEncoder().encode(jwtSignatureBase);

    const pinBytes = new TextEncoder().encode(pinCode);
    const domainBytes = new TextEncoder().encode('PIVY | Deterministic Meta Keys | Sui Network');

    // Derive spend key
    const spendSeed = sha512(Uint8Array.from([
      ...baseSignature,
      ...domainBytes,
      ...pinBytes,
      ...new TextEncoder().encode('PIVY Spend Authority | Deterministic Derivation')
    ])).slice(0, 32);
    const spendKeypair = SuiEd25519Keypair.fromSecretKey(spendSeed);
    const spendPriv = getPrivBytes(spendKeypair);
    const spendPubB58 = bs58Module.default.encode(getPubBytes(spendKeypair));

    // Derive view key
    const viewSeed = sha512(Uint8Array.from([
      ...baseSignature,
      ...domainBytes,
      ...pinBytes,
      ...new TextEncoder().encode('PIVY View Authority | Deterministic Derivation')
    ])).slice(0, 32);
    const viewKeypair = SuiEd25519Keypair.fromSecretKey(viewSeed);
    const viewPriv = getPrivBytes(viewKeypair);
    const viewPubB58 = bs58Module.default.encode(getPubBytes(viewKeypair));

    return {
      metaSpendPriv: Buffer.from(spendPriv).toString("hex"),
      metaViewPriv: Buffer.from(viewPriv).toString("hex"),
      metaSpendPub: spendPubB58,
      metaViewPub: viewPubB58,
    };
  }, [zkLoginJwt]);

  // Clear all zkLogin data (for logout)
  const clearZkLoginData = useCallback(() => {
    console.log('🧹 Clearing zkLogin data...');
    setZkLoginEphemeralKeyPair(null);
    setZkLoginRandomness(null);
    setZkLoginMaxEpoch(null);
    setZkLoginUserSalt(null);
    setZkLoginJwt(null);
    setZkLoginUserAddress(null);
    setZkLoginProof(null);
  }, [
    setZkLoginEphemeralKeyPair,
    setZkLoginRandomness,
    setZkLoginMaxEpoch,
    setZkLoginUserSalt,
    setZkLoginJwt,
    setZkLoginUserAddress,
    setZkLoginProof
  ]);

  // Context value
  const contextValue = useMemo(() => ({
    // State
    isZkLoginReady,
    zkLoginUserAddress,
    zkLoginJwt,
    zkLoginUserSalt,
    zkLoginEphemeralKeyPair,
    zkLoginMaxEpoch,
    
    // Actions
    initZkLogin,
    handleZkLoginCallback,
    generateZkProof,
    clearZkLoginData,
    deriveZkLoginMetaKeys,
    
    // Setters (for callback component)
    setZkLoginUserAddress,
    setZkLoginJwt,
    setZkLoginUserSalt,
  }), [
    isZkLoginReady,
    zkLoginUserAddress,
    zkLoginJwt,
    zkLoginUserSalt,
    zkLoginEphemeralKeyPair,
    zkLoginMaxEpoch,
    initZkLogin,
    handleZkLoginCallback,
    generateZkProof,
    clearZkLoginData,
    deriveZkLoginMetaKeys,
    setZkLoginUserAddress,
    setZkLoginJwt,
    setZkLoginUserSalt,
  ]);

  return (
    <ZkLoginContext.Provider value={contextValue}>
      {children}
    </ZkLoginContext.Provider>
  );
}

export function useZkLogin() {
  const context = useContext(ZkLoginContext);
  if (!context) {
    throw new Error("useZkLogin must be used within a ZkLoginProvider");
  }
  return context;
}

export { ZkLoginContext }; 