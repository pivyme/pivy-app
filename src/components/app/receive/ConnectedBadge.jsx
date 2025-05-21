import { AnimatePresence } from 'framer-motion'
import React from 'react'
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';

export default function ConnectedBadge({
  connected,
  publicKey,
  wallet,
  onDisconnect
}) {
  return (
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
                onPress={onDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
