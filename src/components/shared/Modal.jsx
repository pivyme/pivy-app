import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'

/**
 * A reusable modal component with smooth animations
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls if the modal is visible
 * @param {function} props.onClose - Function called when modal should close
 * @param {React.ReactNode} props.children - Content to render inside the modal
 * @param {string} [props.maxWidth='28rem'] - Max width of the modal content
 * @param {string} [props.padding='1.5rem'] - Padding of the modal content
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  children,
  maxWidth = '28rem',
  padding = '1.5rem'
}) {
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.3,
            exit: { duration: 0.2 }
          }}
          className='z-50 fixed top-0 left-0 w-screen h-screen'
        >
          {/* Static backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.2,
              exit: { duration: 0.15 }
            }}
            className='absolute inset-0 bg-black/50'
            onClick={onClose}
          />

          <div className='w-full h-full flex items-center justify-center p-4'>
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ 
                y: 0,
                opacity: 1
              }}
              exit={{ 
                y: 60,
                opacity: 0,
              }}
              transition={{ 
                type: "tween",
                duration: 0.3,
                ease: [0.19, 1, 0.22, 1],
                exit: {
                  duration: 0.25,
                  ease: [0.4, 0, 1, 1]
                }
              }}
              style={{
                maxWidth,
                padding
              }}
              className='w-full relative nice-card'
            >
              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  transition: {
                    duration: 0.15,
                    ease: "easeIn"
                  }
                }}
                transition={{ 
                  duration: 0.2,
                  ease: "easeOut"
                }}
                onClick={onClose}
                className='absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors'
              >
                <XIcon className='w-5 h-5' />
              </motion.button>

              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.getElementById('portal-root')
  )
}
