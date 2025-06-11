import React from 'react'
import { AnimatePresence, motion } from 'framer-motion';
import { SPECIAL_THEMES } from '@/config';

export default function CollabLogo({
  specialTheme
}) {
  return (
    <AnimatePresence mode="wait">
      {specialTheme &&
        SPECIAL_THEMES.find(theme => theme.id === specialTheme) ? (
        <motion.img
          key="special-logo"
          src={SPECIAL_THEMES.find(theme => theme.id === specialTheme)?.headerLogo}
          alt="Logo"
          className='w-[17rem] mb-4'
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.3
            }
          }}
          exit={{
            opacity: 0,
            scale: 0.5,
            transition: {
              duration: 0.2
            }
          }}
        />
      ) : (
        <motion.img
          key="default-logo"
          src="/pivy-horizontal-logo.svg"
          alt="Privy"
          className='w-[12rem] mb-4 z-20'
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.3
            }
          }}
          exit={{
            opacity: 0,
            scale: 0.5,
            transition: {
              duration: 0.2
            }
          }}
        />
      )}
    </AnimatePresence>
  )
}
