import { useAuth } from '@/providers/AuthProvider'
import { Button, Tab, Tabs } from '@heroui/react'
import { CopyIcon, ExternalLinkIcon, ZapIcon, RotateCwIcon, WalletCardsIcon, LinkIcon, SparklesIcon, ArrowUpRightIcon, PencilIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Input } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import AnimateComponent from '../elements/AnimateComponent'
import { motion, AnimatePresence } from 'framer-motion'
import { shortenAddress } from '@/utils/misc'
import EditUsernameModal from './EditUsernameModal'

const TABS = [
  {
    id: 'link',
    label: 'Link',
    icon: <LinkIcon className='w-4 h-4' />
  },
  {
    id: 'quick',
    label: 'Quick',
    icon: <ZapIcon className='w-4 h-4' />
  },
  // {
  //   id: 'address',
  //   label: 'Address',
  //   icon: <WalletCardsIcon className='w-4 h-4' />
  // }
]

export default function ReceiveCard() {
  const { me } = useAuth()
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState(TABS[0].id)

  console.log('me', me)

  return (
    <div className='nice-card p-4'>
      <div className='flex flex-row items-center justify-between'>
        <Tabs
          selectedKey={selectedTab} onSelectionChange={setSelectedTab}
          radius='full'
          classNames={{
            tabContent: "group-data-[selected=true]:text-[#ffffff] text-lg font-semibold",
            cursor: 'bg-black'
          }}
          size='md'
        >
          {TABS.map((tab) => (
            <Tab key={tab.id}
              title={
                <div className='flex flex-row items-center gap-2'>
                  {tab.icon}
                  <p className='text-lg font-semibold'>{tab.label}</p>
                </div>
              }
            />
          ))}
        </Tabs>

        {/* Username Badge */}
        <div className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-full">
          <motion.div
            animate={{
              rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            🏷️
          </motion.div>
          <span className="font-medium text-sm">
            {me?.username}
          </span>
          <div className="h-3 w-[1px] bg-black/10" />
          <Button
            isIconOnly
            variant="light"
            radius="full"
            size="sm"
            className="min-w-unit-6 w-6 h-6 hover:bg-black/10"
            onClick={() => setIsEditModalOpen(true)}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            <PencilIcon className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className='mt-4 relative overflow-visible'>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
              mass: 0.6,
              duration: 0.2
            }}
          >
            {selectedTab === 'link' && <LinkTab />}
            {selectedTab === 'quick' && <QuickPaymentTab />}
            {selectedTab === 'address' && <AddressTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <EditUsernameModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  )
}

const LinkTab = () => {
  const { me } = useAuth()
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = React.useRef(null)

  const displayLink = `pivy.me/${me?.username}`
  const actualLink = `${window.location.origin}/${me?.username}`

  const handleOpenLink = () => {
    window.open(actualLink, '_blank')
  }

  const handleCopy = async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      await navigator.clipboard.writeText(actualLink)
      setIsCopied(true)
      timeoutRef.current = setTimeout(() => {
        setIsCopied(false)
        timeoutRef.current = null
      }, 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div>
      <div className='bg-background-600/60 rounded-xl p-4 flex flex-row items-center justify-between'>
        <p className='text-xl tracking-tight font-medium'>{displayLink}</p>

        <div className='flex flex-row items-center gap-2'>
          <Button
            isIconOnly
            variant='light'
            radius='full'
            size='md'
            onPress={handleCopy}
            isDisabled={isCopied}
            className='relative'
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isCopied ? 'copied' : 'copy'}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: isCopied ? [0, 10, -5, 0] : 0
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{
                  duration: 0.15,
                  ease: [0.23, 1.2, 0.32, 1],
                }}
              >
                {isCopied ? (
                  <div className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                ) : (
                  <CopyIcon className='w-6 h-6 opacity-50' />
                )}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              {isCopied && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: -35 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{
                    duration: 0.2,
                    ease: "circOut"
                  }}
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-sm font-medium text-green-500 pointer-events-none"
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
          <Button
            isIconOnly
            variant='light'
            radius='full'
            size='md'
            onPress={handleOpenLink}
          >
            <ExternalLinkIcon className='w-6 h-6 opacity-50' />
          </Button>
        </div>
      </div>
    </div>
  )
}

const QuickPaymentTab = () => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [showComingSoon, setShowComingSoon] = useState(false)
  const timeoutRef = React.useRef(null)

  const handleCreateLink = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setShowComingSoon(true)
    timeoutRef.current = setTimeout(() => {
      setShowComingSoon(false)
      timeoutRef.current = null
    }, 1500)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <label className='font-medium'>Amount</label>
        <Input
          placeholder="0.00"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-gray-400 text-small">USDC</span>
            </div>
          }
          type="number"
          value={amount}
          onValueChange={setAmount}
          size='lg'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label className='font-medium'>Description (optional)</label>
        <Input
          placeholder="e.g., Website design payment"
          value={description}
          onValueChange={setDescription}
          size='lg'
        />
      </div>

      <Button
        className='w-full font-semibold tracking-tight py-6 text-lg'
        radius='full'
        color='primary'
        startContent={<ZapIcon className="w-5 h-5" />}
        onPress={handleCreateLink}
        isDisabled={!amount || amount === '0' || showComingSoon}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={showComingSoon ? 'coming-soon' : 'create'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {showComingSoon ? '✨ Coming Soon' : 'Create Quick Payment Link'}
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  )
}

const AddressTab = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const address = "8KSUY3dYHPpNxkFaKxuHGJpBGEZaXtHPGGbYEYrEEJEF" // This will come from your wallet/state

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div>
      <div className='bg-background-600/60 rounded-xl p-4 flex flex-row items-center justify-between'>
        <p className='text-xl tracking-tight font-medium'>{shortenAddress(address)}</p>

        <div className='flex flex-row items-center gap-2'>
          <Button
            isIconOnly
            variant='light'
            radius='full'
            size='md'
          >
            <CopyIcon className='w-6 h-6 opacity-50' />
          </Button>
          <Button
            isIconOnly
            variant='light'
            radius='full'
            size='md'
            onPress={handleRefresh}
          >
            <motion.div
              animate={{
                rotate: isRefreshing ? [0, 360] : 0,
                scale: isRefreshing ? 1.2 : 1
              }}
              transition={{
                rotate: {
                  duration: 0.6,
                  ease: [0.175, 0.885, 0.32, 1.275],
                  times: [0, 1]
                },
                scale: {
                  type: "spring",
                  duration: 0.2,
                  stiffness: 400,
                  damping: 10
                }
              }}
            >
              <RotateCwIcon className='w-6 h-6 opacity-50' />
            </motion.div>
          </Button>
        </div>
      </div>
    </div>
  )
}