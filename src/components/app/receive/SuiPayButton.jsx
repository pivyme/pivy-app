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
      const suiClient = new SuiClient({ url: chain.publicRpcUrl });

      console.log('paying with', selectedToken)
      console.log('stealthData', stealthData)
      console.log(suiWallet.chain)

      // Convert amount to smallest unit based on decimals
      console.log('Original amount:', amount, 'decimals:', selectedToken.decimals)
      const exactAmount = BigInt(Math.floor(parseFloat(amount) * (10 ** selectedToken.decimals)))
      console.log('Exact amount for transaction:', exactAmount.toString())

      // Validate the amount is not too large for u64
      const MAX_U64 = BigInt('18446744073709551615') // 2^64 - 1
      if (exactAmount > MAX_U64) {
        throw new Error('Amount too large for u64')
      }
      if (exactAmount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

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

      if (selectedToken.isNative) {
        // For native SUI, use the gas coin directly for payment
        console.log('Splitting coin with amount:', exactAmount.toString())
        const [transferCoin] = payTx.splitCoins(payTx.gas, [payTx.pure.u64(exactAmount)]);
        payTx.transferObjects([transferCoin], payTx.pure.address(stealthAddress.stealthSuiAddress));

        // Get reference gas price from network
        const { referenceGasPrice } = await suiClient.getReferenceGasPrice();
        payTx.setGasPrice(referenceGasPrice);

        // For complex transactions like this, set an explicit budget
        // We set 0.02 SUI (20000000 MIST) which should be more than enough
        payTx.setGasBudget(20000000);
      } else {
        // For other tokens, fetch fresh coins
        const { data: freshTokenCoins } = await suiClient.getCoins({
          owner: suiWallet.account.address,
          coinType: selectedToken.address
        });
        console.log('tokenCoins', freshTokenCoins)

        // Find a coin with sufficient balance
        const coinWithSufficientBalance = freshTokenCoins.find(
          coin => BigInt(coin.balance) >= exactAmount
        );

        if (!coinWithSufficientBalance) {
          throw new Error('No single coin with sufficient balance found');
        }

        // Split the exact amount needed from the found coin
        const [transferCoin] = payTx.splitCoins(
          coinWithSufficientBalance.coinObjectId,
          [payTx.pure.u64(exactAmount)]
        );
        payTx.transferObjects([transferCoin], payTx.pure.address(stealthAddress.stealthSuiAddress));

        // Get reference gas price from network
        const { referenceGasPrice } = await suiClient.getReferenceGasPrice();
        payTx.setGasPrice(referenceGasPrice);

        // For token transfers, we can use a lower budget
        // Set 0.01 SUI (10000000 MIST) which should be sufficient
        payTx.setGasBudget(10000000);

        // For non-native tokens, explicitly set gas payment
        // Get fresh gas coins
        const { data: gasCoins } = await suiClient.getCoins({
          owner: suiWallet.account.address,
          coinType: '0x2::sui::SUI'
        });

        if (gasCoins.length === 0) {
          throw new Error('No gas coins found in wallet');
        }

        // Sort by balance and use the largest one
        const sortedGasCoins = [...gasCoins].sort((a, b) => 
          BigInt(b.balance) - BigInt(a.balance)
        );

        // Take the largest coin for gas
        const gasCoin = sortedGasCoins[0];
        
        // Set gas payment with the selected coin
        payTx.setGasPayment([{
          objectId: gasCoin.coinObjectId,
          version: gasCoin.version,
          digest: gasCoin.digest
        }]);
      }

      // Call the announce function
      const target = `${chain.stealthProgramId}::pivy_stealth::announce`
      payTx.moveCall({
        target,
        typeArguments: [selectedToken.isNative ? '0x2::sui::SUI' : selectedToken.address],
        arguments: [
          payTx.pure.u64(exactAmount),
          payTx.pure.address(stealthAddress.stealthSuiAddress),
          payTx.pure.vector('u8', Array.from(labelBytes)),
          payTx.pure.vector('u8', Array.from(ephPubBytes)),
          payTx.pure.vector('u8', Array.from(payloadBytes)),
        ],
      });

      // Build transaction kind bytes
      console.log('Building transaction kind bytes...');
      let txKindBytes;
      try {
        txKindBytes = await payTx.build({
          client: suiClient,
          onlyTransactionKind: true
        });
      } catch (buildError) {
        throw new Error(`Transaction build failed: ${buildError.message}`);
      }

      // Create sponsored transaction
      console.log('Creating sponsored transaction...');
      const sponsoredTx = Transaction.fromKind(txKindBytes);
      sponsoredTx.setSender(suiWallet.account.address);
      sponsoredTx.setGasOwner(suiWallet.account.address);

      // Get fresh gas coins for sponsoring
      const { data: gasCoins } = await suiClient.getCoins({
        owner: suiWallet.account.address,
        coinType: '0x2::sui::SUI'
      });

      if (gasCoins.length === 0) {
        throw new Error('No gas coins found in wallet');
      }

      // Sort by balance and use the largest one
      const sortedGasCoins = [...gasCoins].sort((a, b) => 
        BigInt(b.balance) - BigInt(a.balance)
      );
      const gasCoin = sortedGasCoins[0];

      // Set gas payment
      sponsoredTx.setGasPayment([{
        objectId: gasCoin.coinObjectId,
        version: gasCoin.version,
        digest: gasCoin.digest
      }]);

      // Build final transaction bytes
      console.log('Building final transaction...');
      const finalTxBytes = await sponsoredTx.build({ client: suiClient });

      // Sign and execute
      console.log('Signing transaction...');
      const signatures = [];

      // Get sponsor signature (user wallet)
      const userSignatureResult = await suiWallet.signTransaction({
        transaction: sponsoredTx
      });
      signatures.push(userSignatureResult.signature);

      // Execute transaction
      console.log('Executing transaction...');
      const payRes = await suiClient.executeTransactionBlock({
        transactionBlock: finalTxBytes,
        signature: signatures,
        requestType: 'WaitForLocalExecution',
      });

      const sig = payRes.digest;
      console.log('sig', sig)

      const confirmed = await suiClient.waitForTransaction({
        digest: sig,
      })

      console.log('confirmed', confirmed)
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
