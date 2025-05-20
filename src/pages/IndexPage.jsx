import {
  ArrowUpRight,
  Shield,
  Zap,
  Wallet,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Key,
  FileText,
  LinkIcon,
  BarChart,
  Twitter,
  Menu,
  X,
} from "lucide-react"
import AnimateComponent from "@/components/elements/AnimateComponent"
import { motion, AnimatePresence } from "framer-motion"
import PolkadotBackground from "@/components/shared/PolkadotBackground"
import { useState, useEffect } from "react"
import ColorCard from "@/components/elements/ColorCard"
import { CONFIG } from "@/config"
import { useElementInView } from "@/hooks/useElementInView"
import BounceButton from "@/components/elements/BounceButton"

import { useNavigate } from "react-router"

const SHOWCASE_EXAMPLES = [
  {
    emoji: "👨‍💻",
    username: "alex",
    tag: "web-design",
    description: "Freelance Web Design Project",
    accent: "#7efe9f",
  },
  {
    emoji: "🎨",
    username: "sarah",
    tag: "artwork",
    description: "Digital Art Commission",
    accent: "#64c6ff",
  },
  {
    emoji: "📱",
    username: "mike",
    tag: "app-dev",
    description: "Mobile App Development",
    accent: "#a04eff",
  },
  {
    emoji: "✍️",
    username: "emma",
    tag: "content",
    description: "Content Writing Package",
    accent: "#ffcd6c",
  },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Compare", href: "#compare" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => item.href.substring(1))
      const currentSection = sections.find(section => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          return rect.top <= 100 && rect.bottom >= 100
        }
        return false
      })
      setActiveSection(currentSection || "")
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial position
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (href) => {
    const id = href.substring(1)
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Height of navbar + some padding
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
    setIsOpen(false)
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.a
            href="/"
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/pivy-horizontal-logo.svg" alt="PIVY" className="h-8" />
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(item.href)
                }}
                className={`text-gray-600 font-medium transition-colors relative ${activeSection === item.href.substring(1) ? "text-primary-600" : "hover:text-primary-600"
                  }`}
                whileHover={{
                  scale: 1.1,
                  transition: { type: "spring", stiffness: 400 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                {item.name}
                {activeSection === item.href.substring(1) && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-600 rounded-full"
                    layoutId="activeSection"
                  />
                )}
              </motion.a>
            ))}
          </div>

          {/* Social Links & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <motion.a
              href={CONFIG.TWITTER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-600 hover:text-[#1DA1F2] font-medium p-2 rounded-full hover:bg-[#1DA1F2]/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter className="w-5 h-5" />
              <span className="hidden sm:inline">Follow us</span>
            </motion.a>

            {/* Mobile Menu Button */}
            <motion.button
              className="p-2 md:hidden rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className={`block py-2 transition-colors ${activeSection === item.href.substring(1)
                    ? "text-primary-600 bg-primary-50 px-4 rounded-lg"
                    : "text-gray-600 hover:text-primary-600"
                    }`}
                  whileHover={{ x: 10 }}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection(item.href)
                  }}
                >
                  {item.name}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

function HeroShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SHOWCASE_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentExample = SHOWCASE_EXAMPLES[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-white/80 backdrop-blur-sm p-8 rounded-3xl">
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
          className="flex flex-col items-center gap-4"
        >
          {/* Emoji */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 8 }}
            className="text-6xl"
          >
            {currentExample.emoji}
          </motion.div>

          {/* Link Preview */}
          <div className="bg-white shadow-lg border-2 border-gray-100 px-6 py-3 rounded-full flex items-center gap-3">
            <motion.span className="text-xl text-gray-400 font-medium">
              pivy.me/
            </motion.span>
            <motion.span
              className="text-xl text-primary-600 font-bold"
              layoutId="username"
              layout
            >
              {currentExample.username}
            </motion.span>
            <motion.span className="text-xl text-gray-400 font-medium">/</motion.span>
            <motion.span
              className="text-xl text-gray-800 font-bold"
              layoutId="tag"
              layout
            >
              {currentExample.tag}
            </motion.span>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-lg text-gray-600 font-medium text-center"
          >
            {currentExample.description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="flex gap-2 justify-center mt-6">
        {SHOWCASE_EXAMPLES.map((_, index) => (
          <motion.div
            key={index}
            className="w-2 h-2 rounded-full"
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
}

function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative flex flex-col items-center justify-center text-center gap-8 pt-28 pb-20 w-full max-w-5xl mx-auto px-4">
      <AnimateComponent>
        <motion.img
          src="/pivy-horizontal-logo.svg"
          alt="PIVY"
          className="w-[200px] mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimateComponent>

      <AnimateComponent>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center bg-primary-100 text-primary-900 px-5 py-2 rounded-full text-sm font-medium cursor-pointer relative"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          The First Ever Stealth Address Implementation on Solana
          <motion.div
            className="absolute -z-10 inset-0 bg-primary-200/30 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </AnimateComponent>

      <AnimateComponent delay={100}>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-tight relative">
          <span className="inline-block">Get Paid,{" "}</span>
          <span className="text-primary-600 relative inline-block">
            Stay Private
            <svg
              className="absolute -bottom-3 left-0 w-full"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M2 10C50.5 4 148.5 -2.5 298 4.5"
                stroke="#7efe9f"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </svg>
          </span>
          <motion.div
            className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-100/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </h1>
      </AnimateComponent>

      <AnimateComponent delay={200}>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          The self-custodial payment toolkit for Solana that keeps your real wallet private using Stealth Addresses.
        </p>
      </AnimateComponent>

      <HeroShowcase />

      <AnimateComponent delay={300}>
        <div className="flex gap-4 mt-4">
          <BounceButton
            className="tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full"
            radius="full"
            size="lg"
            endContent={<ArrowRight className="w-5 h-5" />}
            onPress={() => navigate("/app")}
          >
            Get Started
          </BounceButton>
        </div>
      </AnimateComponent>
    </section>
  )
}

function IntroSection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  return (
    <section ref={ref} className="py-24 w-full">
      <div className="max-w-5xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white border-2 border-gray-100 rounded-3xl p-12 text-center shadow-sm"
          >
            <span className="text-5xl leading-none text-primary-300 font-serif">&ldquo;</span>
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                ✨ Introduction
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Solana&apos;s <span className="text-primary-600">missing puzzle piece</span>:
                <br />
                Private payments that don&apos;t compromise on UX
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              PIVY combines the privacy of stealth addresses with the simplicity of payment links. No more choosing
              between <span className="font-medium">privacy</span> and <span className="font-medium">convenience</span>{" "}
              — now you can have both in one seamless package.
            </p>
            <span className="text-5xl leading-none text-primary-300 font-serif">&ldquo;</span>
          </motion.div>
        </AnimateComponent>
      </div>
    </section>
  )
}

function KnowMoreSection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  const ITEMS = [
    {
      title: "PIVY IT UP Music!",
      description: "Experience PIVY's vision and mission through our catchy music video",
      thumbnail: "/pivy-deck.png",
      link: "https://youtu.be/rTvB1pWx8Lo",
      color: "from-purple-500/20 to-blue-500/20"
    },
    {
      title: "Technical Demo",
      description: "Deep dive into PIVY's technical implementation and features",
      thumbnail: "/pivy-technical-overview.png",
      link: "https://youtu.be/0xSycmjG4tI?si=JZuyX3hFo_-65vkJ",
      color: "from-green-500/20 to-blue-500/20"
    },
  ]

  return (
    <section ref={ref} className="py-24 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              🎥 Learn More
            </div>
            <h2 className="text-4xl font-bold mb-4">Discover PIVY</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch these <span className="font-semibold">engaging videos</span> to understand how PIVY is revolutionizing private payments on Solana
            </p>
          </div>
        </AnimateComponent>

        <div className="grid md:grid-cols-2 gap-8">
          {ITEMS.map((item, index) => (
            <AnimateComponent show={inView} key={index} delay={index * 100}>
              <motion.a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex flex-col bg-white border-2 border-gray-100 hover:border-primary-200 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <div className="bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
                      <span className="text-sm font-medium text-primary-600">Watch Video</span>
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[9px] border-l-primary-600 border-b-[6px] border-b-transparent ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-primary-600 font-medium">
                  <span>Learn More</span>
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

        <AnimateComponent show={inView} delay={200}>
          <motion.a
            href="https://youtu.be/gy2Y3uSIMFg?si=slJmc6t_AI3bzf9K"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-12 mx-auto max-w-2xl block group bg-white border-2 border-gray-100 hover:border-primary-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">Want to dive deeper?</span>
                <span className="text-xl font-bold text-gray-900">See Deck Presentation</span>
              </div>
              <motion.div
                className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600"
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 10, 0] }}
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
      </div>
    </section>
  )
}

function FeaturesSection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  const features = [
    {
      icon: Shield,
      title: "Stealth Mode",
      description:
        "Each payment goes to a unique, one-time self-custodial stealth address, unlinkable on-chain, keeping real wallets hidden.",
      color: {
        accent: "#A78BFA",
        light: "#EDE9FE"
      }
    },
    {
      icon: Zap,
      title: "Effortless Transaction",
      description:
        "PIVY turns every payment into a complete transaction in one link. Auto-tagged, recorded, and instantly followed by digital delivery.",
      color: {
        accent: "#34D399",
        light: "#D1FAE5"
      }
    },
    {
      icon: ArrowUpRight,
      title: "Cross-Chain Payment",
      description:
        "Accept USDC payments from any CCTP-supported chain. No bridges. No wrappers. No slippage. Grow Solana liquidity.",
      color: {
        accent: "#60A5FA",
        light: "#DBEAFE"
      }
    },
    {
      icon: Wallet,
      title: "Protected from Dusts",
      description:
        "Your main wallet stays isolated and activity stays private. No more dust tokens spamming your wallet.",
      color: {
        accent: "#F472B6",
        light: "#FCE7F3"
      }
    },
  ]

  return (
    <section ref={ref} className="py-24 w-full relative">
      <div className="max-w-6xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              🚀 Features
            </div>
            <h2 className="text-4xl font-bold">PIVY Fix It!</h2>
          </div>
        </AnimateComponent>

        <div className="grid sm:grid-cols-2 gap-8 relative">
          {features.map((feature, index) => (
            <AnimateComponent key={feature.title} show={inView} delay={index * 100}>
              <motion.div
                className="bg-white backdrop-blur-sm border-2 rounded-3xl p-6 sm:p-8 h-full shadow-sm group relative cursor-pointer"
                style={{
                  borderColor: feature.color.light,
                }}
                initial={false}
                whileHover={{
                  scale: 1.03,
                  rotate: 1,
                  translateY: -8,
                  borderColor: feature.color.accent,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                  duration: 0.2
                }}
              >
                <motion.div
                  className="flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-2xl mb-4 sm:mb-6 relative"
                  style={{
                    backgroundColor: feature.color.light,
                    color: feature.color.accent
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                >
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ backgroundColor: feature.color.accent }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
                <motion.h3
                  className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3"
                  style={{ color: feature.color.accent }}
                  whileHover={{ scale: 1.02 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                    duration: 0.1
                  }}
                >
                  {feature.title}
                </motion.h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>

                {/* Hover glow effect */}
                <div
                  className="absolute inset-0 -z-10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${feature.color.light}, transparent 70%)`
                  }}
                />
              </motion.div>
            </AnimateComponent>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  const problems = [
    {
      title: "Privacy Concerns",
      description: "Anyone can trace your public wallet and see what you earn, compromising your financial privacy.",
      icon: AlertTriangle,
    },
    {
      title: "Messy Payments",
      description: "Freelancer payments are chaotic with wrong references, delayed invoices, and manual bookkeeping.",
      icon: AlertTriangle,
    },
    {
      title: "Custodial Control",
      description: "Payment gateways hold your funds and charge high fees, defeating the purpose of self-sovereignty.",
      icon: AlertTriangle,
    },
  ]

  return (
    <section ref={ref} className="py-24 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              🎯 Problems
            </div>
            <h2 className="text-4xl font-bold">Problems We Solve</h2>
          </div>
        </AnimateComponent>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <AnimateComponent key={problem.title} show={inView} delay={index * 100}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white border-2 border-gray-100 rounded-3xl p-8 h-full shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-6">
                  <problem.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{problem.title}</h3>
                <p className="text-gray-600">{problem.description}</p>
              </motion.div>
            </AnimateComponent>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  const steps = [
    {
      title: "Connect Your Wallet",
      description:
        "Connect Phantom/Solflare or import a secret phrase. PIVY generates a Meta Address (public spending key + encrypted viewing key).",
      points: ["Your keys stay in your wallet", "No custody, full control"],
      icon: Key,
      color: {
        accent: "#A78BFA",
        light: "#EDE9FE"
      }
    },
    {
      title: "Create Payment Link",
      description:
        "Create a labeled payment link with fixed or open amount. Optionally add a digital download for file delivery.",
      points: ["Customizable payment amounts", "Support for digital downloads"],
      icon: LinkIcon,
      color: {
        accent: "#34D399",
        light: "#D1FAE5"
      }
    },
    {
      title: "Share Your Link",
      description: "Share your human-readable link (e.g., pivy.me/john/xiro-website) with clients or customers.",
      points: ["Human-readable payment links", "QR codes for in-person payments"],
      icon: ArrowUpRight,
      color: {
        accent: "#60A5FA",
        light: "#DBEAFE"
      }
    },
    {
      title: "Receive Payment",
      description:
        "Client follows link, sees checkout card, and pays. Funds go directly to your stealth address, never in PIVY custody.",
      points: ["Real-time payment notifications", "Automatic file delivery for digital goods"],
      icon: Wallet,
      color: {
        accent: "#F472B6",
        light: "#FCE7F3"
      }
    },
  ]

  return (
    <section ref={ref} className="py-24 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <div className="text-center mb-16 lg:mb-24">
            <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              ⚡️ Process
            </div>
            <h2 className="text-4xl font-bold">How It Works</h2>
          </div>
        </AnimateComponent>

        <div className="space-y-16 lg:space-y-32">
          {steps.map((step, index) => (
            <AnimateComponent key={step.title} show={inView} delay={index * 100}>
              <motion.div
                whileHover={{
                  scale: 1.02,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                    duration: 0.2
                  }
                }}
                className={`flex flex-col gap-8 items-center ${index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"}`}
              >
                <div className="w-full lg:w-1/2 relative">
                  <div className="flex items-start gap-4 mb-6 relative">
                    <motion.div
                      className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-full font-bold text-xl relative"
                      style={{
                        backgroundColor: step.color.light,
                        color: step.color.accent,
                        borderWidth: 2,
                        borderColor: step.color.accent
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -5, 5, 0],
                        transition: {
                          duration: 0.3,
                          ease: "easeOut"
                        }
                      }}
                    >
                      {index + 1}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: step.color.accent }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                    <div className="flex-1">
                      <h3
                        className="text-2xl sm:text-3xl font-bold mb-2"
                        style={{ color: step.color.accent }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-base sm:text-lg">{step.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3 pl-[4.5rem]">
                    {step.points.map((point, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle
                          className="h-5 w-5 mt-0.5 flex-shrink-0"
                          style={{ color: step.color.accent }}
                        />
                        <span className="text-sm sm:text-base">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div
                  whileHover={{
                    scale: 1.03,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                      duration: 0.2
                    }
                  }}
                  className="w-full lg:w-1/2 h-[250px] sm:h-[300px] rounded-3xl flex items-center justify-center relative overflow-hidden group border-2"
                  style={{
                    backgroundColor: step.color.light,
                    borderColor: step.color.accent,
                  }}
                >
                  <div className="flex flex-col items-center justify-center relative z-10">
                    <motion.div
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -10, 10, 0],
                        transition: {
                          duration: 0.3,
                          ease: "easeOut"
                        }
                      }}
                    >
                      <step.icon
                        className="w-12 h-12 sm:w-16 sm:h-16 mb-4 transition-transform"
                        style={{ color: step.color.accent }}
                      />
                    </motion.div>
                    <span
                      className="font-medium text-sm sm:text-base"
                      style={{ color: step.color.accent }}
                    >
                      Step {index + 1}
                    </span>
                  </div>
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${step.color.accent}10, transparent 70%)`
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </motion.div>
            </AnimateComponent>
          ))}
        </div>
      </div>
    </section>
  )
}

function UseCasesSection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  const useCases = [
    {
      title: "Freelancers",
      description: "Create payment links for each client project with automatic labeling and tracking.",
      icon: FileText,
    },
    {
      title: "Content Creators",
      description: "Sell digital downloads directly to your audience with automatic delivery.",
      icon: Zap,
    },
    {
      title: "KOLs & Influencers",
      description: "Generate campaign-specific payment links for brand partnerships while keeping earnings private.",
      icon: ArrowUpRight,
    },
    {
      title: "Small Businesses",
      description: "Accept Solana payments with detailed analytics and reporting for your business.",
      icon: BarChart,
    },
  ]

  return (
    <section ref={ref} className="py-24 w-full bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              👥 Use Cases
            </div>
            <h2 className="text-4xl font-bold">Who Uses PIVY</h2>
          </div>
        </AnimateComponent>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <AnimateComponent key={useCase.title} show={inView} delay={index * 100}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white border-2 border-gray-100 rounded-3xl p-6 h-full shadow-sm hover:border-primary-200 transition-all group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 mb-4 group-hover:bg-primary-200 transition-all">
                  <useCase.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                <p className="text-gray-600">{useCase.description}</p>
              </motion.div>
            </AnimateComponent>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonSection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  return (
    <section ref={ref} className="py-24 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              🏆 Comparison
            </div>
            <h2 className="text-4xl font-bold">Why PIVY Wins</h2>
          </div>
        </AnimateComponent>

        <AnimateComponent show={inView} delay={100}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="overflow-hidden rounded-3xl border-2 border-gray-100 bg-white shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-4 text-left font-medium text-gray-600">Option</th>
                    <th className="p-4 text-left font-medium text-gray-600">Shortfall</th>
                    <th className="p-4 text-left font-medium text-gray-600">Why PIVY wins</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">
                      <div className="font-medium">Raw Solana Pay links</div>
                    </td>
                    <td className="p-4 text-gray-600">Public address, no labels, no fulfilment.</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary-100 p-1 text-primary-700">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <span>Adds stealth + UX + goods delivery.</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">
                      <div className="font-medium">Custodial crypto gateways</div>
                    </td>
                    <td className="p-4 text-gray-600">Hold funds, KYC, high fees.</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary-100 p-1 text-primary-700">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <span>100% self-custodial, low fees.</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">
                      <div className="font-medium">Privacy chains (Monero)</div>
                    </td>
                    <td className="p-4 text-gray-600">Off-ecosystem, no SPL/NFT support.</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary-100 p-1 text-primary-700">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <span>Native to Solana, instant finality.</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </AnimateComponent>
      </div>
    </section>
  )
}

function CTASection() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })
  const navigate = useNavigate()

  return (
    <section ref={ref} className="py-24 w-full backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4">
        <AnimateComponent show={inView}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white border-2 border-gray-100 rounded-3xl p-12 text-center shadow-sm"
          >
            <motion.img
              src="/pivy-square-logo.svg"
              alt="PIVY"
              className="w-16 h-16 mx-auto mb-6"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1 }}
            />
            <div className="inline-flex items-center bg-primary-100 text-primary-900 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              🚀 Get Started
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Paid Privately?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Drop one PIVY link, get paid privately on Solana—perfect for freelancers, creators, and KOLs who want
              money in their own wallet, not a middleman&apos;s.
            </p>
            <div className="flex flex-wrap justify-center gap-4">

              <BounceButton
                className="tracking-tight font-bold px-8 py-3.5 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full"
                radius="full"
                size="lg"
                endContent={<ArrowRight className="w-5 h-5" />}
                onPress={() => navigate("/app")}
              >
                Get Started
              </BounceButton>
            </div>
          </motion.div>
        </AnimateComponent>
      </div>
    </section>
  )
}

function Footer() {
  const { ref, inView } = useElementInView({
    margin: "0% 0% -50% 0%",
    once: true,
  })

  return (
    <footer ref={ref} className="border-t border-gray-200 bg-white py-12">
      <div className="container mx-auto px-4">
        <AnimateComponent show={inView}>
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">PIVY</span>
            </div>

            <div className="flex gap-8">
              <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
                Features
              </a>
              <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
                How It Works
              </a>
              <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
                Pricing
              </a>
              <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
                FAQ
              </a>
              <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
                Contact
              </a>
            </div>

            <div className="text-sm text-gray-500">© 2025 PIVY. All rights reserved.</div>
          </div>
        </AnimateComponent>
      </div>
    </footer>
  )
}

export default function IndexPage() {
  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      <Navbar />
      <HeroSection />
      <IntroSection />
      <KnowMoreSection />
      <section id="features">
        <FeaturesSection />
      </section>
      <ProblemSection />
      <section id="how-it-works">
        <HowItWorksSection />
      </section>
      <section id="use-cases">
        <UseCasesSection />
      </section>
      <section id="compare">
        <ComparisonSection />
      </section>
      <CTASection />
      <Footer />
    </div>
  )
}
