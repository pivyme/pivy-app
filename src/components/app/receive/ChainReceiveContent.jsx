import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Autocomplete, AutocompleteItem, Skeleton } from '@heroui/react'
import { ArrowRightIcon } from 'lucide-react'
import { formatUiNumber } from '@/utils/formatting'
import PayButton from '@/components/app/PayButton'
import UsdcEvmPayment from '@/components/app/UsdcEvmPayment'
import { useReceive } from './ReceiveProvider'
import SuiPayButton from './SuiPayButton'

function TokenInfo({ token }) {
  if (!token) return null;
  
  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
      {token.imageUrl ? (
        <img
          alt={token.name}
          className="w-8 h-8 object-cover aspect-square"
          src={token.imageUrl}
          onError={(e) => {
            e.target.src = '/fallback-token-image.png'
          }}
        />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center">
          💰
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{token.name}</span>
        <span className="text-xs text-gray-500">{token.symbol}</span>
      </div>
    </div>
  )
}

function SolanaContent() {
  const {
    tokenBalances,
    selectedToken,
    tokenSearchValue,
    amount,
    stealthData,
    setSelectedToken,
    setTokenSearchValue,
    setAmount,
    setPaymentSuccess,
    normalizeTokenData,
    wallet
  } = useReceive()

  // Check if it's a fixed amount payment
  const isFixedAmount = stealthData?.linkData?.amountType === 'FIXED'

  // Get the correct balance for fixed payment token
  useEffect(() => {
    if (isFixedAmount && tokenBalances && stealthData?.linkData?.mint) {
      const mintAddress = stealthData.linkData.mint.mintAddress;
      let matchingToken;

      if (mintAddress === 'native') {
        matchingToken = tokenBalances.nativeBalance;
      } else {
        matchingToken = tokenBalances.splBalance?.find(t => t.mint === mintAddress);
      }

      if (matchingToken) {
        const normalizedToken = normalizeTokenData(matchingToken);
        setSelectedToken(normalizedToken);
      } else {
        // If token not in balance, use mint info with 0 balance
        const mintInfo = stealthData.linkData.mint;
        setSelectedToken({
          isNative: mintAddress === 'native',
          amount: 0,
          decimals: mintInfo.decimals,
          address: mintInfo.mintAddress,
          imageUrl: mintInfo.imageUrl,
          name: mintInfo.name,
          symbol: mintInfo.symbol
        });
      }
    }
  }, [isFixedAmount, tokenBalances, stealthData]);

  return (
    <div className='space-y-4'>
      {/* Token Balance Display */}
      {selectedToken && (
        <div className="flex justify-end">
          <p className='text-sm text-gray-600'>
            Balance: <span className='font-semibold text-gray-900'>{formatUiNumber(selectedToken?.amount, "")} {selectedToken?.symbol}</span>
          </p>
        </div>
      )}

      {/* Token Selection or Info */}
      {isFixedAmount ? (
        <TokenInfo token={selectedToken} />
      ) : (
        tokenBalances && (
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
        )
      )}

      {/* Amount Input */}
      {selectedToken && (
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => !isFixedAmount && setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isFixedAmount}
            className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-medium tracking-tight outline-none transition-all ${
              isFixedAmount 
                ? 'opacity-75 cursor-not-allowed' 
                : 'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {!isFixedAmount && (
              <button
                onClick={() => setAmount(selectedToken.amount.toString())}
                className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
              >
                MAX
              </button>
            )}
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
              timestamp: Date.now(),
              sourceChain: 'SOLANA',
              fromAddress: wallet.publicKey
            })
          }}
          onError={(error) => {
            console.error('Payment failed:', error)
          }}
        />
      )}
    </div>
  )
}

