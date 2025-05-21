import { Button, Autocomplete, AutocompleteItem } from '@heroui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { NATIVE_MINT } from '@solana/spl-token'
import AnimateComponent from '@/components/elements/AnimateComponent'
import { SparklesIcon } from 'lucide-react'
import PayButton from '@/components/app/PayButton'
import { CheckCircle2Icon, ExternalLinkIcon, DownloadIcon, ArrowRightIcon } from 'lucide-react'
import BounceButton from '@/components/elements/BounceButton'
import ColorCard from '@/components/elements/ColorCard'
import { getExplorerTxLink } from '@/utils/misc'
import SpecialThemeBackground from '@/components/app/SpecialThemeBackground'
import { SPECIAL_THEMES } from '../config'
import UsdcEvmPayment from '@/components/app/UsdcEvmPayment'
import { formatUiNumber } from '@/utils/formatting'
import ChainBadge from '@/components/app/receive/ChainBadge'
import PaymentSuccessView from '@/components/app/receive/PaymentSuccessView'
import CollabLogo from '@/components/app/receive/CollabLogo'
import LoadingView from '@/components/app/receive/LoadingView'
import ErrorView from '@/components/app/receive/ErrorView'
import ConnectedBadge from '@/components/app/receive/ConnectedBadge'
import PaymentDetail from '@/components/app/receive/PaymentDetail'

