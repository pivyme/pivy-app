import AnimateComponent from '@/components/elements/AnimateComponent'
import PolkadotBackground from '@/components/shared/PolkadotBackground'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@heroui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ShieldIcon, SmileIcon, ZapIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Navigate } from 'react-router'

const BENEFITS = [
  {
    text: 'Private',
    icon: <ShieldIcon className='text-[#16a34a] w-8 h-8' />,
    background: '#ddfde7',
  },
  {
    text: 'Fast',
    icon: <ZapIcon className='text-[#2663eb] w-8 h-8' />,
    background: '#dbeafe',
  },
  {
    text: 'Simple',
    icon: <SmileIcon className='text-[#9333eb] w-8 h-8' />,
    background: '#f3e8ff',
  }
]

export default function LoginPage() {
  const { setVisible, visible } = useWalletModal();
  const { signIn, isSignedIn } = useAuth();
  const { connected } = useWallet();


  const [isConnecting, setIsConnecting] = useState(false);
  async function handleConnect() {
    setIsConnecting(true);
    if (connected) {
      await signIn();
    } else {
      setVisible(true);
    }
    setIsConnecting(false);
  }


  console.log({
    isSignedIn,
    connected,
  })
  if (connected & isSignedIn) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className='w-full min-h-screen flex items-center justify-center'>
      <AnimateComponent>
        <div className='flex flex-col items-center max-w-[36rem] text-center nice-card p-8'>
          <AnimateComponent delay={200}>
            <img src="/pivy-horizontal-logo.svg" alt="Pivy Logo" className='w-[16rem]' />
          </AnimateComponent>

          <AnimateComponent delay={400}>
            <h1 className='text-4xl font-bold tracking-tight mt-4'>
              Get Paid, Stay Private
            </h1>
          </AnimateComponent>
          <AnimateComponent delay={500}>
            <p className='mt-4'>
              The self-custodial payment toolkit for Solana that keeps your real wallet <span className='font-semibold text-primary-600'>private.</span>
            </p>
          </AnimateComponent>

          {/* Benefits */}
          <div className='flex flex-row items-center gap-5 mt-8'>
            {BENEFITS.map((benefit, index) => (
              <AnimateComponent
                key={index}
                delay={(index * 100) + 600}
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

          {/* Connect Wallet */}
          <AnimateComponent delay={800}>
            <Button
              className='mt-8 tracking-tight font-semibold px-8 py-6 text-xl'
              radius='full'
              size='lg'
              color='primary'
              onPress={handleConnect}
              isLoading={isConnecting || visible}
            >
              {connected ? "Sign message to continue" : "Connect Wallet"}
            </Button>
          </AnimateComponent>
        </div>
      </AnimateComponent>
    </div>
  )
}
