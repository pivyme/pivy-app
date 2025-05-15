import { useDashboard } from '@/contexts/DashboardContext'
import { ArrowUpRightIcon, SparklesIcon } from 'lucide-react'
import React from 'react'
import ColorCard from '../elements/ColorCard'
import { motion, AnimatePresence } from 'framer-motion'

function TokenCard({ token, index }) {
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
          <button className='w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0'>
            <ArrowUpRightIcon className='w-4 h-4' />
          </button>
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
