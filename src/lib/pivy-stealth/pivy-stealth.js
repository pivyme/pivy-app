/*───────────────────────────────────────────────────────────────────*\
  PIVY – client-side helpers  (no private keys leave the browser)
\*───────────────────────────────────────────────────────────────────*/

import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { ed25519 } from '@noble/curves/ed25519';
import BN from 'bn.js';
import bs58 from 'bs58';
import { PIVY_STEALTH_IDL } from './IDL.js';
import { randomBytes } from 'crypto';
import { ethers, hexlify } from 'ethers';

class StealthSigner {
  constructor(sBytes) {
    this.scalarBytes = sBytes; // Uint8Array(32) little-endian scalar s
    this.scalar = bytesToNumberLE(sBytes);
    this.publicKey = new PublicKey(ed25519.ExtendedPoint.BASE.multiply(this.scalar).toRawBytes());
  }

  async signMessage(message) {
    const msg = typeof message === 'string' ? Buffer.from(message) : new Uint8Array(message);

    const prefix = sha512(this.scalarBytes).slice(32); // 32-byte prefix

    const concat = (...arrays) => {
      const total = arrays.reduce((n, a) => n + a.length, 0);
      const out = new Uint8Array(total);
      let off = 0;
      for (const a of arrays) {
        out.set(a, off);
        off += a.length;
      }
      return out;
    };

    const r = mod(bytesToNumberLE(sha512(concat(prefix, msg))), L);
    const Rbytes = ed25519.ExtendedPoint.BASE.multiply(r).toRawBytes();

    const k = mod(bytesToNumberLE(sha512(concat(Rbytes, this.publicKey.toBytes(), msg))), L);
    const S = mod(r + k * this.scalar, L);
    const Sbytes = bnTo32BytesLE(S);

    return new Uint8Array([...Rbytes, ...Sbytes]);
  }

  /* Helper so we can call tx.addSignature(pk, sig) later if needed */
  async signTransaction(tx) {
    const sig = await this.signMessage(tx.serializeMessage());
    tx.addSignature(this.publicKey, sig);
    return tx;
  }

  async partialSignTransaction(tx) {
    const sig = await this.signMessage(tx.serializeMessage());
    tx.addSignature(this.publicKey, sig);
    return tx;
  }
}

/*─────────────────────────────────────────────────────────────*\
 |  Curve helpers (same constants as on-chain program)         |
\*─────────────────────────────────────────────────────────────*/
const L = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
const mod = (x, n) => ((x % n) + n) % n;

/* Convert hex / base58 / Buffer → 32-byte Uint8Array */
const to32u8 = raw =>
  raw instanceof Uint8Array ? raw
    : /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex')
      : typeof raw === 'string' ? bs58.decode(raw)
        : raw.type === 'Buffer' ? Uint8Array.from(raw.data)
          : (() => { throw new Error('unsupported key') })();

function clamp(sk) {
  const clamped = new Uint8Array(sk);
  clamped[0] &= 248;
  clamped[31] &= 127;
  clamped[31] |= 64;
  return clamped;
}

const bytesToNumberLE = (u8) =>
  u8.reduceRight((p, c) => (p << 8n) + BigInt(c), 0n);

function bnTo32BytesLE(bn) {
  const bytes = new Uint8Array(32);
  let temp = bn;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(temp & 0xffn);
    temp >>= 8n;
  }
  return bytes;
}

function scalarFromSeed(seed32) {
  // Ed25519 secret scalar derivation (RFC 8032 §5.1.5)
  const h = sha512(seed32);
  return bytesToNumberLE(clamp(h.slice(0, 32)));
}

export function solanaAddressToHex(solanaAddress) {
  return hexlify(bs58.decode(solanaAddress));
}


