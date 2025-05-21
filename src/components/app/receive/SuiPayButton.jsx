import React, { useState } from 'react'
import BounceButton from '@/components/elements/BounceButton'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { deriveStealthPub, getPrivBytes, getPubBytes } from '@/lib/pivy-stealth/pivy-stealth-sui';
import bs58 from 'bs58';

export default function SuiPayButton({
  selectedToken,
  amount,
  stealthData,
  onSuccess,
  onError,
  className
}) {
  const [isPaying, setIsPaying] = useState(false)

  async function handlePay() {
    try {
      setIsPaying(true);

      console.log('paying with', selectedToken)
      console.log('stealthData', stealthData)

      const ephemeralKeypair = Ed25519Keypair.generate();
      const ephPriv = getPrivBytes(ephemeralKeypair);
      const ephPub58 = bs58.encode(getPubBytes(ephemeralKeypair))

      const stealthOwnerB58 = await deriveStealthPub(
        stealthData.metaSpendPub,
        stealthData.metaViewPub,
        ephPriv
      )

      console.log('stealthOwnerB58', stealthOwnerB58)


      // const sig = 'sig'
      // onSuccess?.(sig);
    } catch (e) {
      console.log('Payment failed:', e);
      onError?.(e);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <BounceButton
      className={`tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full ${className || ''}`}
      radius='full'
      size='lg'
      onPress={handlePay}
      isLoading={isPaying}
      isDisabled={isPaying || !selectedToken || !amount}
    >
      {isPaying ? '✨ Processing...' : (
        stealthData?.linkData?.type === 'DOWNLOAD'
          ? '🎁 Pay & Download'
          : '💰 Pay'
      )}
    </BounceButton>
  )
}
