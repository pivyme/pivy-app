import { cnm } from '@/utils/style'
import { Button, Autocomplete, AutocompleteItem, Avatar } from '@heroui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token'
import { buildPayTx } from '@/lib/pivy-stealth/pivy-stealth'

export default function ReceivePage({
  username: propUsername,
  tag: propTag
}) {
  console.log('ReceivePage rendered')

  const params = useParams()
  const username = propUsername || params.username
  const tag = propTag || params.tag || ""

  const wallet = useWallet()
  const { connection } = useConnection()
  const { connected, connecting, publicKey } = wallet
  const { setVisible, visible } = useWalletModal();

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stealthData, setStealthData] = useState(null)

  useEffect(() => {
    console.log('Wallet state changed:', {
      connected,
      connecting,
      publicKey: publicKey?.toString(),
      visible
    })
  }, [connected, connecting, publicKey, visible])

  // {
  //   "username": "test",
  //   "tag": "",
  //   "metaSpendPub": "CZG7aBVtN1XKNXyjAYB1yxu4A5ERptcLcYWJU3F97A4A",
  //   "metaViewPub": "FticuBpPpRfAWh1rbtmGuuhHvuUnT2qNHYSStaWzJCZU"
  // }

  useEffect(() => {
    let mounted = true

    if (!username) {
      setError('No username provided')
      setIsLoading(false)
      return;
    }

    setIsLoading(true)
    setError(null)

    axios
      .get(
        `${import.meta.env.VITE_BACKEND_URL}/address/${username}/${tag}`
      )
      .then((response) => {
        if (mounted) {
          // Only update state if component is still mounted
          if (!response.data) {
            setError("User not found");
          } else {
            setStealthData(response.data)
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          // Only update state if component is still mounted
          console.error("Error fetching address:", err.response);
          if (
            err.response?.status === 404 ||
            err.response?.data?.message === "User not found"
          ) {
            setError("User not found");
          } else {
            setError(err.response?.data?.message || "Failed to load address");
          }
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false
    }
  }, [username, tag])

  useEffect(() => {
    if (stealthData) {
      console.log('stealthData', stealthData)
    }
  }, [stealthData])

  console.log('connected', connected)

  // Token Balances
  const [tokenBalances, setTokenBalances] = useState(null)
  const [selectedToken, setSelectedToken] = useState(null)
  const [tokenSearchValue, setTokenSearchValue] = useState("")
  const [amount, setAmount] = useState("")

  const normalizeTokenData = (token) => {
    const isNativeToken = 'symbol' in token && !('token' in token);

    if (isNativeToken) {
      return {
        isNative: true,
        amount: token.amount,
        decimals: token.decimals,
        address: 'native', // Native SOL doesn't have a token address
        imageUrl: token.imageUrl,
        name: token.name,
        symbol: token.symbol
      };
    }

    return {
      isNative: false,
      amount: token.tokenAmount,
      decimals: token.token.decimals,
      address: token.mint,
      imageUrl: token.token.imageUrl,
      name: token.token.name,
      symbol: token.token.symbol
    };
  };

  const handleFetchTokenBalances = async () => {
    const balances = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/user/balance/${wallet.publicKey}`
    )
    console.log('balances', balances.data)
    setTokenBalances(balances.data)
    // Set SOL as default token
    if (balances.data?.nativeBalance) {
      setSelectedToken(normalizeTokenData(balances.data.nativeBalance))
      setTokenSearchValue(balances.data.nativeBalance.name)
    }
  }

  useEffect(() => {
    if (connected) {
      handleFetchTokenBalances()
    } else {
      // Reset states when disconnected
      setTokenBalances(null)
      setSelectedToken(null)
      setTokenSearchValue("")
      setAmount("0.01")
    }
  }, [connected])

  const [isPaying, setIsPaying] = useState(false)

  async function handlePay() {
    try {
      setIsPaying(true);

      /* ─────────────────────────────────────────────────────────── */
      const payingNative = selectedToken.isNative === true;
      const mint = payingNative
        ? NATIVE_MINT                          // So111…
        : new PublicKey(selectedToken.address);

      /* ATA of payer for chosen mint ---------------------------------- */
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

      /* extra wrapping steps for native SOL --------------------------- */
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

      /* build stealth-pay IX ----------------------------------------- */
      const { tx: payTx } = await buildPayTx({
        connection,
        payerPubkey: wallet.publicKey,
        metaSpendPub: stealthData.metaSpendPub,
        metaViewPub: stealthData.metaViewPub,
        amount: payingNative            // units: lamports or μ-token
          ? Number(amount) * LAMPORTS_PER_SOL
          : Number(amount) * 1_000_000,       // 6-dec USDC
        label: 'personal',
        mint,
        payerAta,
        programId: new PublicKey('ECytFKSRMLkWYPp1jnnCEt8AcdnUeaLfKyfr16J3SgUk'),
      });

      /* merge and send ------------------------------------------------ */
      const tx = new Transaction()
        .add(...ixes, ...payTx.instructions);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const sig = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,          // avoid false warning
      });
      await connection.confirmTransaction(sig, 'confirmed');
      console.log('sig', sig);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-center'>
      <div className='flex flex-col items-center w-full max-w-lg px-2'>
        <img src="/pivy-horizontal-logo.svg" alt="Privy" className='w-[12rem] mb-4' />
        <div className='nice-card bg-gradient-to-br bg-background-500 p-0 w-full flex flex-col overflow-hidden'>
          <AnimatePresence>
            {connected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                  transition: {
                    height: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 1
                    },
                    opacity: {
                      duration: 0.2,
                      delay: 0.1
                    }
                  }
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  transition: {
                    height: {
                      duration: 0.2
                    },
                    opacity: {
                      duration: 0.1
                    }
                  }
                }}
              >
                <motion.div
                  initial={{ y: 20 }}
                  animate={{
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 1,
                      delay: 0.1
                    }
                  }}
                  exit={{
                    y: 20,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 1
                    }
                  }}
                  className='px-4 py-2'
                >
                  <div className='flex flex-row items-center justify-between'>
                    <div className='text-sm text-gray-500 flex items-center gap-2'>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 1,
                            delay: 0.2
                          }
                        }}
                        className='w-2 h-2 rounded-full bg-green-500'
                      />
                      Connected: {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                    </div>
                    <Button
                      size='sm'
                      variant='light'
                      color='danger'
                      className='tracking-tight font-medium'
                      onPress={() => wallet.disconnect()}
                    >
                      Disconnect
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='nice-card p-6 w-full flex flex-col'>
            {/* Payment details */}
            <div className='nice-card p-4 mb-8'>
              <div>
                Send fund to <span className='font-semibold'>{stealthData?.username}</span>
                {tag && <span className='text-gray-500'> • {tag}</span>}
              </div>
            </div>

            {connected ? (
              <div className='flex flex-col gap-4'>
                <div className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex flex-row items-end justify-between'>
                      <div className='font-semibold tracking-tight'>
                        Token to send
                      </div>
                      {selectedToken && (
                        <div className={cnm("text-sm text-gray-500")}>
                          <span>Balance: </span>
                          <span className='font-semibold'>
                            {selectedToken?.amount} {selectedToken?.symbol}
                          </span>
                        </div>
                      )}
                    </div>

                    {tokenBalances && (
                      <Autocomplete
                        className="w-full"
                        defaultItems={[
                          tokenBalances.nativeBalance,
                          ...(tokenBalances.splBalance || [])
                        ]}
                        size='lg'
                        placeholder="Search for a token"
                        selectedKey={selectedToken?.address}
                        onSelectionChange={(key) => {
                          const token = [tokenBalances.nativeBalance, ...(tokenBalances.splBalance || [])]
                            .find(t => {
                              if (key === 'native') return 'symbol' in t && t.symbol === 'SOL';
                              return t.mint === key;
                            });
                          setSelectedToken(token ? normalizeTokenData(token) : null);
                          if (token) {
                            const isNativeToken = 'symbol' in token && !('token' in token);
                            setTokenSearchValue(isNativeToken ? token.name : token.token.name);
                          }
                          setAmount("");
                        }}
                        onInputChange={(value) => {
                          setTokenSearchValue(value);
                          if (!value) {
                            setSelectedToken(null);
                          }
                        }}
                        value={selectedToken?.name || tokenSearchValue}
                        startContent={selectedToken && (
                          selectedToken.imageUrl ? (
                            <img
                              alt={selectedToken.name}
                              className="w-8 h-8 p-0.5 object-cover aspect-square"
                              src={selectedToken.imageUrl}
                            />
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center">
                              💰
                            </div>
                          )
                        )}
                      >
                        {(item) => {
                          const normalizedToken = normalizeTokenData(item);

                          return (
                            <AutocompleteItem
                              key={normalizedToken.address}
                              className="data-[selected=true]:bg-primary-500/20"
                              startContent={
                                normalizedToken.imageUrl ? (
                                  <img
                                    alt={normalizedToken.name}
                                    className="w-8 h-8 p-1 object-cover aspect-square"
                                    src={normalizedToken.imageUrl}
                                  />
                                ) : (
                                  <div className="w-8 h-8 flex items-center justify-center">
                                    💰
                                  </div>
                                )
                              }
                              textValue={normalizedToken.name}
                              aria-label={normalizedToken.name}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{normalizedToken.name}</span>
                                <span className="text-xs text-gray-500">
                                  Balance: {normalizedToken.amount} {normalizedToken.symbol}
                                </span>
                              </div>
                            </AutocompleteItem>
                          );
                        }}
                      </Autocomplete>
                    )}
                  </div>

                  {selectedToken && (
                    <div>
                      <div className='font-semibold tracking-tight mb-2'>
                        Amount
                      </div>
                      <div className='relative'>
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-background-600/60 rounded-xl px-4 py-3 text-lg font-medium tracking-tight outline-none focus:ring-2 ring-primary-500/40"
                        />
                        <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2'>
                          <button
                            onClick={() => setAmount(selectedToken.amount.toString())}
                            className='px-2 py-1 text-xs font-semibold bg-background-800/40 hover:bg-background-800/60 rounded-lg transition-colors'
                          >
                            MAX
                          </button>
                          <span className='text-sm font-medium text-gray-500'>
                            {selectedToken.symbol}
                          </span>
                        </div>
                      </div>
                      <div className='text-xs text-gray-500 mt-1 text-right'>
                        ≈ $0.00
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  className='mt-4 tracking-tight font-semibold px-8 py-6 text-lg'
                  radius='full'
                  size='md'
                  color='primary'
                  onPress={handlePay}
                  isLoading={isPaying}
                  isDisabled={isPaying}
                >
                  {isPaying ? 'Paying...' : 'PAY!'}
                </Button>
              </div>
            ) : (
              <Button
                className='tracking-tight font-semibold px-8 py-6 text-lg'
                radius='full'
                size='md'
                color='primary'
                onPress={() => {
                  console.log('Connect button clicked')
                  setVisible(true)
                }}
              >
                Connect Wallet to continue
              </Button>
            )}
            <div className='text-sm text-center text-gray-500 mt-8'>
              Secured by PIVY • Self-custodial payments
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
