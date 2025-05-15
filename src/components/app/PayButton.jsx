import React, { useState } from 'react'
import { Button } from '@heroui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token'
import { buildPayTx } from '@/lib/pivy-stealth/pivy-stealth'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2Icon, ExternalLinkIcon, DownloadIcon } from 'lucide-react'

export default function PayButton({ 
  selectedToken,
  amount,
  stealthData,
  onSuccess,
  onError,
  className
}) {
  const [isPaying, setIsPaying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [transactionSignature, setTransactionSignature] = useState(null)
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
        const lamports = Number(amount) * LAMPORTS_PER_SOL;
        ixes.push(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: payerAta,
            lamports,
          }),
          createSyncNativeInstruction(payerAta) // converts lamports→WSOL
        );
      }

      /* build stealth-pay IX */
      const { tx: payTx } = await buildPayTx({
        connection,
        payerPubkey: wallet.publicKey,
        metaSpendPub: stealthData.metaSpendPub,
        metaViewPub: stealthData.metaViewPub,
        amount: payingNative
          ? Number(amount) * LAMPORTS_PER_SOL
          : Number(amount) * 1_000_000,
        label: 'personal',
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
      await connection.confirmTransaction(sig, 'confirmed');
      console.log('Payment successful:', sig);
      setTransactionSignature(sig);
      setIsSuccess(true);
      onSuccess?.(sig);
    } catch (e) {
      console.error('Payment failed:', e);
      onError?.(e);
    } finally {
      setIsPaying(false);
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2Icon className="w-10 h-10 text-green-500" />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Successful! 🎉</h3>
          <p className="text-sm text-gray-600">Your transaction has been confirmed</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-2 w-full"
        >
          <a
            href={`https://solscan.io/tx/${transactionSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 font-medium"
          >
            View on Solscan
            <ExternalLinkIcon className="w-4 h-4" />
          </a>

          {stealthData?.linkData?.type === 'DOWNLOAD' && stealthData?.linkData?.file && (
            <Button
              className="tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full"
              radius="full"
              size="lg"
              onPress={() => {
                // Handle download here
                console.log('Downloading file:', stealthData.linkData.file)
              }}
              startContent={<DownloadIcon className="w-5 h-5" />}
            >
              Download File
            </Button>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <Button
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
    </Button>
  )
}
