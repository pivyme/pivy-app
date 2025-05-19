import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Zap, Wallet } from "lucide-react";
import AnimateComponent from "@/components/elements/AnimateComponent";

function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center gap-6 pt-24 pb-16 w-full max-w-5xl mx-auto px-4">
      <AnimateComponent>
        <span className="bg-primary-100 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium">
          ✨ The First Ever Stealth Address Implementation on Solana
        </span>
      </AnimateComponent>

      <AnimateComponent delay={100}>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Get Paid, Stay Private
        </h1>
      </AnimateComponent>

      <AnimateComponent delay={200}>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          The self-custodial payment toolkit for Solana that keeps your real wallet private using Stealth Addresses.
        </p>
      </AnimateComponent>

      <AnimateComponent delay={300}>
        <button className="mt-4 bg-primary-500 hover:bg-primary-600 text-gray-900 px-8 py-3 rounded-full font-semibold transition-all hover:scale-105">
          Get Started
        </button>
      </AnimateComponent>
    </section>
  );
}

function IntroSection() {
  return (
    <section className="py-20 w-full bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <AnimateComponent>
          <div className="nice-card p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              PIVY is the first ever private &quot;Pay Me&quot; link Solana never knew it needed.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From stealth addresses to cross-chain USDC to instant digital delivery. 
              Pivy fix everything Web3 payments got wrong.
            </p>
          </div>
        </AnimateComponent>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Stealth Mode",
      description: "Each payment goes to a unique, one-time self-custodial stealth address, unlinkable on-chain, keeping real wallets hidden."
    },
    {
      icon: Zap,
      title: "Effortless Transaction",
      description: "PIVY turns every payment into a complete transaction in one link. Auto-tagged, recorded, and instantly followed by digital delivery."
    },
    {
      icon: ArrowUpRight,
      title: "Cross-Chain Payment",
      description: "Accept USDC payments from any CCTP-supported chain. No bridges. No wrappers. No slippage. Grow Solana liquidity."
    },
    {
      icon: Wallet,
      title: "Protected from Dusts",
      description: "Your main wallet stays isolated and activity stays private. No more dust tokens spamming your wallet."
    }
  ];

  return (
    <section className="py-20 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <AnimateComponent>
          <h2 className="text-3xl font-bold text-center mb-4">PIVY Fix It!</h2>
        </AnimateComponent>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {features.map((feature, index) => (
            <AnimateComponent key={feature.title} delay={index * 100}>
              <div className="nice-card p-8 h-full">
                <feature.icon className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </AnimateComponent>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function IndexPage() {
  return (
    <div className="min-h-screen w-full bg-white">
      <HeroSection />
      <IntroSection />
      <FeaturesSection />
    </div>
  );
}
