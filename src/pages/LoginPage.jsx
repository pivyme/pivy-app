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
import { useWallet as useSuiWallet } from '@suiet/wallet-kit'
import ConnectWallet from '@/components/login/ConnectWallet'
import { WALLET_CHAINS } from '@/providers/AuthProvider'
import ColorCard from '@/components/elements/ColorCard'

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
  const { signIn, isSignedIn, walletChain } = useAuth();
  const { connected: solanaConnected } = useWallet();
  const { connected: suiConnected } = useSuiWallet();

  const isConnected = walletChain === WALLET_CHAINS.SOLANA ? solanaConnected : suiConnected;

  if (isConnected && isSignedIn) {
    return <Navigate to="/" replace />
  }

  let topPadding = "pt-[8rem]";
  if (walletChain === "SUI") {
    topPadding = "pt-[8rem]";
  }

  return (
    <div className={`w-full min-h-screen flex items-center px-4 md:px-0 justify-center pb-[10rem] ${topPadding}`}>
      <div className='w-full max-w-[80rem] mx-auto nice-card'>
        <div className='grid grid-cols-12 gap-4 p-4'>
          {/* Left Part */}
          <div className='col-span-12 md:col-span-6 p-4 md:p-8'>
            <div className='flex flex-col items-center text-center'>
              <AnimateComponent>
                <img src="/pivy-horizontal-logo.svg" alt="Pivy Logo" className='w-[6rem]' />
              </AnimateComponent>

              <AnimateComponent delay={200}>
                <h1 className='text-2xl md:text-3xl font-bold tracking-tight mt-2'>
                  Get Paid, Stay Private
                </h1>
              </AnimateComponent>

              <AnimateComponent delay={300}>
                <p className='mt-4 text-sm md:text-base'>
                  The self-custodial payment toolkit that keeps your real wallet <span className='font-semibold text-primary-600'>private</span> using <span className='font-semibold text-primary-600'>Stealth Addresses.</span>
                </p>
                <div className='mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100'>
                  <span className='text-xs font-medium text-primary-700'>
                    {walletChain === "SOLANA"
                      ? "✨ The First Ever Stealth Address Implementation on Solana"
                      : walletChain === "SUI"
                        ? "✨ The First Ever Stealth Address Implementation on SUI"
                        : "✨ Multi-Chain Stealth Addresses"
                    }
                  </span>
                  <div className='w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse' />
                </div>
              </AnimateComponent>

              <AnimateComponent delay={400}>
                <BadgePill />
              </AnimateComponent>

              <AnimateComponent delay={500}>
                <ConnectWallet />
              </AnimateComponent>

              {walletChain === WALLET_CHAINS.SOLANA && (
                <AnimateComponent delay={200}>
                  <div className='flex flex-col gap-2'>
                    <div className="mt-4 px-4 py-3 bg-yellow-50/80 border border-yellow-200 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-700">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span>🎮 Currently live on Devnet</span>
                      </div>
                      <p className="mt-1 text-sm text-yellow-600 text-center">
                        Don&apos;t worry about funds! We&apos;ll hook you up with some SOL and USDC to play with when you register. Let&apos;s PIVY IT UP!
                        <br /><br />
                        Don&apos;t forget to set your wallet to Devnet!
                      </p>
                    </div>
                    <div className="px-4 py-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-700 mb-2">
                          <span>🔒</span>
                          <span>Enhanced Security Update</span>
                        </div>
                        <p className="text-xs text-blue-600 leading-relaxed">
                          We recently completed a major security overhaul of our stealth address implementation to ensure
                          fully self-custodial privacy. As part of this enhancement, our database was reset,
                          so previously created accounts will need to be recreated.
                          <br /><br />
                          Thank you for your understanding!
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimateComponent>
              )}

              {walletChain === WALLET_CHAINS.SUI && (
                <AnimateComponent delay={200}>
                  <div className="mt-4 space-y-3">
                    <div className="px-4 py-3 bg-yellow-50/80 border border-yellow-200 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-700">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span>🎮 Currently live on Sui Testnet</span>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-700 mb-2">
                          <span>🔒</span>
                          <span>Enhanced Security Update</span>
                        </div>
                        <p className="text-xs text-blue-600 leading-relaxed">
                          We recently completed a major security overhaul of our stealth address implementation to ensure
                          fully self-custodial privacy. As part of this enhancement, our database was reset,
                          so previously created accounts will need to be recreated.
                          <br /><br />
                          Thank you for your understanding!
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimateComponent>
              )}
            </div>
          </div>

          {/* Right Part */}
          <div className='nice-card shadow-none bg-[#00000003] col-span-12 md:col-span-6 p-4'>
            <div className='flex flex-col w-full h-full'>
              <AnimateComponent delay={700}>
                <KnowMoreCard />
              </AnimateComponent>

              <AnimateComponent delay={800}>
                <div className='flex flex-col items-center text-center mt-8 nice-card p-4 px-8 w-fit mx-auto'>
                  <div className='font-medium tracking-tight text-sm'>
                    As seen on
                  </div>
                  <a
                    href="https://id.beincrypto.com/stealth-address-solusi-privasi-dalam-crypto-payment/?utm_source=telegram&utm_medium=social"
                    target="_blank" rel="noopener noreferrer"
                    className='mt-2'
                  >
                    <img src="/beincrypto.svg" alt="BeInCrypto" className='w-[10rem]' />
                  </a>
                </div>
              </AnimateComponent>

              {/* Benefits */}
              <div className='flex flex-row items-center gap-3 md:gap-5 mt-auto mx-auto pt-8'>
                {BENEFITS.map((benefit, index) => (
                  <AnimateComponent
                    key={index}
                    delay={900 + (index * 100)}
                  >
                    <div className='flex flex-col items-center'>
                      <div className={`flex flex-col items-center rounded-full p-2 md:p-3`}
                        style={{ backgroundColor: benefit.background }}
                      >
                        {benefit.icon}
                      </div>
                      <p className='mt-2 text-xs md:text-sm font-semibold tracking-tight'>{benefit.text}</p>
                    </div>
                  </AnimateComponent>
                ))}
              </div>
            </div>
          </div>
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


const KnowMoreCard = () => {
  const { walletChain } = useAuth();

  const CHAIN_CONTENT = {
    SOLANA: {
      items: [
        {
          title: "PIVY IT UP Music!",
          description: "See what PIVY's is all about",
          thumbnail: "/pivy-deck.png",
          link: "https://youtu.be/rTvB1pWx8Lo",
        },
        {
          title: "Technical Demo",
          description: "See PIVY's technical overview",
          thumbnail: "/pivy-technical-overview.png",
          link: "https://youtu.be/0xSycmjG4tI?si=JZuyX3hFo_-65vkJ",
        },
      ],
      deckLink: "https://youtu.be/gy2Y3uSIMFg?si=slJmc6t_AI3bzf9K"
    },
    SUI: {
      items: [
        {
          title: "PIVY IT UP Music!",
          description: "See what PIVY's is all about",
          thumbnail: "/pivy-sui-deck.png",
          link: "https://youtu.be/QsfO6NwlU2I?si=shbZk5gD9wWMawcw",
        },
        {
          title: "Technical Demo",
          description: "See PIVY's technical overview",
          thumbnail: "/pivy-technical-overview-sui.png",
          link: "https://youtu.be/tMwPvAOQlvE?si=S_ObxwuGE0RgSoHm",
        },
      ],
      deckLink: "https://youtu.be/rv9xII407GM?si=W8a1d7sU3ueW7npj"
    }
  };

  const chainContent = CHAIN_CONTENT[walletChain];
  if (!chainContent) return null;

  return (
    <div className='rounded-xl shadow-sm'>
      <AnimateComponent delay={100}>
        <div className='text-center mb-4'>
          <h3 className='text-xl font-bold'>Discover More</h3>
          <p className='text-sm text-gray-500'>Watch these videos about PIVY on {walletChain === "SOLANA" ? "Solana" : "SUI"}</p>
        </div>
      </AnimateComponent>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {chainContent.items.map((item, index) => (
          <AnimateComponent key={index} delay={200 + (index * 100)}>
            <motion.a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='block p-3 rounded-2xl border bg-white hover:border-primary-200 transition-all'
            >
              <div className='relative aspect-video rounded-lg overflow-hidden mb-2'>
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className='w-full h-full object-cover'
                />
                <div className='absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center'>
                  <span className='text-white text-sm font-medium bg-black/50 backdrop-blur-sm rounded-full px-4 py-2'>Watch Video →</span>
                </div>
              </div>
              <h4 className='font-semibold text-sm'>{item.title}</h4>
              <p className='text-xs text-gray-500'>{item.description}</p>
            </motion.a>
          </AnimateComponent>
        ))}
      </div>

      <AnimateComponent delay={400}>
        <motion.a
          href={chainContent.deckLink}
          target="_blank"
          rel="noopener noreferrer"
          className='mt-4 block text-center p-2 text-sm bg-primary/40 hover:bg-primary/50 rounded-2xl transition-colors text-black font-semibold'
          whileHover={{ scale: 1.01 }}
        >
          View Deck Presentation →
        </motion.a>
      </AnimateComponent>
    </div>
  );
}