export async function deriveStealthPub(metaSpend58, metaView58, ephPriv32) {
  // 1. tweak = H(e ⨁ B) mod L
  const shared = await ed.getSharedSecret(
    ephPriv32,
    new PublicKey(metaView58).toBytes(),
  );
  const tweak = mod(BigInt('0x' + Buffer.from(sha256(shared)).toString('hex')), L);

  // 2. S = A + tweak·G
  const Abytes = new PublicKey(metaSpend58).toBytes();
  let Sbytes;
  if (ed.utils.pointAddScalar) {
    Sbytes = ed.utils.pointAddScalar(Abytes, tweak);
  } else {
    const A = ed25519.ExtendedPoint.fromHex(Abytes);
    const S = A.add(ed25519.ExtendedPoint.BASE.multiply(tweak));
    Sbytes = S.toRawBytes();
  }
  return new PublicKey(Sbytes);
}

// Generate an encoded payload containing the ephemeral private key
export function createEphemeralPayload(ephPriv32) {
  // Simple approach - just encode the ephemeral private key directly
  // In a real implementation, you'd want to encrypt this with the recipient's meta view key
  return bs58.encode(ephPriv32);
}

// Securely encrypt the ephemeral private key with the meta view public key
// Only someone with the corresponding meta view private key can decrypt it
export async function encryptEphemeralPrivKey(ephPriv32, metaViewPub58) {
  // 1. shared secret between (ephPriv, metaViewPub)
  const shared = await ed.getSharedSecret(
    ephPriv32,
    new PublicKey(metaViewPub58).toBytes(),
  );
  const keyBytes = sha256(shared); // 32-byte stream key

  // 2. plaintext = ephPriv32 || ephPub
  const ephPub = await ed.getPublicKey(ephPriv32);
  const plain = new Uint8Array([...ephPriv32, ...ephPub]);

  // 3. XOR-encrypt
  const enc = new Uint8Array(plain.length);
  for (let i = 0; i < plain.length; i++) enc[i] = plain[i] ^ keyBytes[i % keyBytes.length];

  // 4. prepend 24-byte random nonce (compat with old layout)
  const nonce = randomBytes(24);
  const payload = new Uint8Array([...nonce, ...enc]);

  return bs58.encode(payload);
}

// Function to decrypt the ephemeral private key
// Requires the meta view private key and ephemeral public key
export async function decryptEphemeralPrivKey(encodedPayload, metaViewPriv, ephPub) {
  // 1. Decode the payload
  const payload = bs58.decode(encodedPayload);

  // 2. Extract nonce and encrypted data
  const nonce = payload.slice(0, 24);
  const encrypted = payload.slice(24);

  // 3. Generate the shared secret using meta view private key and ephemeral public key
  const shared = await ed.getSharedSecret(
    to32u8(metaViewPriv),
    to32u8(ephPub)
  );

  // 4. Derive the same key used for encryption
  const keyBytes = sha256(shared);

  // 5. Decrypt the data
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }

  // 6. Verify and return the ephemeral private key
  const ephPriv32 = decrypted.slice(0, 32);
  const receivedEphPub = decrypted.slice(32);
  const computedPub = await ed.getPublicKey(ephPriv32);

  // 7. Verify the decrypted ephemeral private key matches the expected public key
  let match = true;
  for (let i = 0; i < computedPub.length; i++) {
    if (computedPub[i] !== receivedEphPub[i]) {
      match = false;
      break;
    }
  }

  if (!match) {
    throw new Error("Decryption failed: public key mismatch");
  }

  return ephPriv32;
}

/*─────────────────────────────────────────────────────────────*\
 |  1. Derive *public* stealth owner from public meta keys     |
 |     (for payer-side use)                                    |
\*─────────────────────────────────────────────────────────────*/
export async function deriveStealthPubFromPriv(metaSpend, metaView, ephPub58) {
  const mSpend = to32u8(metaSpend);                    // 32-byte secret a
  const mView = to32u8(metaView);                     // 32-byte secret b
  const ephPub = new PublicKey(ephPub58).toBytes();    // 32-byte point E

  // 1) shared = b × E   (X25519 on ed25519 curve)
  const shared = await ed.getSharedSecret(mView, ephPub);

  // 2) tweak = H(shared) mod ℓ
  const tweak = mod(
    BigInt('0x' + Buffer.from(sha256(shared)).toString('hex')), L);

  // 3) S = A + tweak · G
  const Abytes = await ed.getPublicKey(mSpend);        // A = a·G

  let Sbytes;
  if (ed.utils.pointAddScalar) {
    // noble ≥ 1.8 path
    Sbytes = ed.utils.pointAddScalar(Abytes, tweak);
  } else {
    // universal fallback via @noble/curves
    const A = ed25519.ExtendedPoint.fromHex(Abytes);
    const S = A.add(ed25519.ExtendedPoint.BASE.multiply(tweak));
    Sbytes = S.toRawBytes();
  }

  return new PublicKey(Sbytes).toBase58();             // stealth owner pubkey
}

