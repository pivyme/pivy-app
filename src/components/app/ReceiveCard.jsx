import { useAuth } from '@/providers/AuthProvider'
import { Button, Tab, Tabs } from '@heroui/react'
import { CopyIcon, ExternalLinkIcon, ZapIcon, RotateCwIcon, WalletCardsIcon, LinkIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Input } from '@heroui/react'
import AnimateComponent from '../elements/AnimateComponent'
import { motion, AnimatePresence } from 'framer-motion'
import { shortenAddress } from '@/utils/misc'

export default function ReceiveCard() {
  const { me } = useAuth()
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
    {
      id: 'address',
      label: 'Address',
      icon: <WalletCardsIcon className='w-4 h-4' />
    }
  ]

  const [selectedTab, setSelectedTab] = useState(TABS[0].id)

  console.log('me', me)

  return (
    <div className='nice-card p-4'>
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
    </div>
  )
}

const LinkTab = () => {
  const { me } = useAuth()

  const displayLink = `${me?.username}.pivy.me`
  const actualLink = `${me?.username}.${window.location.origin.replace('http://', '').replace('https://', '')}`
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
          >
            <CopyIcon className='w-6 h-6 opacity-50' />
          </Button>
          <Button
            isIconOnly
            variant='light'
            radius='full'
            size='md'
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
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateLink = () => {
    setIsCreating(true)
    // TODO: Implement link creation
    setTimeout(() => setIsCreating(false), 1000)
  }

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
        isLoading={isCreating}
        isDisabled={!amount || amount === '0'}
      >
        Create Quick Payment Link
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
    // TODO: Implement address refresh
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