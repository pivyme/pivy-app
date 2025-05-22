import React from 'react'
import { useParams } from 'react-router-dom'
import AnimateComponent from '@/components/elements/AnimateComponent'
import ColorCard from '@/components/elements/ColorCard'
import SpecialThemeBackground from '@/components/app/SpecialThemeBackground'
import ChainBadge from '@/components/app/receive/ChainBadge'
import PaymentSuccessView from '@/components/app/receive/PaymentSuccessView'
import CollabLogo from '@/components/app/receive/CollabLogo'
import LoadingView from '@/components/app/receive/LoadingView'
import ErrorView from '@/components/app/receive/ErrorView'
import ConnectedBadge from '@/components/app/receive/ConnectedBadge'
import PaymentDetail from '@/components/app/receive/PaymentDetail'
import ChainReceiveContent from '@/components/app/receive/ChainReceiveContent'
import { ReceiveProvider, useReceive } from '@/components/app/receive/ReceiveProvider'
import BounceButton from '@/components/elements/BounceButton'
import { ArrowRightIcon } from 'lucide-react'
import UsdcEvmPayment from '@/components/app/UsdcEvmPayment'
import { ConnectButton as SuiConnectButton } from '@suiet/wallet-kit'
import CreateOwnLinkBadge from '@/components/app/receive/CreateOwnLinkBadge'

function ReceiveContent() {
  const {
    stealthData,
    paymentSuccess,
    isInitializing,
    error,
    wallet,
    isUsdcMode,
    setIsUsdcMode,
    setAmount,
    amount,
    setPaymentSuccess,
    handleOpenWalletModal
  } = useReceive()

  const renderContent = () => {
    if (isInitializing) {
      return (
        <AnimateComponent delay={100}>
          <LoadingView />
        </AnimateComponent>
      )
    }

    if (error) {
      return (
        <AnimateComponent>
          <ErrorView error={error} />
        </AnimateComponent>
      )
    }

    if (paymentSuccess) {
      return (
        <div className='w-full'>
          <PaymentSuccessView
            paymentDetails={paymentSuccess}
            publicKey={wallet.publicKey}
            stealthData={stealthData}
          />
        </div>
      )
    }

    return (
      <ColorCard color={stealthData?.linkData?.backgroundColor} className='nice-card bg-gradient-to-br bg-background-500 p-4 w-full flex flex-col overflow-hidden'>
        <ConnectedBadge
          connected={wallet.connected}
          publicKey={wallet.publicKey}
          wallet={wallet}
          onDisconnect={() => wallet.disconnect()}
        />

        <div className='nice-card p-6 w-full flex flex-col'>
          {/* Payment details */}
          <AnimateComponent delay={200}>
            <PaymentDetail stealthData={stealthData} />
          </AnimateComponent>

          {wallet.connected ? (
            <div className='flex flex-col gap-6'>
              {/* Payment Method Selection */}
              <AnimateComponent delay={400}>
                <ChainReceiveContent />
              </AnimateComponent>
            </div>
          ) : (
            <AnimateComponent delay={400} className='w-full'>
              <div className="space-y-4">
                {isUsdcMode ? (
                  <div>
                    <div className="mb-6 flex items-center">
                      <button
                        onClick={() => setIsUsdcMode(false)}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 group"
                      >
                        <ArrowRightIcon className="w-4 h-4 rotate-180" />
                        <span>Back</span>
                      </button>
                    </div>
                    <UsdcEvmPayment
                      amount={amount}
                      setAmount={setAmount}
                      stealthData={stealthData}
                      onSuccess={(details) => {
                        console.log('USDC payment success:', details)
                        setPaymentSuccess(details)
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <BounceButton
                      className='tracking-tight font-semibold px-8 py-6 text-lg w-full'
                      radius='full'
                      size='md'
                      color='primary'
                      onPress={() => {
                        console.log('Connect button clicked')
                        handleOpenWalletModal()
                        setIsUsdcMode(false)
                      }}
                    >
                      Connect Wallet to continue
                    </BounceButton>

                    <div id='sui-connect-button' className='hidden'>
                      <SuiConnectButton />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 text-gray-500 bg-white">or</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsUsdcMode(true)}
                      className="w-full flex items-center justify-center gap-2 py-4 text-gray-600 hover:text-gray-900 transition-colors group"
                    >
                      <img
                        src="/tokens/usdc.png"
                        alt="USDC"
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium">Pay with USDC from any EVM chain</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  </>
                )}
              </div>
            </AnimateComponent>
          )}
          <AnimateComponent delay={700}>
            <div className='text-sm text-center text-gray-500 mt-8'>
              Secured by PIVY • Self-custodial payments
            </div>
          </AnimateComponent>
        </div>
      </ColorCard>
    )
  }

  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-center px-2 md:px-0'>
      <SpecialThemeBackground
        specialTheme={stealthData?.linkData?.specialTheme || 'default'}
      />
      <ChainBadge chain={stealthData?.sourceChain} />
      <div className='flex flex-col items-center w-full max-w-xl px-2 z-20 relative'>
        <CollabLogo specialTheme={stealthData?.linkData?.specialTheme} />
        {renderContent()}
      </div>
    </div>
  )
}

export default function ReceivePage({
  username: propUsername,
  tag: propTag
}) {
  const params = useParams()
  const username = propUsername || params.username
  const tag = propTag || params.tag || ""

  return (
    <ReceiveProvider username={username} tag={tag}>
      <ReceiveContent />
      <CreateOwnLinkBadge />
    </ReceiveProvider>
  )
}
