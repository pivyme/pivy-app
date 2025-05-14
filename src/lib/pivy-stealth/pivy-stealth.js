import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import BN from 'bn.js';
import { PIVY_STEALTH_IDL } from './IDL';

const L = BigInt(
  '0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed'
);
const mod = (x, n) => ((x % n) + n) % n;
const bytesToNumberLE = (u8) =>
  u8.reduceRight((p, c) => (p << 8n) + BigInt(c), 0n);

/** RFC-5564-style stealth key derivation (identical to test script) */
export async function deriveStealthKeypair(
  metaSpend,          // 32-B private scalar of spend key
  metaViewPub,        // 32-B public key of view key
  ephPriv             // 32-B ephemeral private scalar
) {
  const shared  = await ed.getSharedSecret(ephPriv, metaViewPub);
  const tweak   = mod(BigInt('0x' + Buffer.from(sha256(shared)).toString('hex')), L);
  const aScalar = BigInt('0x' + Buffer.from(metaSpend).toString('hex'));
  const sScalar = mod(aScalar + tweak, L);

  const seed = Uint8Array.from(
    sScalar.toString(16).padStart(64, '0').match(/.{2}/g).map(x => parseInt(x, 16))
  );
  const pk = await ed.getPublicKey(seed);
  const sk = new Uint8Array(64); sk.set(seed, 0); sk.set(pk, 32);
  return Keypair.fromSecretKey(sk);
}

export const convertBytesToString = (bytes) => {
  return Buffer.from(bytes).toString('hex');
}