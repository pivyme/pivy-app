import React, { useState, useEffect } from 'react'
import { Button, Input, Spinner } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchIcon, CheckCircle2Icon, SparklesIcon, XCircleIcon } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import axios from 'axios'
import { useDebounce } from '@uidotdev/usehooks'
import { RESTRICTED_USERNAME } from '@/config'
import Modal from '@/components/shared/Modal'

export default function EditUsernameModal({ open, onClose }) {
  const { accessToken, fetchMe } = useAuth()
  const [username, setUsername] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState(null)
  const [validationError, setValidationError] = useState(null)

  // Reset states when modal closes
  useEffect(() => {
    if (!open) {
      setUsername("")
      setIsSubmitting(false)
      setIsChecking(false)
      setIsAvailable(null)
      setValidationError(null)
    }
  }, [open])

  // Force lowercase and validate input
  const handleUsernameChange = (value) => {
    const lowercaseValue = value.toLowerCase()
    // Only allow alphanumeric characters
    if (lowercaseValue !== '' && !/^[a-z0-9]+$/.test(lowercaseValue)) {
      setValidationError("Only letters and numbers are allowed")
      return
    }
    setValidationError(null)
    setUsername(lowercaseValue)
  }

  const debouncedUsername = useDebounce(username, 500)

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername) {
        setIsAvailable(null)
        return
      }

      // Check against restricted usernames first
      if (RESTRICTED_USERNAME.includes(debouncedUsername)) {
        setIsAvailable(false)
        return
      }

      try {
        setIsChecking(true)
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/user/username/check`,
          {
            params: {
              username: debouncedUsername
            },
          }
        )
        setIsAvailable(data.isAvailable)
      } catch (error) {
        console.error("Error checking username:", error)
        setIsAvailable(null)
      } finally {
        setIsChecking(false)
      }
    }

    checkUsername()
  }, [debouncedUsername])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/user/username/set`,
        { username },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      await fetchMe()
      onClose()
    } catch (error) {
      console.error("Error setting username:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusContent = () => {
    if (validationError) {
      return {
        text: validationError,
        icon: <XCircleIcon className="w-4 h-4" />,
        color: "bg-danger-100 text-danger-600"
      }
    }
    if (!username) {
      return {
        text: "Enter your new username",
        icon: <SearchIcon className="w-4 h-4" />,
        color: "bg-gray-100 text-gray-600"
      }
    }
    if (isChecking) {
      return {
        text: "Checking availability...",
        icon: <motion.div
          animate={{ 
            rotate: 360,
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <SearchIcon className="w-4 h-4" />
        </motion.div>,
        color: "bg-secondary-50 text-secondary-600"
      }
    }
    if (isAvailable === null) {
      return {
        text: "Enter your new username",
        icon: <SearchIcon className="w-4 h-4" />,
        color: "bg-gray-100 text-gray-600"
      }
    }
    if (RESTRICTED_USERNAME.includes(username)) {
      return {
        text: "This username is not allowed",
        icon: <XCircleIcon className="w-4 h-4" />,
        color: "bg-danger-100 text-danger-600"
      }
    }
    if (isAvailable) {
      return {
        text: "Username is available!",
        icon: <CheckCircle2Icon className="w-4 h-4" />,
        color: "bg-success-50 text-success-600"
      }
    }
    return {
      text: "Username is not available",
      icon: <XCircleIcon className="w-4 h-4" />,
      color: "bg-danger-100 text-danger-600"
    }
  }

  return (
    <Modal 
      isOpen={open}
      onClose={onClose}
      maxWidth="32rem"
    >
      <motion.form 
        onSubmit={handleSubmit}
        className='space-y-6'
      >
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center'>
            <SparklesIcon className='w-6 h-6 text-primary-500' />
          </div>
          <div>
            <h3 className='text-xl font-bold tracking-tight'>Change Username</h3>
            <p className='text-sm text-gray-500'>Choose a new username for your Pivy profile</p>
          </div>
        </div>

        <div className='flex flex-col w-full gap-3'>
          <Input
            placeholder="Enter your new username"
            name="username"
            size="lg"
            type="text"
            value={username}
            onValueChange={handleUsernameChange}
            startContent={
              <span className="px-2 py-1 mt-1 font-medium text-sm bg-primary text-black rounded-md">
                pivy.me/
              </span>
            }
            className="w-full"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <div className="flex justify-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={isChecking || isAvailable === null ? 'checking' : (username ? (isAvailable ? 'available' : 'unavailable') : 'empty')}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusContent().color}`}
              >
                {isChecking ? (
                  <Spinner size="sm" color="secondary" />
                ) : (
                  getStatusContent().icon
                )}
                {getStatusContent().text}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <Button
          type="submit"
          color="primary"
          size="lg"
          className='w-full font-semibold tracking-tight text-base py-6'
          isDisabled={!username || !isAvailable || isChecking}
          isLoading={isSubmitting}
        >
          Update Username
        </Button>
      </motion.form>
    </Modal>
  )
} 