import React from 'react'
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { SparklesIcon } from 'lucide-react';
import { useReceive } from './ReceiveProvider';

export default function CreateOwnLinkBadge() {
  const { sourceChain } = useReceive()

  let redirectLink = "/";

  if(sourceChain === "SUI"){
    redirectLink = redirectLink + "?c=sui";
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
        delay: 1
      }}
      className="fixed bottom-8 right-8 z-50"
    >
      <Link to={redirectLink}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white shadow-xl rounded-2xl p-4 flex items-center gap-3 pr-6 nice-card"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Create Your Own Link</p>
            <p className="text-sm text-gray-500">Get started for free</p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
