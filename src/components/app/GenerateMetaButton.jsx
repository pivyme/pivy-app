import { Button } from '@heroui/react'
import React from 'react'
import { sha512 } from '@noble/hashes/sha512';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import bs58 from 'bs58';
import { useWallet } from '@suiet/wallet-kit';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Buffer } from 'buffer';
import { SuiClient } from '@mysten/sui/client';
import { CHAINS, isTestnet } from '@/config';
import { useAuth } from '@/providers/AuthProvider';

const DOMAIN = 'PIVY | Deterministic Meta Keys | Sui Network';
const SPEND_CONTEXT = 'PIVY Spend Authority | Deterministic Derivation';
const VIEW_CONTEXT = 'PIVY View Authority | Deterministic Derivation';

// Helper functions for key extraction
const getPrivBytes = (kp) => {
  const { secretKey } = decodeSuiPrivateKey(kp.getSecretKey());
  return new Uint8Array(secretKey.slice(0, 32));
};

const getPubBytes = (kp) => kp.getPublicKey().toRawBytes();

export default function GenerateMetaButton() {
  const suiWallet = useWallet();

  async function deriveMetaKeys() {
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

    const metaData = {
      metaSpendPriv: Buffer.from(spendPriv).toString("hex"),
      metaViewPriv: Buffer.from(viewPriv).toString("hex"),
      metaSpendPub: spendPubB58,
      metaViewPub: viewPubB58,
    }
    console.log(metaData);

    return {
      metaSpendPriv: Buffer.from(spendPriv).toString("hex"),
      metaViewPriv: Buffer.from(viewPriv).toString("hex"),
      metaSpendPub: spendPubB58,     // send to backend
      metaViewPub: viewPubB58,
    };
  }

  async function scanForMyTx() {
    console.log("scanning for my tx");
    // Get lists of announce tx from backend (last 100)
    // Checks is it my tx
    // If it is, call the backend to tell that it is my tx
  }

  async function addressConversionTest() {

    const chain = isTestnet ? CHAINS.SUI_TESTNET : CHAINS.SUI_MAINNET
    const stealthProgramId = "0x777f3d6d3964d4d60fb82018b8ba012dc0f7c78fe1dc72d166ea250a94260449"

    // Create SUI client
    const suiClient = new SuiClient({ url: chain.rpcUrl });

    const randomAddress = "0x57c07403ce09c2217cca53553bdc9c0c9f47b013c9e4b9d33107c65cdd84bec6";
    const bytes = await suiClient.devInspectTransactionBlock({
      
    })
  }

  return (
    <div className='flex flex-row items-center gap-4'>
      <Button
        color='primary'
        className='font-semibold'
        size='lg'
        onPress={deriveMetaKeys}
      >
        Generate Meta Spend and View Key
      </Button>

      <Button
        color='primary'
        className='font-semibold'
        size='lg'
        onPress={deriveMetaKeys}
      >
        Address Conversion Test
      </Button>
    </div>
  )
}
