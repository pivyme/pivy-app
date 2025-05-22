import React from 'react'
import { motion } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';

export default function LoadingView() {
  return (
    <div className='nice-card p-8 w-full flex flex-col items-center'>
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <SparklesIcon className='w-12 h-12 text-primary-500' />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mt-4 text-lg font-medium text-gray-900'
      >
        Setting up your payment...
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className='mt-2 text-sm text-gray-500'
      >
        This will just take a moment ✨
      </motion.div>
    </div>
  )
}
