import React, { useState } from 'react'
import BounceButton from '@/components/elements/BounceButton'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { deriveStealthPub, encryptEphemeralPrivKey, getPrivBytes, getPubBytes, pad32, toBytes } from '@/lib/pivy-stealth/pivy-stealth-sui';
import bs58 from 'bs58';
import { useWallet as useSuiWallet } from '@suiet/wallet-kit';
import { CHAINS, isTestnet } from '@/config';
import { parseUnits } from 'viem';
import { SuiClient } from '@mysten/sui/client';

export default function SuiPayButton({
  selectedToken,
  amount,
  stealthData,
  onSuccess,
  onError,
  className
}) {
  const [isPaying, setIsPaying] = useState(false)

  const suiWallet = useSuiWallet()

  async function handlePay() {
    try {
      setIsPaying(true);

      const chain = isTestnet ? CHAINS.SUI_TESTNET : CHAINS.SUI_MAINNET;
      console.log('chain', chain)
      
      // Create SUI client
      const suiClient = new SuiClient({ url: chain.rpcUrl });

      console.log('paying with', selectedToken)
      console.log('stealthData', stealthData)
      console.log(suiWallet.chain)

      // Convert amount to smallest unit based on decimals
      const formattedAmount = parseUnits(amount.toString(), selectedToken.decimals)

      const ephemeralKeypair = Ed25519Keypair.generate();
      const ephPriv = getPrivBytes(ephemeralKeypair);
      const ephPub58 = bs58.encode(getPubBytes(ephemeralKeypair))

      console.log('ephPub58', ephPub58) // e.g. KXyuATsgp4nAQ39RkE7AwAatxj9XKfu8LS8wzRh3erT

      const stealthAddress = await deriveStealthPub(
        stealthData.metaSpendPub,
        stealthData.metaViewPub,
        ephPriv,
        stealthData.s
      )
      console.log('stealthAddress', stealthAddress)

      const encryptedMemo = await encryptEphemeralPrivKey(
        ephPriv,
        stealthData.metaViewPub
      )
      console.log('encryptedMemo', encryptedMemo)

      // Build stealth payment transaction
      const labelBytes = pad32(toBytes('testing'));
      const ephPubBytes = toBytes(ephPub58);
      const payloadBytes = toBytes(encryptedMemo);

      const payTx = new Transaction();

      let coinForStealth;
      if (selectedToken.isNative) {
        // For native SUI, we can split from gas
        [coinForStealth] = payTx.splitCoins(payTx.gas, [payTx.pure.u64(formattedAmount)]);
      } else {
        // For other tokens, we need to find the coin object first
        const coins = await suiClient.getCoins({
          owner: suiWallet.account.address,
          coinType: selectedToken.address
        });

        // Find a coin with sufficient balance
        const coin = coins.data.find(c => BigInt(c.balance) >= formattedAmount);
        if (!coin) {
          throw new Error('No coin with sufficient balance found');
        }

        // Split the found coin
        [coinForStealth] = payTx.splitCoins(coin.coinObjectId, [payTx.pure.u64(formattedAmount)]);
      }

      const target = `${chain.stealthProgramId}::pivy_stealth::pay`
      payTx.moveCall({
        target,
        typeArguments: [selectedToken.isNative ? '0x2::sui::SUI' : selectedToken.address],
        arguments: [
          coinForStealth,
          payTx.pure.address(stealthAddress.stealthSuiAddress),
          payTx.pure.vector('u8', Array.from(labelBytes)),
          payTx.pure.vector('u8', Array.from(ephPubBytes)),
          payTx.pure.vector('u8', Array.from(payloadBytes)),
        ],
      });

      const payRes = await suiWallet.signAndExecuteTransaction({
        transaction: payTx
      })

      const sig = payRes.digest;
      onSuccess?.(sig);
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
