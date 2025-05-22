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
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';
import * as ed from '@noble/ed25519';
import { blake2b } from '@noble/hashes/blake2b';
import { ed25519 } from '@noble/curves/ed25519';
import { randomBytes } from 'crypto';
import bs58 from 'bs58';

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
async function decryptEphemeralPrivKey(encodedPayload, metaViewPriv, ephPub) {
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
 * Derives a stealth public key from meta keys and ephemeral private key
 * @param {string} metaSpendPub - Meta-spend public key (base58)
 * @param {string} metaViewPub - Meta-view public key (base58)
 * @param {Uint8Array} ephPriv32 - Ephemeral private key
 * @param {string} [metaSpendPrivHex] - Optional meta-spend private key (hex) to compute address
 * @returns {Promise<{stealthPubKeyB58: string, stealthSuiAddress: string|null}>} Stealth public key in base58 and optional address
 */
export async function deriveStealthPub(metaSpendPub, metaViewPub, ephPriv32, metaSpendPrivHex) {
  // tweak = H(e ⨁ B)  mod L
  const shared = await ed.getSharedSecret(
    to32u8(ephPriv32),
    to32u8(metaViewPub),
  );
  const tweak = mod(BigInt('0x' + Buffer.from(sha256(shared)).toString('hex')), L);

  // S = A + tweak·G (point addition)
  const Abytes = to32u8(metaSpendPub);
  let Sbytes;
  if (ed.utils.pointAddScalar) {
    Sbytes = ed.utils.pointAddScalar(Abytes, tweak);
  } else {
    const A = ed25519.ExtendedPoint.fromHex(Abytes);
    const S = A.add(ed25519.ExtendedPoint.BASE.multiply(tweak));
    Sbytes = S.toRawBytes();
  }

  // If metaSpendPrivHex is provided, also compute the expected address
  let stealthSuiAddress = null;
  if (metaSpendPrivHex) {
    // Calculate the same scalar that StealthSigner will use
    const metaSpendPrivBytes = to32u8(metaSpendPrivHex);
    const a = scalarFromSeed(metaSpendPrivBytes);
    const s = mod(a + tweak, L);
    const stealthPrivBytes = bnTo32BytesLE(s);

    // Create a keypair using the same method as StealthSigner
    const tempKeypair = Ed25519Keypair.fromSecretKey(stealthPrivBytes);
    stealthSuiAddress = tempKeypair.toSuiAddress();
  }

  // Return both the stealth pubkey and address (if available)
  return {
    stealthPubKeyB58: bs58.encode(Sbytes),
    stealthSuiAddress
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