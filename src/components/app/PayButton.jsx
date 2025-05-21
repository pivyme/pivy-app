import React, { useState } from 'react'
import { Button } from '@heroui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token'
import { buildPayTx } from '@/lib/pivy-stealth/pivy-stealth'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2Icon, ExternalLinkIcon, DownloadIcon } from 'lucide-react'
import BounceButton from '@/components/elements/BounceButton'
import axios from 'axios'

export default function PayButton({
  selectedToken,
  amount,
  stealthData,
  onSuccess,
  onError,
  className
}) {
  const [isPaying, setIsPaying] = useState(false)
  const wallet = useWallet()
  const { connection } = useConnection()

  async function handlePay() {
    try {
      setIsPaying(true);

      const payingNative = selectedToken.isNative === true;
      const mint = payingNative
        ? NATIVE_MINT
        : new PublicKey(selectedToken.address);

      /* ATA of payer for chosen mint */
      const payerAta = await getAssociatedTokenAddress(
        mint,
        wallet.publicKey,
        true
      );

      const ixes = [];

      /* create payer ATA if missing */
      if (!(await connection.getAccountInfo(payerAta))) {
        ixes.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, payerAta, wallet.publicKey, mint
          )
        );
      }

      /* extra wrapping steps for native SOL */
      if (payingNative) {
        // If it's a fixed amount payment, use chainAmount, otherwise calculate from amount
        const lamports = stealthData?.linkData?.amountType === 'FIXED'
          ? Number(stealthData.linkData.chainAmount)
          : Number(amount) * LAMPORTS_PER_SOL;

        ixes.push(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: payerAta,
            lamports,
          }),
          createSyncNativeInstruction(payerAta) // converts lamports→WSOL
        );
      }

      let label = '';
      // If tag exists, just use tag
      if (stealthData?.linkData?.tag) {
        label = stealthData.linkData.tag;
      } else {
        label = 'personal';
      }

      console.log('label', label);
      console.log('building stealth-pay IX...');

      /* build stealth-pay IX */
      const { tx: payTx } = await buildPayTx({
        connection,
        payerPubkey: wallet.publicKey,
        metaSpendPub: stealthData.metaSpendPub,
        metaViewPub: stealthData.metaViewPub,
        amount: stealthData?.linkData?.amountType === 'FIXED'
          ? Number(stealthData.linkData.chainAmount)
          : Number(amount) * Math.pow(10, selectedToken.decimals),
        label: label,
        mint,
        payerAta,
        programId: new PublicKey('ECytFKSRMLkWYPp1jnnCEt8AcdnUeaLfKyfr16J3SgUk'),
      });

      /* merge and send */
      const tx = new Transaction()
        .add(...ixes, ...payTx.instructions);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const sig = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,
      });
      // console.log('Signing transaction...');
      // const signedTx = await wallet.signTransaction(tx);
      // const sig = await connection.sendRawTransaction(signedTx.serialize());

      console.log('Confirming transaction...');
      await connection.confirmTransaction({
        signature: sig,
      }, 'confirmed');
      console.log('Payment successful:', sig);
      onSuccess?.(sig);
    } catch (e) {
      console.log('Payment failed:', e);
      onError?.(e);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <BounceButton
      className={`tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full ${className || ''}`}
      radius='full'
      size='lg'
      onPress={handlePay}
      isLoading={isPaying}
      isDisabled={isPaying || !selectedToken || !amount}
    >
      {isPaying ? '✨ Processing...' : (
        stealthData?.linkData?.type === 'DOWNLOAD'
          ? '🎁 Pay & Download'
          : '💰 Pay'
      )}
    </BounceButton>
  )
}