export async function deriveStealthKeypair(metaSpendPrivHex, metaViewPub58, ephPriv32) {
  // 1. expected pubkey via point addition ——
  const metaSpendPub58 = bs58.encode(
    await ed.getPublicKey(Buffer.from(metaSpendPrivHex, 'hex')),
  );
  const stealthPub = await deriveStealthPub(metaSpendPub58, metaViewPub58, ephPriv32);

  // 2. tweak & stealth scalar ——
  const shared = await ed.getSharedSecret(
    ephPriv32,
    new PublicKey(metaViewPub58).toBytes(),
  );
  const tweak = mod(BigInt('0x' + Buffer.from(sha256(shared)).toString('hex')), L);

  const a = scalarFromSeed(Buffer.from(metaSpendPrivHex, 'hex'));
  const s = mod(a + tweak, L);

  const sBytes = bnTo32BytesLE(s);
  // Derive public key directly from scalar (avoid hashing/clamp again)
  const Sbytes = ed25519.ExtendedPoint.BASE.multiply(s).toRawBytes();

  // 4. sanity check
  const ok = stealthPub.equals(new PublicKey(Sbytes));
  if (!ok) throw new Error('Math mismatch: derived pub ≠ point-add pub');

  return new StealthSigner(sBytes);
}

/*─────────────────────────────────────────────────────────────*\
 |  3. buildPayTx – unsigned 'pay' transaction                 |
\*─────────────────────────────────────────────────────────────*/
export async function buildPayTx({
  connection,
  payerPubkey,
  metaSpendPub, metaViewPub,
  amount,                     // in smallest units (e.g. μ-USDC)
  label,                      // ≤32 UTF-8
  mint, payerAta,
  programId,
}) {
  /* a) derive stealth address */
  const eph = Keypair.generate();
  const ephPriv32 = eph.secretKey.slice(0, 32);
  const stealthOwner = await deriveStealthPub(
    metaSpendPub, metaViewPub, ephPriv32);
  const stealthAta = getAssociatedTokenAddressSync(mint, stealthOwner);

  /* Create encrypted payload with ephemeral private key that can only be decrypted by metaViewPriv holder */
  const encryptedPayload = await encryptEphemeralPrivKey(ephPriv32, metaViewPub);

  /* b) dummy wallet so anchor can build instructions offline */
  const dummyWallet = {
    publicKey: payerPubkey, signTransaction: async t => t,
    signAllTransactions: async ts => ts
  };

  const provider = new anchor.AnchorProvider(
    connection, dummyWallet, anchor.AnchorProvider.defaultOptions());
  const program = new anchor.Program(PIVY_STEALTH_IDL, programId, provider);

  const buf = Buffer.alloc(32); buf.write(label.slice(0, 32));
  const ix = await program.methods
    .pay({ amount: new BN(amount), label: [...buf], ephPubkey: eph.publicKey })
    .accounts({
      stealthOwner, stealthAta,
      payer: payerPubkey, payerAta, mint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  // Create memo instruction with encrypted payload
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: new TextEncoder().encode(encryptedPayload),
  });

  const tx = new Transaction().add(ix, memoIx);
  tx.feePayer = payerPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return { tx, stealthOwner, eph };
}

