import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Autocomplete, AutocompleteItem, Skeleton } from '@heroui/react'
import { ArrowRightIcon } from 'lucide-react'
import { formatUiNumber } from '@/utils/formatting'
import PayButton from '@/components/app/PayButton'
import UsdcEvmPayment from '@/components/app/UsdcEvmPayment'
import { useReceive } from './ReceiveProvider'
import SuiPayButton from './SuiPayButton'

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
    normalizeTokenData
  } = useReceive()

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
    </div>
  )
}

function SuiContent() {
  const {
    tokenBalances,
    selectedToken,
    amount,
    setAmount,
    handlePayment,
    stealthData,
    setPaymentSuccess
  } = useReceive()

  console.log('selectedToken', selectedToken)
  console.log('tokenBalances', tokenBalances)

  if (!selectedToken) {
    return (
      <Skeleton className='w-full h-[8rem] rounded-xl' />
    )
  }

  useEffect(() => {
    setAmount(0.01)
  }, [])
  
  // Dummy implementation for now
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

      {/* Amount Input */}
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
            timestamp: Date.now()
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