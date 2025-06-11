/**
 * @fileoverview Sui Stealth Address Processing Module
 * 
 * This module implements the stealth address protocol for the Sui blockchain,
 * allowing users to receive payments to unique addresses that can't be linked
 * to their public address. It uses ED25519 keypairs for all cryptographic operations.
 * 
 * @module processSuiStealthAddress
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey, encodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';
import * as ed from '@noble/ed25519';
import { blake2b } from '@noble/hashes/blake2b';
import { ed25519 } from '@noble/curves/ed25519';
import { randomBytes } from 'crypto';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

/**
 * Constants used in stealth address calculations
 * L is the ED25519 curve order
 */
const L = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
const mod = (x, n) => ((x % n) + n) % n;
const ED25519_FLAG = 0x00;

export const getPrivBytes = (kp) => {
  const { secretKey } = decodeSuiPrivateKey(kp.getSecretKey());
  return new Uint8Array(secretKey.slice(0, 32));
};
export const getPubBytes = (kp) => kp.getPublicKey().toRawBytes();

const utf8 = new TextEncoder();
export const toBytes = (str) => utf8.encode(str);
export const pad32 = (u8) => {
  const out = new Uint8Array(32);
  out.set(u8.slice(0, 32));
  return out;
};

class StealthSigner {
  constructor(sBytes, stealthPubBytes) {
    this.scalarBytes = sBytes; // Uint8Array(32)

    // Use the provided stealth pub bytes directly
    this.publicKeyBytes = stealthPubBytes || this.suiKeypair?.getPublicKey().toRawBytes();

    // Create Sui keypair directly from the 32-byte private key
    this.suiKeypair = Ed25519Keypair.fromSecretKey(this.scalarBytes);
  }

  publicKeyBase58() {
    return bs58.encode(this.publicKeyBytes);
  }

  toSuiAddress() {
    // Create an Ed25519PublicKey from publicKeyBytes to compute the address
    return this.suiKeypair.toSuiAddress()
  }

  getSecretKey() {
    return this.suiKeypair.getSecretKey();
  }

  async signMessage(message) {
    return this.suiKeypair.signPersonalMessage(message);
  }

  async signTransaction(transaction) {
    return this.suiKeypair.signTransaction(transaction);
  }
}

/**
 * Converts various input formats to a 32-byte Uint8Array
 * Supports: Uint8Array, hex string, base58 string, and Buffer
 * @param {Uint8Array|string|{type: string, data: number[]}} raw - Input in various formats
 * @returns {Uint8Array} 32-byte array
 * @throws {Error} If input format is not supported
 */
export const to32u8 = (raw) =>
  raw instanceof Uint8Array
    ? raw
    : /^[0-9a-f]{64}$/i.test(raw)
      ? Buffer.from(raw, 'hex')
      : typeof raw === 'string'
        ? bs58.decode(raw)
        : raw?.type === 'Buffer'
          ? Uint8Array.from(raw.data)
          : (() => {
            throw new Error('Unsupported key format');
          })();

/**
 * Converts bytes to a number using little-endian encoding
 * @param {Uint8Array} u8 - Bytes to convert
 * @returns {bigint} Resulting number
 */
const bytesToNumberLE = (u8) =>
  u8.reduceRight((p, c) => (p << 8n) + BigInt(c), 0n);

/**
 * Converts a BigInt to 32-byte array in little-endian format
 * @param {bigint} bn - Number to convert
 * @returns {Uint8Array} 32-byte array
 */
const bnTo32BytesLE = (bn) => {
  const bytes = new Uint8Array(32);
  let tmp = bn;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  return bytes;
};

/**
 * Clamps a private key according to ED25519 specifications
 * @param {Uint8Array} sk - Private key to clamp
 * @returns {Uint8Array} Clamped private key
 */
const clamp = (sk) => {
  const c = new Uint8Array(sk);
  c[0] &= 248;
  c[31] &= 127;
  c[31] |= 64;
  return c;
};

/**
 * Converts public key bytes to a Sui address
 * @param {Uint8Array} pubBytes - Public key bytes
 * @returns {string} Sui address (0x-prefixed hex)
 */
const toSuiAddressFromPubBytes = (pubBytes) => {
  // Create an Ed25519PublicKey instance from the raw bytes
  const publicKey = new Ed25519PublicKey(pubBytes);

  // Use the official Sui SDK method to get the address
  return publicKey.toSuiAddress();
};

/**
 * Derives a scalar from a 32-byte seed using SHA-512
 * @param {Uint8Array} seed32 - 32-byte seed
 * @returns {bigint} Derived scalar
 */
const scalarFromSeed = (seed32) => {
  const h = sha512(seed32);
  return bytesToNumberLE(clamp(h.slice(0, 32)));
};

/**
 * Encrypts an ephemeral private key using a meta-view public key
 * @param {Uint8Array} ephPriv32 - Ephemeral private key (32 bytes)
 * @param {string} metaViewPub - Meta-view public key (base58)
 * @returns {Promise<string>} Encrypted key in base58 format
 */
export async function encryptEphemeralPrivKey(ephPriv32, metaViewPub) {
  const shared = await ed.getSharedSecret(
    to32u8(ephPriv32),
    to32u8(metaViewPub),
  );
  const keyBytes = sha256(shared); // 32-byte stream key

  // plaintext = ephPriv32 || ephPub
  const ephPub = await ed.getPublicKey(to32u8(ephPriv32));
  const plain = new Uint8Array([...to32u8(ephPriv32), ...ephPub]);

  // XOR encrypt
  const enc = new Uint8Array(plain.length);
  for (let i = 0; i < plain.length; i++) enc[i] = plain[i] ^ keyBytes[i % 32];

  // prepend 24-byte random nonce (layout compatibility)
  const nonce = randomBytes(24);
  return bs58.encode(new Uint8Array([...nonce, ...enc]));
}

