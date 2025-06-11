import React, { useState, useEffect } from 'react';
import { Button, InputOtp } from '@heroui/react';
import { KeyRoundIcon, ShieldCheckIcon, LockIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import AnimateComponent from '@/components/elements/AnimateComponent';

// Sui imports
import { getPrivBytes, getPubBytes } from '@/lib/pivy-stealth/pivy-stealth-sui';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair as SuiEd25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { useWallet as useSuiWallet } from '@suiet/wallet-kit';

// Solana imports
import { Keypair } from '@solana/web3.js';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import * as ed from '@noble/ed25519';

// Common imports
import { sha512 } from '@noble/hashes/sha512';
import bs58 from 'bs58';
import { Buffer } from 'buffer';
import axios from 'axios';
import { useAuth } from '@/providers/AuthProvider';

const SUI_DOMAIN = 'PIVY | Deterministic Meta Keys | Sui Network';
const SOLANA_DOMAIN = 'PIVY | Deterministic Meta Keys | Solana Network';
const SPEND_CONTEXT = 'PIVY Spend Authority | Deterministic Derivation';
const VIEW_CONTEXT = 'PIVY View Authority | Deterministic Derivation';

function SuiGenerateMetaKey() {
  const suiWallet = useSuiWallet();
  const { accessToken, saveMetaKeys, fetchMe, me } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Determine if user already has meta keys
  const hasExistingKeys = me?.metaViewPub && me?.metaSpendPub;
  const isNewAccount = !hasExistingKeys;

  const resetState = () => {
    setError('');
    setSuccess(false);
  };

  useEffect(() => {
    resetState();
  }, [pin]);

  async function deriveMetaKeysWithPin(pinCode) {
    // Get single signature for both keys
    const sig = await suiWallet.signPersonalMessage({
      message: new TextEncoder().encode(`${SUI_DOMAIN}`)
    });

    // Incorporate PIN into the derivation process
    const pinBytes = new TextEncoder().encode(pinCode);
    const baseSignature = sig.signature;

    // Derive spend key with PIN
    const spendSeed = sha512(Uint8Array.from([
      ...baseSignature,
      ...pinBytes,
      ...new TextEncoder().encode(SPEND_CONTEXT)
    ])).slice(0, 32);
    const spendKeypair = SuiEd25519Keypair.fromSecretKey(spendSeed);
    const spendPriv = getPrivBytes(spendKeypair);
    const spendPubB58 = bs58.encode(getPubBytes(spendKeypair));

    // Derive view key with PIN  
    const viewSeed = sha512(Uint8Array.from([
      ...baseSignature,
      ...pinBytes,
      ...new TextEncoder().encode(VIEW_CONTEXT)
    ])).slice(0, 32);
    const viewKeypair = SuiEd25519Keypair.fromSecretKey(viewSeed);
    const viewPriv = getPrivBytes(viewKeypair);
    const viewPubB58 = bs58.encode(getPubBytes(viewKeypair));

    return {
      metaSpendPriv: Buffer.from(spendPriv).toString("hex"),
      metaViewPriv: Buffer.from(viewPriv).toString("hex"),
      metaSpendPub: spendPubB58,
      metaViewPub: viewPubB58,
    };
  }

  async function handleSubmit() {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const metaData = await deriveMetaKeysWithPin(pin);

      if (hasExistingKeys) {
        // Validate PIN by comparing generated keys with existing ones
        if (metaData.metaViewPub !== me.metaViewPub || metaData.metaSpendPub !== me.metaSpendPub) {
          setError('Incorrect PIN. Please try again.');
          return;
        }

        // PIN is correct - just save to local storage
        saveMetaKeys(metaData.metaSpendPriv, metaData.metaViewPriv);
        setSuccess(true);
      } else {
        // New account - register meta keys
        console.log('Generated Meta Keys:', metaData);

        // Store ALL private keys locally (spending key never goes to backend)
        saveMetaKeys(metaData.metaSpendPriv, metaData.metaViewPriv);

        // Send only non-spending keys to backend for transaction indexing
        const metaDataToSend = {
          metaSpendPub: metaData.metaSpendPub,
          metaViewPub: metaData.metaViewPub,
          metaViewPriv: metaData.metaViewPriv,
        };

        const res = await axios({
          method: 'POST',
          url: `${import.meta.env.VITE_BACKEND_URL}/auth/register-meta-keys`,
          data: metaDataToSend,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        console.log('Meta Keys Registered:', res.data);
        await fetchMe();
        setSuccess(true);
      }
    } catch (error) {
      console.error('Error with meta keys:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const isPinComplete = pin.length === 4;

  return (
    <div className="flex flex-col items-center justify-center px-4 w-full min-h-[60vh] z-20 relative">
      <AnimateComponent>
        <div className="flex flex-col items-center gap-6 text-center z-10 relative p-8 max-w-md w-full nice-card">

          {/* Header */}
          <AnimateComponent delay={100}>
            <div className="flex flex-col items-center gap-3">
              {isNewAccount ? (
                <div className="p-3 bg-primary-100 rounded-full">
                  <KeyRoundIcon className="w-8 h-8 text-primary-600" />
                </div>
              ) : (
                <div className="p-3 bg-success-100 rounded-full">
                  <ShieldCheckIcon className="w-8 h-8 text-success-600" />
                </div>
              )}

              <h1 className="text-2xl font-bold tracking-tight">
                {isNewAccount ? 'Set Your PIN' : 'Enter Your PIN'}
              </h1>
            </div>
          </AnimateComponent>

          {/* Description */}
          <AnimateComponent delay={200}>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isNewAccount ? (
                <>
                  Create a secure 4-digit PIN to protect your meta keys.
                  Your PIN is used to generate deterministic keys that you can always recover.
                </>
              ) : (
                <>
                  Enter your PIN to unlock your meta keys and access your account.
                </>
              )}
            </p>
          </AnimateComponent>

          {/* PIN Input */}
          <AnimateComponent delay={300}>
            <div className="flex flex-col items-center gap-3 w-full">
              <InputOtp
                length={4}
                value={pin}
                onValueChange={setPin}
                size='lg'
                className='w-full'
                classNames={{
                  inputWrapper: "border-2 border-gray-200 hover:border-primary-300 focus-within:border-primary-500",
                }}
              />

              {error && (
                <div className="flex items-center gap-2 text-danger-500 text-sm">
                  <AlertCircleIcon className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-success-500 text-sm">
                  <CheckCircleIcon className="w-4 h-4" />
                  {isNewAccount ? 'Meta keys created successfully!' : 'PIN verified successfully!'}
                </div>
              )}
            </div>
          </AnimateComponent>

          {/* Action Button */}
          <AnimateComponent delay={400}>
            <Button
              className="w-full font-semibold tracking-tight"
              radius="full"
              size="lg"
              color="primary"
              startContent={<LockIcon className="w-4 h-4" />}
              onPress={handleSubmit}
              isLoading={isLoading}
              isDisabled={!isPinComplete || success}
            >
              {isLoading ? (
                isNewAccount ? 'Creating Keys...' : 'Verifying PIN...'
              ) : success ? (
                'Complete!'
              ) : (
                isNewAccount ? 'Create Meta Keys' : 'Verify PIN'
              )}
            </Button>
          </AnimateComponent>

          {/* Security Note */}
          {isNewAccount && (
            <AnimateComponent delay={500}>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">
                      Your Keys, Your Control
                    </h3>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Your spending keys never leave your device. Only view keys are shared for transaction indexing, ensuring complete self-custody of your funds.
                    </p>
                  </div>
                </div>
              </div>
            </AnimateComponent>
          )}

        </div>
      </AnimateComponent>
    </div>
  );
}

function SolanaGenerateMetaKey() {
  const solanaWallet = useSolanaWallet();
  const { accessToken, saveMetaKeys, fetchMe, me } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Determine if user already has meta keys
  const hasExistingKeys = me?.metaViewPub && me?.metaSpendPub;
  const isNewAccount = !hasExistingKeys;

  const resetState = () => {
    setError('');
    setSuccess(false);
  };

  useEffect(() => {
    resetState();
  }, [pin]);

  async function deriveMetaKeysWithPin(pinCode) {
    // Get signature from Solana wallet
    const message = new TextEncoder().encode(SOLANA_DOMAIN);
    const signature = await solanaWallet.signMessage(message);

    // Incorporate PIN into the derivation process
    const pinBytes = new TextEncoder().encode(pinCode);

    // Derive spend key with PIN
    const spendSeed = sha512(Uint8Array.from([
      ...signature,
      ...pinBytes,
      ...new TextEncoder().encode(SPEND_CONTEXT)
    ])).slice(0, 32);
    const spendKeypair = Keypair.fromSeed(spendSeed);

    // Derive view key with PIN  
    const viewSeed = sha512(Uint8Array.from([
      ...signature,
      ...pinBytes,
      ...new TextEncoder().encode(VIEW_CONTEXT)
    ])).slice(0, 32);
    const viewKeypair = Keypair.fromSeed(viewSeed);

    return {
      metaSpendPriv: Buffer.from(spendKeypair.secretKey.slice(0, 32)).toString("hex"),
      metaViewPriv: Buffer.from(viewKeypair.secretKey.slice(0, 32)).toString("hex"),
      metaSpendPub: spendKeypair.publicKey.toBase58(),
      metaViewPub: viewKeypair.publicKey.toBase58(),
    };
  }

  async function handleSubmit() {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const metaData = await deriveMetaKeysWithPin(pin);

      if (hasExistingKeys) {
        // Validate PIN by comparing generated keys with existing ones
        if (metaData.metaViewPub !== me.metaViewPub || metaData.metaSpendPub !== me.metaSpendPub) {
          setError('Incorrect PIN. Please try again.');
          return;
        }

        // PIN is correct - just save to local storage
        saveMetaKeys(metaData.metaSpendPriv, metaData.metaViewPriv);
        setSuccess(true);
      } else {
        // New account - register meta keys
        console.log('Generated Meta Keys:', metaData);

        // Store ALL private keys locally (spending key never goes to backend)
        saveMetaKeys(metaData.metaSpendPriv, metaData.metaViewPriv);

        // Send only non-spending keys to backend for transaction indexing
        const metaDataToSend = {
          metaSpendPub: metaData.metaSpendPub,
          metaViewPub: metaData.metaViewPub,      
          metaViewPriv: metaData.metaViewPriv,
        };

        console.log('metaDataToSend', metaDataToSend);

        const res = await axios({
          method: 'POST',
          url: `${import.meta.env.VITE_BACKEND_URL}/auth/register-meta-keys`,
          data: metaDataToSend,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        console.log('Meta Keys Registered:', res.data);
        await fetchMe();
        setSuccess(true);
      }
    } catch (error) {
      console.error('Error with meta keys:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const isPinComplete = pin.length === 4;

  return (
    <div className="flex flex-col items-center justify-center px-4 w-full min-h-[60vh] z-20 relative">
      <AnimateComponent>
        <div className="flex flex-col items-center gap-6 text-center z-10 relative p-8 max-w-md w-full nice-card">

          {/* Header */}
          <AnimateComponent delay={100}>
            <div className="flex flex-col items-center gap-3">
              {isNewAccount ? (
                <div className="p-3 bg-primary-100 rounded-full">
                  <KeyRoundIcon className="w-8 h-8 text-primary-600" />
                </div>
              ) : (
                <div className="p-3 bg-success-100 rounded-full">
                  <ShieldCheckIcon className="w-8 h-8 text-success-600" />
                </div>
              )}

              <h1 className="text-2xl font-bold tracking-tight">
                {isNewAccount ? 'Set Your PIN' : 'Enter Your PIN'}
              </h1>
            </div>
          </AnimateComponent>

          {/* Description */}
          <AnimateComponent delay={200}>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isNewAccount ? (
                <>
                  Create a secure 4-digit PIN to protect your meta keys.
                  Your PIN is used to generate deterministic keys that you can always recover.
                </>
              ) : (
                <>
                  Enter your PIN to unlock your meta keys and access your account.
                </>
              )}
            </p>
          </AnimateComponent>

          {/* PIN Input */}
          <AnimateComponent delay={300}>
            <div className="flex flex-col items-center gap-3 w-full">
              <InputOtp
                length={4}
                value={pin}
                onValueChange={setPin}
                size='lg'
                className='w-full'
                classNames={{
                  inputWrapper: "border-2 border-gray-200 hover:border-primary-300 focus-within:border-primary-500",
                }}
              />

              {error && (
                <div className="flex items-center gap-2 text-danger-500 text-sm">
                  <AlertCircleIcon className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-success-500 text-sm">
                  <CheckCircleIcon className="w-4 h-4" />
                  {isNewAccount ? 'Meta keys created successfully!' : 'PIN verified successfully!'}
                </div>
              )}
            </div>
          </AnimateComponent>

          {/* Action Button */}
          <AnimateComponent delay={400}>
            <Button
              className="w-full font-semibold tracking-tight"
              radius="full"
              size="lg"
              color="primary"
              startContent={<LockIcon className="w-4 h-4" />}
              onPress={handleSubmit}
              isLoading={isLoading}
              isDisabled={!isPinComplete || success}
            >
              {isLoading ? (
                isNewAccount ? 'Creating Keys...' : 'Verifying PIN...'
              ) : success ? (
                'Complete!'
              ) : (
                isNewAccount ? 'Create Meta Keys' : 'Verify PIN'
              )}
            </Button>
          </AnimateComponent>

          {/* Security Note */}
          {isNewAccount && (
            <AnimateComponent delay={500}>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">
                      Your Keys, Your Control
                    </h3>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Your spending keys never leave your device. Only view keys are shared for transaction indexing, ensuring complete self-custody of your funds.
                    </p>
                  </div>
                </div>
              </div>
            </AnimateComponent>
          )}

        </div>
      </AnimateComponent>
    </div>
  );
}

export default function GenerateMetaKey() {
  const { walletChain } = useAuth();

  if (walletChain === 'SUI') {
    return <SuiGenerateMetaKey />;
  } else if (walletChain === 'SOLANA') {
    return <SolanaGenerateMetaKey />;
  }

  // Fallback to Sui if no chain is selected
  return <SuiGenerateMetaKey />;
}