/*─────────────────────────────────────────────────────────────*\
 |  4. planWithdraw – choose ATAs to fulfil requested amount   |
\*─────────────────────────────────────────────────────────────*/
export function planWithdraw(balances /*[{address,amount}]*/, want) {
  const picks = [];
  let still = want;
  for (const b of balances.sort((x, y) => y.amount - x.amount)) {
    if (still <= 0) break;
    const take = Math.min(b.amount, still);
    picks.push({ address: b.address, take });
    still -= take;
  }
  if (still > 0) throw new Error('insufficient balance');
  return picks;
}

/*─────────────────────────────────────────────────────────────*\
 |  5. buildBatchWithdrawTx  (one tx, many withdraw IXs)       |
\*─────────────────────────────────────────────────────────────*/
/**
 * @param {object} cfg
 * @param {Connection}   cfg.connection
 * @param {anchor.Program} cfg.program (PIVY loaded)
 * @param {string}       cfg.metaSpendPrivHex
 * @param {string}       cfg.metaViewPrivHex
 * @param {Array}        cfg.events   // [{ stealthAta, ephPubkey, balance }]
 * @param {number}       cfg.want     // UI units
 * @param {PublicKey}    cfg.destOwner
 * @param {PublicKey}    cfg.mint
 * @param {number}       cfg.decimals
 */
export async function buildBatchWithdrawTx(cfg) {
  const { connection, program, metaSpendPrivHex, metaViewPrivHex,
    events, want, destOwner, mint, decimals } = cfg;

  /* a) decide sources */
  const balances = events.map(e => ({ address: e.stealthAta, amount: e.balance }));
  const picks = planWithdraw(balances, want);

  /* b) ensure destination ATA */
  const destAta = getAssociatedTokenAddressSync(mint, destOwner);
  const ixs = [];
  if (!(await connection.getAccountInfo(destAta))) {
    ixs.push(createAssociatedTokenAccountInstruction(
      destOwner, destAta, destOwner, mint));
  }

  /* c) one withdraw IX per pick */
  for (const p of picks) {
    const ev = events.find(e => e.stealthAta === p.address);
    const sKey = await deriveStealthKeypairFromPriv(
      metaSpendPrivHex, metaViewPrivHex, ev.ephemeralPubkey);

    ixs.push(
      await program.methods.withdraw({
        amount: new BN(p.take * 10 ** decimals)
      })
        .accounts({
          stealthOwner: sKey.publicKey,
          stealthAta: new PublicKey(p.address),
          destinationAta: destAta,
          mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([sKey])
        .instruction()
    );
  }

  /* d) assemble tx */
  const tx = new Transaction().add(...ixs);
  tx.feePayer = destOwner;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return { tx, destAta };
}

/*─────────────────────────────────────────────────────────────*\
 |  6. utility: quick Program loader (Node or Browser)         |
\*─────────────────────────────────────────────────────────────*/
export function loadPivyProgram(connection, wallet, programId) {
  const provider = new anchor.AnchorProvider(
    connection, wallet, anchor.AnchorProvider.defaultOptions());
  return new anchor.Program(PIVY_STEALTH_IDL, programId, provider);
}

export const prepareUsdcEvmPayment = async ({
  metaSpendPub,
  metaViewPub,
  mint
}) => {
  const eph = Keypair.generate()
  const ephPriv32 = eph.secretKey.slice(0, 32);
  const stealthOwner = await deriveStealthPub(
    metaSpendPub,
    metaViewPub,
    ephPriv32
  )

  const stealthAta = getAssociatedTokenAddressSync(
    mint,
    stealthOwner
  )

  const encryptedPayload = await encryptEphemeralPrivKey(
    ephPriv32,
    metaViewPub
  )

  return {
    stealthOwner,
    stealthAta,
    encryptedPayload
  }
}

// For evm usdc stuff, CCTP
async function depositForBurn(amount, destDomain, recipientBytes32) {
  const TM_ABI = ['function depositForBurn(uint256,uint32,bytes32,address)'];
  const messenger = new ethers.Contract(BASE_TOKEN_MESSENGER, TM_ABI, evmWallet);
  const tx = await messenger.depositForBurn(amount, destDomain, recipientBytes32, USDC_BASE_ADDRESS);
  await tx.wait();
  console.log('✓ depositForBurn tx:', tx.hash);
  return tx.hash;
}