/**
 * Decrypts an ephemeral private key using meta-view private key
 * @param {string} encodedPayload - Encrypted key in base58
 * @param {string} metaViewPriv - Meta-view private key (hex)
 * @param {string} ephPub - Ephemeral public key (base58)
 * @returns {Promise<Uint8Array>} Decrypted ephemeral private key
 * @throws {Error} If decryption fails or public key verification fails
 */
export async function decryptEphemeralPrivKey(encodedPayload, metaViewPriv, ephPub) {
  const payload = bs58.decode(encodedPayload);
  const encrypted = payload.slice(24); // first 24 bytes = nonce (ignored)

  const shared = await ed.getSharedSecret(
    to32u8(metaViewPriv),
    to32u8(ephPub),
  );
  const keyBytes = sha256(shared);

  const dec = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) dec[i] = encrypted[i] ^ keyBytes[i % 32];

  const ephPriv32 = dec.slice(0, 32);
  const receivedPub = dec.slice(32);
  const computedPub = await ed.getPublicKey(ephPriv32);
  if (!computedPub.every((b, i) => b === receivedPub[i]))
    throw new Error('Decryption failed – ephPub mismatch');

  return ephPriv32;
}

/**
 * Derives a stealth keypair from meta keys and ephemeral private key
 * @param {string} metaSpendPriv - Meta-spend private key (hex string)
 * @param {string} metaViewPubB58 - Meta-view public key (base58)
 * @param {Uint8Array} ephPriv32 - Ephemeral private key
 * @returns {Promise<Ed25519Keypair>} Stealth keypair for transactions
 */
export async function deriveStealthKeypair(metaSpendPriv, metaViewPubB58, ephPriv32) {
  console.log('🔑 Recovering stealth keypair (uses private keys)');
  
  // Convert hex string to Uint8Array and create keypair
  const metaSpendSeed = to32u8(metaSpendPriv);
  const metaSpendKeypair = Ed25519Keypair.fromSecretKey(encodeSuiPrivateKey(metaSpendSeed, 'ED25519'));
  const metaSpendPubB58 = bs58.encode(metaSpendKeypair.getPublicKey().toRawBytes());
  
  // Calculate the same shared secret and tweak
  const shared = await ed.getSharedSecret(to32u8(ephPriv32), to32u8(metaViewPubB58));
  const tweak = sha256(shared);
  
  // Derive the same stealth seed
  const stealthSeed = sha256(new Uint8Array([
    ...to32u8(metaSpendPubB58),
    ...tweak,
    ...Buffer.from('STEALTH_V1', 'utf8')
  ]));
  
  // Create the same stealth keypair
  const stealthKeypair = Ed25519Keypair.fromSecretKey(encodeSuiPrivateKey(stealthSeed, 'ED25519'));
  const stealthAddress = stealthKeypair.getPublicKey().toSuiAddress();
  
  console.log('   Recovered address:', stealthAddress);
  console.log('   Private key:', encodeSuiPrivateKey(stealthSeed, 'ED25519'));
  
  return stealthKeypair;
}


export async function deriveStealthPub(metaSpendPubB58, metaViewPubB58, ephPriv32) {
  console.log('🎯 Creating stealth address (public keys only)');
  
  // Calculate shared secret and tweak
  const shared = await ed.getSharedSecret(to32u8(ephPriv32), to32u8(metaViewPubB58));
  const tweak = sha256(shared); // Use SHA256 directly for simplicity
  
  // Create stealth seed deterministically
  const stealthSeed = sha256(new Uint8Array([
    ...to32u8(metaSpendPubB58),
    ...tweak,
    ...Buffer.from('STEALTH_V1', 'utf8')
  ]));
  
  // Generate stealth keypair from seed (this is what Sui does internally)
  const stealthKeypair = Ed25519Keypair.fromSecretKey(encodeSuiPrivateKey(stealthSeed, 'ED25519'));
  const stealthAddress = stealthKeypair.getPublicKey().toSuiAddress();
  
  console.log('   Stealth address:', stealthAddress);
  
  return {
    stealthPubKeyB58: bs58.encode(stealthKeypair.getPublicKey().toRawBytes()),
    stealthSuiAddress: stealthAddress
  };
}

// CCTP Utils

export const prepareSuiUsdcEvmPayment = async ({
  metaSpendPub,
  metaViewPub,
  s
}) => {
  const ephemeralKeypair = Ed25519Keypair.generate();
  const ephPriv = getPrivBytes(ephemeralKeypair);
  const ephPub58 = bs58.encode(getPubBytes(ephemeralKeypair))

  // console.log('ephPub58', ephPub58)
  // console.log('ephPriv', ephPriv)

  const encryptedPayload = await encryptEphemeralPrivKey(
    ephPriv,
    metaViewPub
  )

  const stealthAddress = await deriveStealthPub(
    metaSpendPub,
    metaViewPub,
    ephPriv,
    s
  )

  return {
    stealthOwner: stealthAddress.stealthSuiAddress,
    encryptedPayload,
    ephPub: ephPub58
  }
}

