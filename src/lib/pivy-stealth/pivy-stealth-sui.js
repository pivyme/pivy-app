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

export const getPrivBytes = (kp) => {
  const { secretKey } = decodeSuiPrivateKey(kp.getSecretKey());
  return new Uint8Array(secretKey.slice(0, 32));
};
export const getPubBytes = (kp) => kp.getPublicKey().toRawBytes();

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
  const flaggedPubKey = new Uint8Array(1 + pubBytes.length);
  flaggedPubKey[0] = ED25519_FLAG;
  flaggedPubKey.set(pubBytes, 1);
  const addressBytes = blake2b(flaggedPubKey, { dkLen: 32 });
  return '0x' + Buffer.from(addressBytes).toString('hex');
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
async function encryptEphemeralPrivKey(ephPriv32, metaViewPub) {
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
 * @returns {Promise<string>} Stealth public key in base58
 */
export async function deriveStealthPub(metaSpendPub, metaViewPub, ephPriv32) {
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
  return bs58.encode(Sbytes);
}

/**
 * Derives a stealth keypair from meta keys and ephemeral private key
 * @param {string} metaSpendPrivHex - Meta-spend private key (hex)
 * @param {string} metaViewPub - Meta-view public key (base58)
 * @param {Uint8Array} ephPriv32 - Ephemeral private key
 * @returns {Promise<StealthSigner>} Stealth signer for transactions
 * @throws {Error} If derived public key doesn't match point addition
 */
async function deriveStealthKeypair(metaSpendPrivHex, metaViewPub, ephPriv32) {
  const metaSpendPrivBytes = to32u8(metaSpendPrivHex);

  // expected pub via point addition (for sanity check later)
  const metaSpendPubBytes = await ed.getPublicKey(metaSpendPrivBytes);
  const metaSpendPubB58 = bs58.encode(metaSpendPubBytes);
  const stealthPubB58 = await deriveStealthPub(metaSpendPubB58, metaViewPub, ephPriv32);

  // tweak & stealth scalar
  const shared = await ed.getSharedSecret(
    to32u8(ephPriv32),
    to32u8(metaViewPub),
  );
  const tweak = mod(BigInt('0x' + Buffer.from(sha256(shared)).toString('hex')), L);

  const a = scalarFromSeed(metaSpendPrivBytes);
  const s = mod(a + tweak, L);
  const sBytes = bnTo32BytesLE(s);

  // confirm math
  const Sbytes = ed25519.ExtendedPoint.BASE.multiply(s).toRawBytes();
  if (bs58.encode(Sbytes) !== stealthPubB58)
    throw new Error('Math mismatch: derived pub ≠ point-add pub');

  return new StealthSigner(sBytes);
}

/**
 * Custom signer class for handling stealth transactions
 */
class StealthSigner {
  /**
   * Creates a new stealth signer from scalar bytes
   * @param {Uint8Array} sBytes - Scalar bytes for private key
   */
  constructor(sBytes) {
    this.scalarBytes = sBytes;
    this.suiKeypair = Ed25519Keypair.fromSecretKey(this.scalarBytes);
    this.publicKeyBytes = this.suiKeypair.getPublicKey().toRawBytes();
  }

  /**
   * Gets the public key in base58 format
   * @returns {string} Base58 encoded public key
   */
  publicKeyBase58() {
    return bs58.encode(this.publicKeyBytes);
  }

  /**
   * Gets the Sui address for this stealth keypair
   * @returns {string} Sui address (0x-prefixed hex)
   */
  toSuiAddress() {
    return this.suiKeypair.toSuiAddress();
  }

  /**
   * Gets the secret key bytes
   * @returns {Uint8Array} Secret key bytes
   */
  getSecretKey() {
    return this.suiKeypair.getSecretKey();
  }

  /**
   * Signs a message using the stealth keypair
   * @param {Uint8Array} message - Message to sign
   * @returns {Promise<Uint8Array>} Signature
   */
  async signMessage(message) {
    return this.suiKeypair.signPersonalMessage(message);
  }

  /**
   * Signs a transaction using the stealth keypair
   * @param {Uint8Array} transaction - Transaction to sign
   * @returns {Promise<Uint8Array>} Signature
   */
  async signTransaction(transaction) {
    return this.suiKeypair.signTransaction(transaction);
  }
}
