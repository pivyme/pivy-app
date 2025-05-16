import { useDashboard } from '@/contexts/DashboardContext'
import { ArrowUpRightIcon, SparklesIcon } from 'lucide-react'
import React, { useState } from 'react'
import ColorCard from '../elements/ColorCard'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@heroui/react'
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { decryptEphemeralPrivKey, loadPivyProgram, deriveStealthKeypair } from '@/lib/pivy-stealth/pivy-stealth'
import * as ed from '@noble/ed25519'
import bs58 from 'bs58'
import BN from 'bn.js';
import { CHAINS } from '@/config'

const validateAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

// Convert hex / base58 / Buffer → 32-byte Uint8Array
const to32u8 = raw =>
  raw instanceof Uint8Array ? raw
    : /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex')
      : typeof raw === 'string' ? bs58.decode(raw)
        : raw.type === 'Buffer' ? Uint8Array.from(raw.data)
          : (() => { throw new Error('unsupported key') })();

function TokenCard({ token, index }) {
  const { accessToken, me } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const { connection } = useConnection()
  const walletInstance = useWallet()

  const [amount, setAmount] = useState(1)
  const [address, setAddress] = useState('37Z16B1TYGY6gHTjFYtATJNPQwwYLgrr7sp3om2QSfUt')
  const [error, setError] = useState(null)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (isSending) return

    if (!amount || !address) {
      setError('Please enter an amount and address')
      return
    }

    if (!amount) {
      setError('Please enter an amount')
      return
    }

    if (amount > token.total) {
      setError('Amount is greater than balance')
      return
    }

    if (!address) {
      setError('Please enter an address')
      return
    }

    if (!validateAddress(address)) {
      setError('Invalid Solana address')
      return
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    setError(null)
    setIsSending(true)

    try {
      console.log(`Sending ${amount} ${token.symbol} to ${address}`)

      const chain = CHAINS[import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"]

      const program = await loadPivyProgram(
        connection,
        walletInstance,
        new PublicKey(chain.stealthProgramId)
      )

      const balances = token.balances.sort((a, b) => b.amount - a.amount).filter(b => b.amount > 0)
      console.log(balances)

      const picks = []
      let remaining = amount

      for (const balance of balances) {
        if (remaining <= 0) break

        const pick = Math.min(balance.amount, remaining)

        picks.push({
          address: balance.address,
          ephemeralPubkey: balance.ephemeralPubkey,
          memo: balance.memo,
          mint: balance.mint,
          amount: pick
        })

        remaining -= pick
      }

      console.log('Picked wallets:', picks)

      const mint = new PublicKey(token.mintAddress)

      const destinationOwner = new PublicKey(address)
      const destinationAta = getAssociatedTokenAddressSync(
        mint,
        destinationOwner
      )

      console.log('Destination ATA:', destinationAta.toBase58())

      const ixs = [];

      // 1) ensure destination ATA exists
      if (!(await connection.getAccountInfo(destinationAta))) {
        console.log('Creating destination ATA…');
        ixs.push(
          createAssociatedTokenAccountInstruction(
            walletInstance.publicKey,
            destinationAta,
            destinationOwner,
            mint
          )
        );
      }

      // 2) for each picked stealth payment…
      const stealthSigners = [];
      for (const pick of picks) {
        const decryptedEphPriv = await decryptEphemeralPrivKey(
          pick.memo,
          me.metaViewPriv,
          pick.ephemeralPubkey,
        );

        console.log("decryptedEphPriv", decryptedEphPriv);

        const stealthKP = await deriveStealthKeypair(
          me.metaSpendPriv,
          me.metaViewPub,
          decryptedEphPriv,
        );

        // console.log(`Sending test SOL from ${stealthKP.publicKey.toBase58()} to ${walletInstance.publicKey.toBase58()}`)
        // // signer test
        // const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_DEVNET, 'confirmed');
        // const tx = new Transaction().add(
        //   SystemProgram.transfer({
        //     fromPubkey: stealthKP.publicKey,
        //     toPubkey: walletInstance.publicKey,
        //     lamports: 0.001 * LAMPORTS_PER_SOL
        //   })
        // )

        // const latestBlockhash = await connection.getLatestBlockhash()
        // tx.recentBlockhash = latestBlockhash.blockhash
        // tx.feePayer = stealthKP.publicKey

        // const signed = await stealthKP.signTransaction(tx);
        // console.log('signed', signed)

        // const sig = await connection.sendRawTransaction(signed.serialize(), {
        //   skipPreflight: true,
        // });
        // console.log('sent', sig)
        // console.log('confirming...')
        // await connection.confirmTransaction(sig, 'confirmed');
        // console.log('Withdrawal successful:', sig);
        // return;

        const stealthAta = getAssociatedTokenAddressSync(
          mint,
          stealthKP.publicKey
        )

        console.log('stealthATA', stealthAta.toBase58())
        stealthSigners.push(stealthKP)

        ixs.push(
          await program.methods
            .withdraw({
              amount: new BN(pick.amount * 10 ** token.decimals),
            })
            .accounts({
              stealthOwner: stealthKP.publicKey,
              stealthAta: stealthAta,
              destinationAta: destinationAta,
              mint: mint,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()
        ); 
      }
      // 3) assemble + partial sign + send
      const tx = new Transaction().add(...ixs);
      tx.feePayer = walletInstance.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      // await Promise.all(stealthSigners.map(s => s.signTransaction(tx)));

      for (const stealthSigner of stealthSigners) {
        await stealthSigner.signTransaction(tx);
      }

      // now send the fully-signed tx
      const signed = await walletInstance.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
      });
      await connection.confirmTransaction(sig, 'confirmed');
      console.log('Withdrawal successful:', sig);
    } catch (error) {
      console.log('Withdrawal error:', error)
      setError(`Transaction failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }


  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1,
        delay: index * 0.08,
      }}
    >
      <div className='bg-white p-4 rounded-2xl border-[1.5px] border-gray-200/80 transition-colors group shadow-sm hover:shadow'>
        <div className='flex items-center justify-between gap-3'>
          {/* Token Icon */}
          <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100'>
            {token.imageUrl ? (
              <img
                src={token.imageUrl}
                alt={token.name}
                className='w-full h-full object-cover'
              />
            ) : (
              <span className='text-xl'>💰</span>
            )}
          </div>

          {/* Token Amount and Name */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-baseline gap-2'>
              <p className='text-xl font-bold tracking-tight text-gray-900 truncate'>
                {token.total.toLocaleString('en-US', { minimumFractionDigits: token.decimals === 6 ? 2 : 4, maximumFractionDigits: token.decimals === 6 ? 2 : 4 })}
              </p>
              <p className='text-lg font-medium text-gray-500'>{token.symbol}</p>
            </div>
            <div className='flex items-baseline justify-between'>
              <p className='text-sm text-gray-500 truncate'>{token.name}</p>
              <p className='text-sm font-medium text-gray-900'>
                ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Popover
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            placement='bottom'
            classNames={{
              content: "rounded-2xl shadow-xl border border-gray-100",
            }}
          >
            <PopoverTrigger>
              <Button
                isIconOnly
                size='md'
                variant='light'
                className='-mr-2'
              >
                <ArrowUpRightIcon className='w-6 h-6 opacity-40' />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="min-w-[18rem] p-4 bg-white rounded-2xl">
              <div className="flex flex-col gap-4 w-full">
                {/* Amount Input */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600 font-medium">Amount</label>
                    <button
                      onClick={() => setAmount(token.total)}
                      className="text-xs px-2 py-1 rounded-xl bg-primary-500 hover:bg-primary-600 text-gray-900 font-semibold transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onValueChange={(val) => {
                      setAmount(val);
                      setError(null);
                    }}
                    placeholder="0.00"
                    endContent={<span className="text-gray-600">{token.symbol}</span>}
                    classNames={{
                      input: "bg-white",
                      inputWrapper: "border border-gray-100 hover:border-gray-200 bg-white"
                    }}
                  />
                </div>

                {/* Address Input */}
                <div className="w-full">
                  <label className="text-sm text-gray-600 font-medium mb-2 block">Address</label>
                  <Input
                    type="text"
                    value={address}
                    onValueChange={(val) => {
                      setAddress(val);
                      setError(null);
                    }}
                    placeholder="Recipient address"
                    classNames={{
                      input: "bg-white",
                      inputWrapper: "border border-gray-100 hover:border-gray-200 bg-white"
                    }}
                  />
                </div>

                {error && <div className="text-red-500 text-sm -mt-2">{error}</div>}

                <Button
                  onPress={handleSend}
                  isDisabled={isSending || !amount || !address}
                  isLoading={isSending}
                  className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-bold tracking-tight w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  Send
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </motion.div>
  )
}

export default function FundsCard() {
  const { balances } = useDashboard()

  // Calculate total USD value
  const totalUsdValue = balances?.spl?.reduce((acc, token) => acc + token.usdValue, 0) || 0

  return (
    <ColorCard color="primary" className='nice-card p-2 w-full'>
      <AnimatePresence mode="popLayout">
        {!balances ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1,
              duration: 0.2
            }}
            className='p-8 flex flex-col items-center justify-center'
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <SparklesIcon className='w-12 h-12 text-primary-500' />
            </motion.div>
            <div className='mt-4 text-lg font-medium text-gray-900'>
              Loading your balances...
            </div>
            <div className='mt-2 text-sm text-gray-500'>
              This will just take a moment ✨
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1,
            }}
            className='p-4'
          >
            {/* Header with total value */}
            <motion.div
              className='mb-8'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 1,
              }}
            >
              <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
                My Wallet
              </h2>
              <div className='mt-2'>
                <span className='text-4xl font-bold tracking-tighter text-gray-900'>
                  ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className='text-sm text-gray-500 ml-2'>USD</span>
              </div>
            </motion.div>

            {/* Token Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {balances.spl?.map((token, index) => (
                <TokenCard key={token.mintAddress} token={token} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ColorCard>
  )
}
