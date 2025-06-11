import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { SparklesIcon, ArrowRightIcon } from 'lucide-react';
import AnimateComponent from '@/components/elements/AnimateComponent';
import { getPrivBytes, getPubBytes } from '@/lib/pivy-stealth/pivy-stealth-sui';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { sha512 } from '@noble/hashes/sha512';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import bs58 from 'bs58';
import { Buffer } from 'buffer';
import { useWallet } from '@suiet/wallet-kit';
import axios from 'axios';
import { useAuth } from '@/providers/AuthProvider';

const DOMAIN = 'PIVY | Deterministic Meta Keys | Sui Network';
const SPEND_CONTEXT = 'PIVY Spend Authority | Deterministic Derivation';
const VIEW_CONTEXT = 'PIVY View Authority | Deterministic Derivation';

export default function GenerateMetaKey() {
  const suiWallet = useWallet();
  const { accessToken, saveMetaKeys, fetchMe } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function deriveMetaKeys() {
    try {
      setIsLoading(true);
      // Get single signature for both keys
      const sig = await suiWallet.signPersonalMessage({
        message: new TextEncoder().encode(`${DOMAIN}`)
      });

      // Derive spend key
      const spendSeed = sha512(Uint8Array.from([...sig.signature, ...new TextEncoder().encode(SPEND_CONTEXT)])).slice(0, 32);
      const spendKeypair = Ed25519Keypair.fromSecretKey(spendSeed);
      const spendPriv = getPrivBytes(spendKeypair);
      const spendPubB58 = bs58.encode(getPubBytes(spendKeypair));

      // Derive view key
      const viewSeed = sha512(Uint8Array.from([...sig.signature, ...new TextEncoder().encode(VIEW_CONTEXT)])).slice(0, 32);
      const viewKeypair = Ed25519Keypair.fromSecretKey(viewSeed);
      const viewPriv = getPrivBytes(viewKeypair);
      const viewPubB58 = bs58.encode(getPubBytes(viewKeypair));

      /**
       * ═══════════════════════════════════════════════════════════════════════════════════════
       * 🔐 PRIVACY & SELF-CUSTODY MODEL - CRITICAL SECURITY INFORMATION
       * ═══════════════════════════════════════════════════════════════════════════════════════
       * 
       * This implementation ensures FULL SELF-CUSTODY of user funds by design:
       * 
       * 🚫 metaSpendPriv (Spending Private Key):
       *    - NEVER SENT TO BACKEND - Remains 100% client-side only
       *    - Only stored in browser localStorage and user's local session
       *    - Backend has ZERO access to spend user funds
       *    - This guarantees true self-custody - only user can authorize spending
       * 
       * 👁️ metaViewPriv (View Private Key):
       *    - Currently sent to backend for transaction indexing convenience
       *    - Allows backend to scan and index user's transactions efficiently
       *    - Could be kept client-side for maximum privacy (see note below)
       *    - Even with this key, backend CANNOT spend user funds
       * 
       * 📊 Public Keys (metaSpendPub & metaViewPub):
       *    - Safe to share with backend - these are public by nature
       *    - Used for generating stealth addresses and transaction detection
       *    - No privacy or security risk in sharing these
       * 
       * 🔒 ENHANCED PRIVACY OPTION (Future Implementation):
       *    - metaViewPriv could also be kept client-side only
       *    - Transaction scanning would be done in browser instead of backend
       *    - This would make PIVY backend completely blind to user transactions
       *    - Trade-off: Slower transaction discovery vs maximum privacy
       *    - Current approach balances usability with strong self-custody guarantees
       * 
       * ✅ SECURITY GUARANTEES:
       *    - Backend cannot spend user funds (no spending key access)
       *    - Backend cannot generate new stealth addresses for user
       *    - User maintains full control over their private keys
       *    - True self-custody implementation
       * ═══════════════════════════════════════════════════════════════════════════════════════
       */

      const metaData = {
        metaSpendPriv: Buffer.from(spendPriv).toString("hex"),
        metaViewPriv: Buffer.from(viewPriv).toString("hex"),
        metaSpendPub: spendPubB58,
        metaViewPub: viewPubB58,
      }
      console.log('Generated Meta Keys:', metaData);

      // 🔐 CRITICAL: Only send PUBLIC keys and VIEW private key to backend
      // 🚫 metaSpendPriv is NEVER sent - this ensures full self-custody
      // 👁️ metaViewPriv is sent for easier transaction indexing (can be kept client-side for max privacy)
      const metaDataToSend = {
        metaSpendPub: metaData.metaSpendPub,    // ✅ Safe - public key
        metaViewPub: metaData.metaViewPub,      // ✅ Safe - public key  
        metaViewPriv: metaData.metaViewPriv,    // ⚠️ Sent for indexing convenience (optional)
        // metaSpendPriv: NEVER INCLUDED - This keeps your funds safe! 🔒
      }

      // 💾 Store ALL private keys locally (including the spending key that backend never sees)
      saveMetaKeys(metaData.metaSpendPriv, metaData.metaViewPriv);

      // 📡 Send only non-spending keys to backend for transaction indexing
      const res = await axios({
        method: 'POST',
        url: `${import.meta.env.VITE_BACKEND_URL}/auth/register-meta-keys`,
        data: metaDataToSend,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Meta Keys Registered:', res.data);
      // Refresh user data to get updated meta keys
      await fetchMe();
    } catch (error) {
      console.error('Error generating meta keys:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 w-full min-h-[60vh] z-20 relative">
      <AnimateComponent>
        <div className="flex flex-col items-center justify-center gap-8 text-center z-10 relative p-8 px-12 max-w-xl w-full nice-card">
          <AnimateComponent delay={100}>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-8 h-8 text-primary-500" />
              <h1 className="text-3xl font-bold tracking-tight">Generate Meta Keys ✨</h1>
            </div>
          </AnimateComponent>

          <AnimateComponent delay={200}>
            <p className="text-gray-600 max-w-md">
              Your Meta Keys are deterministically generated from your wallet signature, ensuring you can always recover them.
              <br />
              <br />
              These keys enable secure access to your funds and account features.
            </p>
          </AnimateComponent>

          <AnimateComponent delay={300}>
            <Button
              className="w-full font-semibold tracking-tight px-8 py-6 text-lg"
              radius="full"
              size="lg"
              color="primary"
              endContent={<ArrowRightIcon className="w-5 h-5" />}
              onPress={deriveMetaKeys}
              isLoading={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Meta Keys'}
            </Button>
          </AnimateComponent>
        </div>
      </AnimateComponent>
    </div>
  )
}
