import AnimateComponent from '@/components/elements/AnimateComponent'
import PolkadotBackground from '@/components/shared/PolkadotBackground'
import { useAuth } from '@/providers/AuthProvider'
import BounceButton from '@/components/elements/BounceButton'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ArrowRightIcon, ShieldIcon, SmileIcon, ZapIcon } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ConnectButton } from '@suiet/wallet-kit'
import { useWallet as useSuiWallet } from '@suiet/wallet-kit'
import ConnectWallet from '@/components/login/ConnectWallet'
import { WALLET_CHAINS } from '@/providers/AuthProvider'

const BENEFITS = [
  {
    text: 'Private',
    icon: <ShieldIcon className='text-[#16a34a] w-5 h-5' />,
    background: '#ddfde7',
  },
  {
    text: 'Fast',
    icon: <ZapIcon className='text-[#2663eb] w-5 h-5' />,
    background: '#dbeafe',
  },
  {
    text: 'Simple',
    icon: <SmileIcon className='text-[#9333eb] w-5 h-5' />,
    background: '#f3e8ff',
  }
]

const SHOWCASE_LINKS = [
  {
    username: "jeff",
    tag: "notion-templates",
    emoji: "📝",
    description: "Buy Notion templates crafted by Jeff for productivity"
  },
  {
    username: "sarah",
    tag: "design-resources",
    emoji: "🎨",
    description: "Get Sarah's premium UI design resources & templates"
  },
  {
    username: "mike",
    tag: "tip",
    emoji: "☕️",
    description: "Send a tip to support Mike's content creation"
  },
  {
    username: "emma",
    tag: "coaching",
    emoji: "🎯",
    description: "Book a personal coaching session with Emma"
  },
  {
    username: "alex",
    tag: "beats",
    emoji: "🎵",
    description: "Purchase exclusive beats produced by Alex"
  },
  {
    username: "lisa",
    tag: "presets",
    emoji: "📸",
    description: "Get Lisa's professional Lightroom presets"
  },
  {
    username: "james",
    tag: "ebook",
    emoji: "📚",
    description: "Download James' guide to web development"
  },
  {
    username: "maya",
    tag: "commission",
    emoji: "🖌️",
    description: "Commission a custom artwork from Maya"
  }
];

export default function LoginPage() {
  const { setVisible, visible } = useWalletModal();
  const { signIn, isSignedIn, walletChain } = useAuth();
  const { connected: solanaConnected } = useWallet();
  const { connected: suiConnected } = useSuiWallet();

  const [selectedChain, setSelectedChain] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = walletChain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;

  async function handleConnect() {
    setIsConnecting(true);
    if (isConnected) {
      await signIn();
    } else {
      setVisible(true);
    }
    setIsConnecting(false);
  }

  if (isConnected && isSignedIn) {
    return <Navigate to="/" replace />
  }

  return (
    <div className='w-full min-h-screen flex items-center justify-center'>
      <div className='flex flex-col items-center'>
        <AnimateComponent>
          <div className='flex flex-col items-center max-w-[36rem] text-center nice-card p-8'>
            {/* Logo */}
            <AnimateComponent delay={100}>
              <img src="/pivy-horizontal-logo.svg" alt="Pivy Logo" className='w-[10rem]' />
            </AnimateComponent>

            {/* Heading */}
            <AnimateComponent delay={200}>
              <h1 className='text-4xl font-bold tracking-tight mt-4'>
                Get Paid, Stay Private
              </h1>
            </AnimateComponent>

            {/* Description */}
            <AnimateComponent delay={300}>
              <p className='mt-4'>
                The self-custodial payment toolkit that keeps your real wallet <span className='font-semibold text-primary-600'>private</span> using <span className='font-semibold text-primary-600'>Stealth Addresses.</span>
              </p>
              <div className='mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100'>
                <span className='text-xs font-medium text-primary-700'>✨ Multi-Chain Stealth Addresses</span>
                <div className='w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse' />
              </div>
            </AnimateComponent>

            {/* Link Showcase */}
            <AnimateComponent delay={400}>
              <BadgePill />
            </AnimateComponent>
            
            {/* Connect Wallet */}
            <ConnectWallet />

          </div>
        </AnimateComponent>

        {/* Benefits */}
        <div className='flex flex-row items-center gap-5 mt-8'>
          {BENEFITS.map((benefit, index) => (
            <AnimateComponent
              key={index}
              delay={1000 + (index * 100)}
            >
              <div className='flex flex-col items-center'>
                <div className={`flex flex-col items-center rounded-full p-3`}
                  style={{ backgroundColor: benefit.background }}
                >
                  {benefit.icon}
                </div>
                <p className='mt-2 font-semibold tracking-tight'>{benefit.text}</p>
              </div>
            </AnimateComponent>
          ))}
        </div>
      </div>
    </div>
  )
}

const BadgePill = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SHOWCASE_LINKS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentLink = SHOWCASE_LINKS[currentIndex];

  return (
    <div className="flex flex-col items-center gap-3 mt-8 bg-background-500 p-8 rounded-2xl">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
            duration: 0.3
          }}
          className="flex flex-col items-center gap-2"
        >
          {/* Emoji */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 8 }}
            className="text-4xl"
          >
            {currentLink.emoji}
          </motion.div>

          {/* Link Preview */}
          <div className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 px-4 py-2 rounded-full flex items-center gap-2">
            <motion.span className="text-gray-500 font-medium">
              pivy.me/
            </motion.span>
            <motion.span
              className="text-primary-600 font-semibold"
              layoutId="username"
              layout
            >
              {currentLink.username}
            </motion.span>
            {currentLink.tag && (
              <>
                <motion.span className="text-gray-500 font-medium">/</motion.span>
                <motion.span
                  className="text-gray-700 font-semibold"
                  layoutId="tag"
                  layout
                >
                  {currentLink.tag}
                </motion.span>
              </>
            )}
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-gray-600 font-medium"
          >
            {currentLink.description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="flex gap-1.5 mt-2">
        {SHOWCASE_LINKS.map((_, index) => (
          <motion.div
            key={index}
            className={`w-1.5 h-1.5 rounded-full ${index === currentIndex ? "bg-primary-500" : "bg-gray-200"
              }`}
            initial={false}
            animate={{
              scale: index === currentIndex ? 1.3 : 1,
              backgroundColor: index === currentIndex ? "#2663eb" : "#e5e7eb"
            }}
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>
    </div>
  );
};