export default function ReceivePage({
  username: propUsername,
  tag: propTag
}) {
  const params = useParams()
  const username = propUsername || params.username
  const tag = propTag || params.tag || ""

  /* --------------------------------- General -------------------------------- */
  const [stealthData, setStealthData] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState(null)
  const [sourceChain, setSourceChain] = useState(null)

  /* --------------------------------- Solana --------------------------------- */

  const wallet = useWallet()
  const { connected, connecting, publicKey } = wallet
  const { setVisible } = useWalletModal();


  useEffect(() => {
    console.log('Wallet state changed:', {
      connected,
      connecting,
      publicKey: publicKey?.toString(),
    })
  }, [connected, connecting, publicKey])

  useEffect(() => {
    let mounted = true

    const initializeData = async () => {
      setIsInitializing(true)
      setError(null)

      try {
        if (!username) {
          throw new Error('No username provided')
        }

        // Create a minimum loading time promise
        const minimumLoadingTime = new Promise(resolve =>
          // TODO: Enable this later
          setTimeout(resolve, 2000)
          // setTimeout(resolve, 0)
        );

        // Fetch data promise
        const fetchDataPromise = async () => {
          // Fetch stealth data
          const stealthResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/address/${username}/${tag}`,
            {
              params: {
                chain: import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"
              }
            }
          )

          if (!mounted) return

          if (!stealthResponse.data) {
            throw new Error("User not found")
          }

          console.log('stealthResponse', stealthResponse.data)
          setStealthData(stealthResponse.data)
          setSourceChain(stealthResponse.data.sourceChain)

          // If wallet is connected, fetch balances
          if (connected && wallet.publicKey) {
            await handleFetchTokenBalances()
          }
        }

        // Wait for both minimum time and data fetching
        await Promise.all([
          minimumLoadingTime,
          fetchDataPromise()
        ])

      } catch (err) {
        if (!mounted) return
        console.error("Error initializing:", err.response)
        setError(
          err.response?.status === 404 || err.response?.data?.message === "User not found"
            ? "User not found"
            : err.response?.data?.message || "Failed to load data"
        )
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeData()

    return () => {
      mounted = false
    }
  }, [username, tag, connected, wallet.publicKey])

  // Token Balances
  const [tokenBalances, setTokenBalances] = useState(null)
  const [selectedToken, setSelectedToken] = useState(null)
  const [tokenSearchValue, setTokenSearchValue] = useState("")
  const [amount, setAmount] = useState("")
  const [isUsdcMode, setIsUsdcMode] = useState(false)

  const normalizeTokenData = (token) => {
    const isNativeToken = 'symbol' in token && !('token' in token);

    if (isNativeToken) {
      return {
        isNative: true,
        amount: token.amount,
        decimals: token.decimals,
        address: 'native',
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

  const normalizeFixedTokenData = (tokenInfo) => {
    return {
      isNative: tokenInfo.address === NATIVE_MINT.toString(),
      amount: 0,
      decimals: tokenInfo.decimals,
      address: tokenInfo.address,
      imageUrl: tokenInfo.imageUrl,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol
    };
  };

  const handleFetchTokenBalances = async () => {
    try {
      const balances = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/user/balance/${wallet.publicKey}`,
        {
          params: {
            chain: import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"
          }
        }
      )
      console.log('balances', balances.data)
      setTokenBalances(balances.data)

      // If it's a fixed amount payment, find and select the matching token
      if (stealthData?.linkData?.amountType === 'FIXED' && stealthData?.linkData?.amountData) {
        const mintAddress = stealthData.linkData.amountData.mintAddress;

        // Check if the token is in the balances
        let matchingToken;
        if (mintAddress === NATIVE_MINT.toString()) {
          matchingToken = balances.data.nativeBalance;
        } else {
          matchingToken = balances.data.splBalance?.find(t => t.mint === mintAddress);
        }

        // If we found the token in balances, use that data
        if (matchingToken) {
          const normalizedToken = normalizeTokenData(matchingToken);
          setSelectedToken(normalizedToken);
          setTokenSearchValue(normalizedToken.name);
        }
        // If not found in balances, use the tokenInfo from the fixed amount data
        else if (stealthData.linkData.tokenInfo) {
          const normalizedToken = normalizeFixedTokenData(stealthData.linkData.tokenInfo);
          setSelectedToken(normalizedToken);
          setTokenSearchValue(normalizedToken.name);
        }

        // Set the fixed amount
        setAmount((stealthData.linkData.amountData.amount / 1000000).toString());
      } else if (balances.data?.nativeBalance) {
        // Default to SOL for non-fixed amounts
        setSelectedToken(normalizeTokenData(balances.data.nativeBalance))
        setTokenSearchValue(balances.data.nativeBalance.name)
        setAmount("")
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }

  useEffect(() => {
    if (connected) {
      handleFetchTokenBalances()
    } else {
      setTokenBalances(null)
      setSelectedToken(null)
      setTokenSearchValue("")
      setAmount("")
    }
  }, [connected, stealthData])

  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-center px-2 md:px-0'>
      <SpecialThemeBackground
        specialTheme={stealthData?.linkData?.specialTheme || 'default'}
      />
      <ChainBadge chain={stealthData?.sourceChain} />
      <div className='flex flex-col items-center w-full max-w-xl px-2 z-20 relative'>
        <CollabLogo specialTheme={stealthData?.linkData?.specialTheme} />

        {isInitializing ? (
          <AnimateComponent delay={100}>
            <LoadingView />
          </AnimateComponent>
        ) : error ? (
          <AnimateComponent>
            <ErrorView error={error} />
          </AnimateComponent>
        ) : paymentSuccess ? (
          <div className='w-full'>
            <PaymentSuccessView
              paymentDetails={paymentSuccess}
              publicKey={publicKey}
              stealthData={stealthData}
            />
          </div>
        ) : (
          <ColorCard color={stealthData?.linkData?.backgroundColor} className='nice-card bg-gradient-to-br bg-background-500 p-4 w-full flex flex-col overflow-hidden'>
            <ConnectedBadge
              connected={connected}
              publicKey={publicKey}
              wallet={wallet}
              onDisconnect={() => wallet.disconnect()}
            />

            <div className='nice-card p-6 w-full flex flex-col'>
              {/* Payment details */}
              <AnimateComponent delay={200}>
                <PaymentDetail stealthData={stealthData} />
              </AnimateComponent>

              {connected ? (
                <div className='flex flex-col gap-6'>
                  {/* Payment Method Selection */}
                  <AnimateComponent delay={400}>
                    <div className='space-y-6'>
                      {/* Tabs */}
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button
                          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${!isUsdcMode
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                          onClick={() => setIsUsdcMode(false)}
                        >
                          Solana Tokens
                        </button>
                        <button
                          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${isUsdcMode
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                          onClick={() => setIsUsdcMode(true)}
                        >
                          USDC (Any Chain)
                        </button>
                      </div>

                      {/* Content based on selected mode */}
                      <AnimatePresence mode="wait" initial={false}>
                        {isUsdcMode ? (
                          <motion.div
                            key="usdc-mode"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              transition: {
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                                mass: 1
                              }
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.9,
                              transition: {
                                duration: 0.15
                              }
                            }}
                          >
                            <div className="mb-6 flex items-center">
                              <button
                                onClick={() => setIsUsdcMode(false)}
                                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 group"
                              >
                                <ArrowRightIcon className="w-4 h-4 rotate-180" />
                                <span>Back</span>
                              </button>
                            </div>
                            <UsdcEvmPayment
                              amount={amount}
                              setAmount={setAmount}
                              stealthData={stealthData}
                              onSuccess={(details) => {
                                console.log('USDC payment success:', details)
                                setPaymentSuccess(details)
                              }}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="sol-mode"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              transition: {
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                                mass: 1
                              }
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.9,
                              transition: {
                                duration: 0.15
                              }
                            }}
                            className='space-y-4'
                          >
                            {/* Token Balance Display */}
                            {selectedToken && (
                              <div className="flex justify-end">
                                <p className='text-sm text-gray-600'>
                                  Balance: <span className='font-semibold text-gray-900'>{formatUiNumber(selectedToken?.amount, "")} {selectedToken?.symbol}</span>
                                </p>
                              </div>
                            )}

                            {/* Token Selection */}
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

                            {/* Amount Input */}
                            {selectedToken && (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-medium tracking-tight outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  <button
                                    onClick={() => setAmount(selectedToken.amount.toString())}
                                    className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
                                  >
                                    MAX
                                  </button>
                                  <span className="font-medium text-gray-700">
                                    {selectedToken.symbol}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Pay Button */}
                            {selectedToken && (
                              <PayButton
                                selectedToken={selectedToken}
                                amount={amount}
                                stealthData={stealthData}
                                onSuccess={(sig) => {
                                  console.log('Payment successful:', sig)
                                  setPaymentSuccess({
                                    signature: sig,
                                    amount: amount,
                                    token: selectedToken,
                                    timestamp: Date.now()
                                  })
                                }}
                                onError={(error) => {
                                  console.error('Payment failed:', error)
                                }}
                              />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </AnimateComponent>
                </div>
              ) : (
                <AnimateComponent delay={400} className='w-full'>
                  <div className="space-y-4">
                    {isUsdcMode ? (
                      <div>
                        <div className="mb-6 flex items-center">
                          <button
                            onClick={() => setIsUsdcMode(false)}
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 group"
                          >
                            <ArrowRightIcon className="w-4 h-4 rotate-180" />
                            <span>Back</span>
                          </button>
                        </div>
                        <UsdcEvmPayment
                          amount={amount}
                          setAmount={setAmount}
                          stealthData={stealthData}
                          onSuccess={(details) => {
                            console.log('USDC payment success:', details)
                            setPaymentSuccess(details)
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <BounceButton
                          className='tracking-tight font-semibold px-8 py-6 text-lg w-full'
                          radius='full'
                          size='md'
                          color='primary'
                          onPress={() => {
                            console.log('Connect button clicked')
                            setVisible(true)
                            setIsUsdcMode(false)
                          }}
                        >
                          Connect Wallet to continue
                        </BounceButton>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 text-gray-500 bg-white">or</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsUsdcMode(true)}
                          className="w-full flex items-center justify-center gap-2 py-4 text-gray-600 hover:text-gray-900 transition-colors group"
                        >
                          <img
                            src="/tokens/usdc.png"
                            alt="USDC"
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium">Pay with USDC from any EVM chain</span>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </button>
                      </>
                    )}
                  </div>
                </AnimateComponent>
              )}
              <AnimateComponent delay={700}>
                <div className='text-sm text-center text-gray-500 mt-8'>
                  Secured by PIVY • Self-custodial payments
                </div>
              </AnimateComponent>
            </div>
          </ColorCard>
        )}
      </div>
    </div>
  )
}
