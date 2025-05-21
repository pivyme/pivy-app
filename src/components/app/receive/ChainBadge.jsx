import React from 'react'
import { motion } from 'framer-motion';

export default function ChainBadge({
  chain
}) {
  if(chain !== 'SOLANA' && chain !== 'SUI') {
    return "";
  }


  const logoPath = `/chains/${chain.toLowerCase()}.svg`;
  
  // Chain-specific accent classes
  const accentClasses = {
    SOLANA: 'border-purple-500/30 shadow-purple-100',
    SUI: 'border-blue-500/30 shadow-blue-100'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
        delay: 0.5
      }}
      className="fixed bottom-8 left-8 z-50"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`bg-white border-4 ${accentClasses[chain]} backdrop-blur-sm shadow-lg rounded-xl p-3 flex items-center gap-3 pr-5 nice-card`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center p-2 ${chain === 'SOLANA' ? 'bg-purple-50' : 'bg-blue-50'}`}>
          <img src={logoPath} alt={`${chain} logo`} className="w-full h-full" />
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">You are paying on</p>
          <p className={`text-base font-bold capitalize -mt-0.5 ${chain === 'SOLANA' ? 'text-purple-900' : 'text-blue-900'}`}>
            {chain.toLowerCase()}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