function SuiContent() {
  const {
    tokenBalances,
    selectedToken,
    tokenSearchValue,
    amount,
    setAmount,
    setSelectedToken,
    setTokenSearchValue,
    handlePayment,
    stealthData,
    setPaymentSuccess,
    suiWallet,
    wallet,
    normalizeTokenData
  } = useReceive()

  // Check if it's a fixed amount payment
  const isFixedAmount = stealthData?.linkData?.amountType === 'FIXED'

  // Get the correct balance for fixed payment token
  useEffect(() => {
    if (isFixedAmount && tokenBalances && stealthData?.linkData?.mint) {
      const mintAddress = stealthData.linkData.mint.mintAddress;
      let matchingToken;

      if (mintAddress === '0x2::sui::SUI') {
        matchingToken = tokenBalances.nativeBalance;
      } else {
        matchingToken = tokenBalances.tokenBalance?.find(t => t.mint === mintAddress);
      }

      if (matchingToken) {
        const normalizedToken = matchingToken.token ? {
          isNative: false,
          amount: matchingToken.tokenAmount || 0,
          decimals: matchingToken.token.decimals,
          address: matchingToken.mint,
          imageUrl: matchingToken.token.imageUrl,
          name: matchingToken.token.name,
          symbol: matchingToken.token.symbol
        } : {
          isNative: true,
          amount: matchingToken.amount,
          decimals: matchingToken.decimals,
          address: matchingToken.mint,
          imageUrl: matchingToken.imageUrl,
          name: matchingToken.name,
          symbol: matchingToken.symbol
        };
        setSelectedToken(normalizedToken);
      } else {
        // If token not in balance, use mint info with 0 balance
        const mintInfo = stealthData.linkData.mint;
        setSelectedToken({
          isNative: mintAddress === '0x2::sui::SUI',
          amount: 0,
          decimals: mintInfo.decimals,
          address: mintInfo.mintAddress,
          imageUrl: mintInfo.imageUrl,
          name: mintInfo.name,
          symbol: mintInfo.symbol
        });
      }
    }
  }, [isFixedAmount, tokenBalances, stealthData]);

  // Remove the old useEffect that was setting default token
  useEffect(() => {
    if (!isFixedAmount && tokenBalances?.nativeBalance && (!selectedToken || selectedToken.address !== tokenBalances.nativeBalance.mint)) {
      const nativeToken = {
        isNative: true,
        amount: tokenBalances.nativeBalance.amount,
        decimals: tokenBalances.nativeBalance.decimals,
        address: tokenBalances.nativeBalance.mint,
        imageUrl: tokenBalances.nativeBalance.imageUrl,
        name: tokenBalances.nativeBalance.name,
        symbol: tokenBalances.nativeBalance.symbol
      };
      setSelectedToken(nativeToken);
      setTokenSearchValue(nativeToken.name);
      // TODO: Remove this
      // setAmount(0.01);
    }
  }, [tokenBalances, isFixedAmount]);

  console.log('selectedToken', selectedToken)
  console.log('tokenBalances', tokenBalances)

  if (!tokenBalances) {
    return (
      <Skeleton className='w-full h-[8rem] rounded-xl' />
    )
  }

  // Normalize token data for the dropdown
  const normalizedNativeToken = tokenBalances.nativeBalance ? {
    isNative: true,
    amount: tokenBalances.nativeBalance.amount,
    decimals: tokenBalances.nativeBalance.decimals,
    address: tokenBalances.nativeBalance.mint,
    imageUrl: tokenBalances.nativeBalance.imageUrl,
    name: tokenBalances.nativeBalance.name,
    symbol: tokenBalances.nativeBalance.symbol
  } : null;

  const normalizedTokens = tokenBalances.tokenBalance?.map(t => ({
    isNative: false,
    amount: t.tokenAmount || 0,  // Use tokenAmount directly from the token balance object
    decimals: t.token.decimals,
    address: t.mint,
    imageUrl: t.token.imageUrl,
    name: t.token.name,
    symbol: t.token.symbol
  })) || [];

  const allTokens = [
    ...(normalizedNativeToken ? [normalizedNativeToken] : []),
    ...normalizedTokens
  ];
  
  return (
    <div className='space-y-4'>
      {/* Token Balance Display */}
      {selectedToken && (
        <div className="flex justify-end">
          <p className='text-sm text-gray-600'>
            Balance: <span className='font-semibold text-gray-900'>{formatUiNumber(selectedToken?.amount, "")} {selectedToken?.symbol}</span>
          </p>
        </div>
      )}

      {/* Token Selection or Info */}
      {isFixedAmount ? (
        <TokenInfo token={selectedToken} />
      ) : (
        <Autocomplete
          className="w-full"
          defaultItems={allTokens}
          defaultSelectedKey={tokenBalances.nativeBalance?.mint}
          size='lg'
          placeholder="Search for a token"
          selectedKey={selectedToken?.address}
          onSelectionChange={(key) => {
            const token = allTokens.find(t => t.address === key);
            setSelectedToken(token);
            if (token) {
              setTokenSearchValue(token.name);
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
          {(item) => (
            <AutocompleteItem
              key={item.address}
              className="data-[selected=true]:bg-primary-500/20"
              startContent={
                item.imageUrl ? (
                  <img
                    alt={item.name}
                    className="w-8 h-8 p-1 object-cover aspect-square"
                    src={item.imageUrl}
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    💰
                  </div>
                )
              }
              textValue={item.name}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-gray-500">
                  Balance: {item.amount} {item.symbol}
                </span>
              </div>
            </AutocompleteItem>
          )}
        </Autocomplete>
      )}

      {/* Amount Input */}
      <div className="relative">
        <input
          type="text"
          value={amount}
          onChange={(e) => !isFixedAmount && setAmount(e.target.value)}
          placeholder="0.00"
          disabled={isFixedAmount}
          className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-medium tracking-tight outline-none transition-all ${
            isFixedAmount 
              ? 'opacity-75 cursor-not-allowed' 
              : 'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {!isFixedAmount && (
            <button
              onClick={() => setAmount(selectedToken.amount.toString())}
              className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
            >
              MAX
            </button>
          )}
          <span className="font-medium text-gray-700">
            {selectedToken.symbol}
          </span>
        </div>
      </div>

      {/* Pay Button */}
      <SuiPayButton
        selectedToken={selectedToken}
        amount={amount}
        stealthData={stealthData}
        onSuccess={(sig) => {
          console.log('Payment successful:', sig)
          setPaymentSuccess({
            signature: sig,
            amount: amount,
            token: selectedToken,
            timestamp: Date.now(),
            sourceChain: 'SUI',
            fromAddress: wallet.publicKey
          })
        }}
        onError={(error) => {
          console.error('Payment failed:', error)
        }}
      />
    </div>
  )
}

export default function ChainReceiveContent() {
  const {
    sourceChain,
    isUsdcMode,
    setIsUsdcMode,
    stealthData,
    setPaymentSuccess,
    amount,
    setAmount
  } = useReceive()

  const renderChainContent = () => {
    switch (sourceChain) {
      case 'SOLANA':
        return <SolanaContent />
      case 'SUI':
        return <SuiContent />
      default:
        return <div>Unsupported chain</div>
    }
  }

  return (
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
          {sourceChain === 'SOLANA' ? 'Solana Tokens' : 'SUI Tokens'}
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
      <motion.div
        key={isUsdcMode ? "usdc-mode" : "chain-mode"}
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
          renderChainContent()
        )}
      </motion.div>
    </div>
  )
} 