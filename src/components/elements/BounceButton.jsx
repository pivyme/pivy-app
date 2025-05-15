import React from 'react'
import { Button } from '@heroui/react'
import { motion } from 'framer-motion'

export default function BounceButton({ 
  children,
  className = "",
  size = "lg",
  radius = "full",
  variant = "solid",
  startContent,
  endContent,
  isDisabled,
  isLoading,
  onPress,
  ...props 
}) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        transition: { 
          type: "spring",
          stiffness: 400,
          damping: 15,
          mass: 1
        }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: {
          type: "spring",
          stiffness: 800,
          damping: 15,
          mass: 0.5,
          velocity: 1
        }
      }}
      animate={{ 
        scale: 1
      }}
      initial={{ scale: 1 }}
    >
      <Button
        className={`${className} relative`}
        size={size}
        radius={radius}
        variant={variant}
        startContent={startContent}
        endContent={endContent}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onPress={onPress}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
} 