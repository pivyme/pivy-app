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

  let topPadding = "pt-[12rem]";
  if (walletChain === "SUI") {
    topPadding = "pt-[12rem]";
  }

  return (
    <div className={`w-full min-h-screen flex items-center justify-center ${topPadding}`}>
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

            {/* Link Showcase */}
            <AnimateComponent delay={400}>
              <BadgePill />
            </AnimateComponent>

            {/* Connect Wallet */}
            <ConnectWallet />

            {/* Devnet Message */}
            {walletChain === WALLET_CHAINS.SOLANA && (
              <AnimateComponent delay={500}>
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
              </AnimateComponent>
            )}

          </div>
        </AnimateComponent>

        {/* Benefits */}
        <div className='flex flex-row items-center gap-5 mt-4'>
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

        {/* As Seen in */}
        <AnimateComponent delay={900}>
          <div className='flex flex-col items-center text-center mt-8 nice-card p-4 px-8'>
            <div className='font-medium tracking-tight text-lg'>
              As seen on
            </div>
            <a
              href="https://id.beincrypto.com/stealth-address-solusi-privasi-dalam-crypto-payment/?utm_source=telegram&utm_medium=social"
              target="_blank" rel="noopener noreferrer"
              className='mt-2'
            >
              <img src="/beincrypto.svg" alt="BeInCrypto" className='w-[12rem]' />
            </a>
          </div>
        </AnimateComponent>

        <KnowMoreCard />
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
  console.log('walletChain', walletChain);

  const CHAIN_CONTENT = {
    SOLANA: {
      items: [
        {
          title: "PIVY IT UP Music!",
          description: "See what PIVY's is all about",
          thumbnail: "/pivy-deck.png",
          link: "https://youtu.be/rTvB1pWx8Lo",
          color: "from-purple-500/20 to-blue-500/20"
        },
        {
          title: "Technical Demo",
          description: "See PIVY's technical overview",
          thumbnail: "/pivy-technical-overview.png",
          link: "https://youtu.be/0xSycmjG4tI?si=JZuyX3hFo_-65vkJ",
          color: "from-green-500/20 to-blue-500/20"
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
          color: "from-purple-500/20 to-blue-500/20"
        },
        {
          title: "Technical Demo",
          description: "See PIVY's technical overview",
          thumbnail: "/pivy-technical-overview-sui.png",
          link: "https://youtu.be/tMwPvAOQlvE?si=S_ObxwuGE0RgSoHm",
          color: "from-green-500/20 to-blue-500/20"
        },
      ],
      deckLink: "https://youtu.be/rv9xII407GM?si=W8a1d7sU3ueW7npj"
    }
  };

  const chainContent = CHAIN_CONTENT[walletChain];
  if (!chainContent) return null;

  return (
    <AnimateComponent delay={1000}>
      <ColorCard color='primary' className='rounded-3xl p-3 mt-12'>
        <div className='flex flex-col items-center max-w-[48rem] text-center nice-card p-8 rounded-2xl'>
          <AnimateComponent delay={1000}>
            <div className='flex flex-col items-center gap-2'>
              <div className='font-bold text-3xl text-black'>
                Discover More
              </div>
              <div className='text-gray-500 max-w-md -mt-2'>
                Watch these <span className='font-semibold'>sick music videos</span> to learn more about PIVY on {walletChain === "SOLANA" ? "Solana" : "SUI"}
              </div>
            </div>
          </AnimateComponent>

          <div className='grid grid-cols-2 md:grid-cols-2 gap-6 mt-8'>
            {chainContent.items.map((item, index) => (
              <AnimateComponent key={index} delay={1100 + (index * 100)}>
                <motion.a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='group flex flex-col items-center nice-card border border-gray-200 hover:border-primary-200 rounded-2xl p-5 bg-gradient-to-br hover:shadow-xl transition-all duration-300'
                >
                  <div className='relative w-full aspect-video rounded-xl overflow-hidden'>
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4'>
                      <div className='bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg'>
                        <span className='text-sm font-medium text-primary-600'>Watch Video</span>
                        <div className='w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center'>
                          <div className='w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-primary-600 border-b-[5px] border-b-transparent ml-0.5' />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='mt-4 text-center'>
                    <div className='font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
                      {item.title}
                    </div>
                    <div className='text-sm text-gray-500 mt-1'>
                      {item.description}
                    </div>
                  </div>

                  <div className='mt-4 flex items-center gap-2 font-medium'>
                    <span className='text-sm'>Learn More</span>
                    <motion.div
                      initial={{ x: 0 }}
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      →
                    </motion.div>
                  </div>
                </motion.a>
              </AnimateComponent>
            ))}
          </div>

          <AnimateComponent delay={1300}>
            <motion.a
              href={chainContent.deckLink}
              target="_blank"
              rel="noopener noreferrer"
              className='mt-8 group inline-flex items-center gap-3 px-6 py-3 rounded-xl hover:bg-primary/80 transition-all duration-300 bg-primary/30'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className='flex flex-col items-start'>
                <div className='text-sm font-medium text-gray-600'>Want to dive deeper?</div>
                <div className='font-semibold text-black flex items-center gap-2'>
                  See Deck Presentation
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    →
                  </motion.div>
                </div>
              </div>
            </motion.a>
          </AnimateComponent>
        </div>
      </ColorCard>
    </AnimateComponent>
  )
}