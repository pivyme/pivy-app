/*───────────────────────────────────────────────────────────────────*\
  PIVY – client-side helpers (no private keys leave the server)
  Works with: @solana/web3.js 1.92+, @noble/ed25519 1.8+
\*───────────────────────────────────────────────────────────────────*/
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
import { ed25519 }      from '@noble/curves/ed25519';
import BN from 'bn.js';
import { PIVY_STEALTH_IDL } from './IDL';

/* ---------- same curve constants as in your test ---------- */
const L = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
const mod = (x, n) => ((x % n) + n) % n;

/*─────────────────────────────────────────────────────────────*\
  deriveStealthPub(metaSpendPub58, metaViewPub58, ephPriv32)
     = A + H(e ⨁ B) · G     (RFC-5564 style, public-only)
\*─────────────────────────────────────────────────────────────*/
export async function deriveStealthPub(metaSpend58, metaView58, ephPriv32) {
  /* 1. e ⨁ B  → shared */
  const shared = await ed.getSharedSecret(
    ephPriv32,
    new PublicKey(metaView58).toBytes()
  );

  /* 2. tweak = H(shared) mod L */
  const tweak = mod(
    BigInt('0x' + Buffer.from(sha256(shared)).toString('hex')), L);

  /* 3. S = A + tweak·G */
  const Abytes = new PublicKey(metaSpend58).toBytes();

  let Sbytes;
  if (ed.utils.pointAddScalar) {
    // ↳ noble ≥ 1.8 path
    Sbytes = ed.utils.pointAddScalar(Abytes, tweak);
  } else {
    // ↳ universal fallback via @noble/curves
    const A = ed25519.ExtendedPoint.fromHex(Abytes);
    const S = A.add(ed25519.ExtendedPoint.BASE.multiply(tweak));
    Sbytes = S.toRawBytes();                  // Uint8Array(32)
  }

  return new PublicKey(Sbytes);                // stealth owner pubkey
}

/*─────────────────────────────────────────────────────────────*\
  buildPayTx(...)  →  { tx, stealthOwner }
  Returns an unsigned Transaction that calls the on-chain `pay`
  instruction and transfers `amount` (μ-tokens) from payer’s ATA
  into the freshly derived stealth ATA.
\*─────────────────────────────────────────────────────────────*/
export async function buildPayTx({
  connection,
  payerPubkey,
  metaSpendPub,
  metaViewPub,
  amount,
  label,
  mint,
  payerAta,
  programId,
}) {
  const eph = Keypair.generate();
  const stealthOwner = await deriveStealthPub(
    metaSpendPub, metaViewPub, eph.secretKey.slice(0, 32));
  const stealthAta = getAssociatedTokenAddressSync(mint, stealthOwner);

  // ---- PATCH: minimal wallet stub --------------------------------
  const dummyWallet = {
    publicKey: payerPubkey,
    signTransaction:    async (tx)  => tx,
    signAllTransactions:async (txs) => txs,
  };
  const provider = new anchor.AnchorProvider(
    connection,
    dummyWallet,
    anchor.AnchorProvider.defaultOptions(),
  );
  // ----------------------------------------------------------------

  const program = new anchor.Program(
    PIVY_STEALTH_IDL, programId, provider);

  const buf = Buffer.alloc(32); buf.write(label.slice(0, 32));
  const ix = await program.methods
    .pay({ amount: new BN(amount), label: [...buf], ephPubkey: eph.publicKey })
    .accounts({
      stealthOwner,
      stealthAta,
      payer      : payerPubkey,
      payerAta,
      mint,
      systemProgram         : SystemProgram.programId,
      tokenProgram          : TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent                  : anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer        = payerPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return { tx, stealthOwner };
}