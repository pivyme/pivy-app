import { ArrowRightIcon, InfoIcon, CheckCircleIcon, Loader2Icon } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi'
import React, { useState, useEffect } from 'react'
import { CCTP_CONTRACTS, CHAINS, isTestnet, USDC_CONTRACT_ADDRESS } from '@/config';
import { USDC_ABI } from '@/lib/usdc/usdcAbi';
import { formatUnits, parseUnits } from 'viem';
import { formatUiNumber } from '@/utils/formatting';
import { prepareUsdcEvmPayment, solanaAddressToHex } from '@/lib/pivy-stealth/pivy-stealth';
import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { useEthersSigner } from '@/hooks/useEthersSigner';
import BounceButton from '@/components/elements/BounceButton'
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'
import AnimateComponent from '@/components/elements/AnimateComponent'
import { prepareSuiUsdcEvmPayment } from '@/lib/pivy-stealth/pivy-stealth-sui';

const USDC_CONTRACT = {
  abi: USDC_ABI,
  addresses: import.meta.env.VITE_IS_TESTNET === "true" ? USDC_CONTRACT_ADDRESS.DEVNET : USDC_CONTRACT_ADDRESS.MAINNET
}

// Constants for chain-specific configurations
const CHAIN_CONFIG = {
  SOLANA: {
    getChain: () => isTestnet ? CHAINS.DEVNET : CHAINS.MAINNET,
    preparePayment: prepareUsdcEvmPayment,
    getRecipientBytes32: (prepareData) => solanaAddressToHex(prepareData.stealthAta.toBase58()),
    formatCctpData: (prepareData, txData, attestation, stealthData, chain, usdcAddress) => ({
      srcDomain: txData.messengerContractInfo.domain,
      srcTxHash: txData.hash,
      amount: txData.amountInWei.toString(),
      stealthAta: prepareData.stealthAta.toBase58(),
      stealthOwnerPub: prepareData.stealthOwner.toBase58(),
      ephPub: prepareData.ephPub.toBase58(),
      attestation,
      usdcAddress,
      tokenMessengerMinterProgramInfo: CCTP_CONTRACTS.TOKEN_MESSENGER_MINTER_PROGRAM[chain.id],
      tokenTransmitterProgramInfo: CCTP_CONTRACTS.TOKEN_TRANSMITTER_PROGRAM[chain.id],
      encryptedPayload: prepareData.encryptedPayload,
      linkId: stealthData.linkData.id
    }),
    getChainParam: () => import.meta.env.VITE_IS_TESTNET === "true" ? 'DEVNET' : 'MAINNET'
  },
  SUI: {
    getChain: () => isTestnet ? CHAINS.SUI_TESTNET : CHAINS.SUI_MAINNET,
    preparePayment: prepareSuiUsdcEvmPayment,
    getRecipientBytes32: (prepareData) => ethers.hexlify(prepareData.stealthOwner),
    formatCctpData: (prepareData, txData, attestation, stealthData, chain, usdcAddress) => {
      const chainKey = isTestnet ? 'SUI_TESTNET' : 'SUI_MAINNET';
      return {
        srcDomain: txData.messengerContractInfo.domain,
        srcTxHash: txData.hash,
        amount: txData.amountInWei.toString(),
        stealthOwner: prepareData.stealthOwner,
        ephPub: prepareData.ephPub,
        attestation,
        usdcAddress,
        tokenMessengerMinterProgramInfo: {
          domain: 8,
          address: CCTP_CONTRACTS.TOKEN_MESSENGER_MINTER_PROGRAM[chainKey].address
        },
        tokenTransmitterProgramInfo: {
          domain: 8,
          address: CCTP_CONTRACTS.TOKEN_TRANSMITTER_PROGRAM[chainKey].address
        },
        messageTransmitterStateProgramInfo: CCTP_CONTRACTS.MESSAGE_TRANSMITTER_STATE[chainKey],
        tokenMessengerMinterStateProgramInfo: CCTP_CONTRACTS.TOKEN_MESSENGER_MINTER_STATE[chainKey],
        usdcTreasuryObject: CCTP_CONTRACTS.USDC_TREASURY[chainKey],
        usdcSuiPackage: CCTP_CONTRACTS.USDC_PACKAGE[chainKey],
        encryptedPayload: prepareData.encryptedPayload,
        linkId: stealthData.linkData.id
      };
    },
    getChainParam: () => isTestnet ? 'SUI_TESTNET' : 'SUI_MAINNET'
  }
};

const LoadingStep = ({ isActive, isCompleted, title, description, isLast }) => {
  let statusClass = 'bg-gray-100 text-gray-400';
  let titleClass = 'text-gray-400';
  let descriptionClass = 'text-gray-400';

  if (isCompleted) {
    statusClass = 'bg-emerald-100 text-emerald-700 shadow-inner shadow-emerald-200';
    titleClass = 'text-emerald-700';
    descriptionClass = 'text-emerald-700';
  } else if (isActive) {
    statusClass = 'bg-primary-50 text-primary-500';
    titleClass = 'text-primary-900';
    descriptionClass = 'text-gray-600';
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusClass}`}>
          {isCompleted && <CheckCircleIcon className="w-5 h-5" />}
          {isActive && <Loader2Icon className="w-5 h-5 animate-spin" />}
          {!isCompleted && !isActive && <div className="w-2 h-2 rounded-full bg-current" />}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-12 ${isCompleted ? 'bg-emerald-200' : 'bg-gray-200'}`} />
        )}
      </div>
      <div>
        <h3 className={`font-semibold ${titleClass}`}>{title}</h3>
        <p className={`text-sm ${descriptionClass}`}>{description}</p>
      </div>
    </div>
  );
};

export default function UsdcEvmPayment({ amount, setAmount, stealthData, onSuccess }) {
  const { isConnected, chain, address } = useAccount()
  const signer = useEthersSigner({ chainId: chain?.id })
  const usdcAddress = USDC_CONTRACT.addresses[chain?.id || 11155111];
  const [isApproving, setIsApproving] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [allowance, setAllowance] = useState("0")
  const [currentStep, setCurrentStep] = useState(0)
  const [bridgeData, setBridgeData] = useState(null)

  // Get USDC balance
  const { isLoading: isLoadingUsdcBalance, data: usdcBalance } = useReadContract({
    address: usdcAddress,
    abi: USDC_CONTRACT.abi,
    functionName: 'balanceOf',
    args: [address],
    account: address,
    query: {
      enabled: isConnected
    }
  })

  // Get USDC allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: USDC_CONTRACT.abi,
    functionName: 'allowance',
    args: [address, CCTP_CONTRACTS.TOKEN_MESSENGER[chain?.id]?.address],
    account: address,
    query: {
      enabled: isConnected && !!chain?.id
    }
  })

  useEffect(() => {
    if (currentAllowance) {
      setAllowance(currentAllowance.toString())
    }
  }, [currentAllowance])

  const formattedUsdcBalance = formatUnits(usdcBalance || 0, 6)

  const handleApproveUsdc = async () => {
    try {
      setIsApproving(true)
      const usdcContract = new ethers.Contract(usdcAddress, USDC_CONTRACT.abi, signer)

      const tx = await usdcContract.approve(
        CCTP_CONTRACTS.TOKEN_MESSENGER[chain.id].address,
        ethers.MaxUint256
      )

      await tx.wait()
      await refetchAllowance()
    } catch (error) {
      console.error('Error approving USDC:', error)
    } finally {
      setIsApproving(false)
    }
  }

  async function retrieveAttestation(srcDomain, burnTxHash, maxRetries = 12) {
    const url = `https://iris-api-sandbox.circle.com/v1/messages/${srcDomain}/${burnTxHash}`;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data } = await axios.get(url);
        const msg = data?.messages?.[0];
        if (msg && msg.attestation !== 'PENDING') {
          console.log('✓ attestation ready');
          return msg;
        }
        console.log('… awaiting attestation');
      } catch (e) {
        console.log('⚠️  iris error, retrying');
      }
      await new Promise(r => setTimeout(r, 15000));
    }
    throw new Error('attestation not ready after max retries');
  }

  const handlePayEvmUSDC = async () => {
    try {
      setIsPaying(true)
      setCurrentStep(1)

      const chainConfig = CHAIN_CONFIG[stealthData.sourceChain];
      if (!chainConfig) {
        throw new Error('Unsupported source chain');
      }

      const targetChain = chainConfig.getChain();
      let prepareData;

      if (stealthData.sourceChain === "SOLANA") {
        prepareData = await chainConfig.preparePayment({
          metaSpendPub: stealthData.metaSpendPub,
          metaViewPub: stealthData.metaViewPub,
          mint: new PublicKey(targetChain.tokens.find(t => t.symbol === 'USDC').address)
        });
      } else {
        prepareData = await chainConfig.preparePayment({
          metaSpendPub: stealthData.metaSpendPub,
          metaViewPub: stealthData.metaViewPub,
          s: stealthData.s
        });
      }

      const recipientBytes32 = chainConfig.getRecipientBytes32(prepareData);
      const messengerContractInfo = CCTP_CONTRACTS.TOKEN_MESSENGER[parseInt(chain.id)];
      const messengerContract = new ethers.Contract(
        messengerContractInfo.address,
        ['function depositForBurn(uint256,uint32,bytes32,address)'],
        signer
      );

      const amountInWei = parseUnits(amount.toString(), 6);
      const tx = await messengerContract.depositForBurn(
        amountInWei,
        stealthData.sourceChain === "SUI" ? 8 : 5, // Domain ID: 5 for Solana, 8 for Sui
        recipientBytes32,
        usdcAddress
      );

      await tx.wait();
      console.log('depositForBurn tx', tx.hash);

      setCurrentStep(2);
      const attestation = await retrieveAttestation(
        messengerContractInfo.domain,
        tx.hash
      );

      const txData = {
        messengerContractInfo,
        hash: tx.hash,
        amountInWei
      };

      const cctpData = chainConfig.formatCctpData(
        prepareData,
        txData,
        attestation,
        stealthData,
        targetChain,
        usdcAddress
      );

      setCurrentStep(3);

      const res = await axios({
        method: 'POST',
        url: `${import.meta.env.VITE_BACKEND_URL}/cctp/process-cctp-tx`,
        data: cctpData,
        params: {
          chain: chainConfig.getChainParam()
        }
      });

      if (stealthData.sourceChain === "SOLANA") {
        setBridgeData(res.data);
        setCurrentStep(4);

        onSuccess?.({
          signature: res.data.receiveSignature,
          amount: amount,
          token: {
            symbol: 'USDC',
            name: 'USD Coin',
            imageUrl: '/tokens/usdc.png'
          },
          timestamp: Date.now(),
          bridgeData: res.data
        });
      } else if (stealthData.sourceChain === "SUI") {
        // Handle Sui success
        setBridgeData(res.data);
        setCurrentStep(4);

        onSuccess?.({
          signature: res.data.receiveSignature,
          amount: amount,
          token: {
            symbol: 'USDC',
            name: 'USD Coin',
            imageUrl: '/tokens/usdc.png'
          },
          timestamp: Date.now(),
          bridgeData: res.data
        });
      }

    } catch (error) {
      console.log('Error processing payment:', error);
      setCurrentStep(0);
    } finally {
      setIsPaying(false);
    }
  }

  const needsApproval = BigInt(allowance) < parseUnits(amount.toString(), 6)
  const hasInsufficientBalance = parseUnits(amount.toString(), 6) > (usdcBalance || 0n)

  if (isPaying) {
    return (
      <AnimateComponent>
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <motion.img
              src="/tokens/usdc.png"
              alt="USDC"
              className="w-12 h-12 mx-auto"
              initial={{ scale: 0 }}
              animate={{
                scale: [0, 1.2, 1, 1.1, 1],
                rotate: [0, 10, -10, 10, 0],
                y: [0, -3, 0, 3, 0]
              }}
              transition={{
                duration: 3,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'loop'
              }}
            />
            <h3 className="text-2xl font-extrabold text-gray-900">
              Bridging USDC to {stealthData.sourceChain.charAt(0) + stealthData.sourceChain.slice(1).toLowerCase()}
            </h3>
            <p className="text-gray-600 font-medium">
              Hang tight while we sprinkle some cross-chain magic ✨
            </p>
          </div>

          <div className="space-y-4 py-4">
            <LoadingStep
              isActive={currentStep === 1}
              isCompleted={currentStep > 1}
              title="Deposit & Burn USDC"
              description="Converting your USDC for cross-chain transfer"
            />
            <LoadingStep
              isActive={currentStep === 2}
              isCompleted={currentStep > 2}
              title="Awaiting Attestation"
              description="Circle is verifying your transaction"
            />
            <LoadingStep
              isActive={currentStep === 3}
              isCompleted={currentStep > 3}
              title={`Claiming on ${stealthData.sourceChain.charAt(0) + stealthData.sourceChain.slice(1).toLowerCase()}`}
              description={`Sending fresh USDC to the receiver on ${stealthData.sourceChain.charAt(0) + stealthData.sourceChain.slice(1).toLowerCase()}`}
              isLast
            />
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Powered by Circle&apos;s Cross-Chain Transfer&nbsp;Protocol</p>
            {currentStep === 2 && (
              <p className="mt-2 text-primary-600">This step usually takes 2-3 minutes</p>
            )}
          </div>
        </div>
      </AnimateComponent>
    )
  }

  let actionButtonContent = 'Pay';
  if (hasInsufficientBalance) {
    actionButtonContent = 'Insufficient USDC balance';
  } else if (needsApproval) {
    actionButtonContent = isApproving ? '✨ Approving...' : '🔓 Approve USDC';
  } else if (isPaying) {
    actionButtonContent = '✨ Processing...';
  } else if (stealthData?.linkData?.type === 'DOWNLOAD') {
    actionButtonContent = '🎁 Pay & Download';
  }

  return (
    <AnimateComponent>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src="/tokens/usdc.png"
            alt="USDC"
            className="w-8 h-8"
          />
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              Pay with USDC
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                Cross-chain
              </span>
            </h3>
            <p className="text-sm text-gray-600">
              Send USDC from any major EVM chain
            </p>
          </div>
        </div>
        <button
          className="group p-2 hover:bg-gray-50 rounded-xl transition-colors"
          onClick={() => {/* Add info modal/tooltip here */ }}
        >
          <InfoIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </button>
      </div>

      <div className={isConnected ? 'mb-6 flex justify-center' : 'py-16 flex justify-center'}>
        <ConnectButton
          label='Connect EVM Wallet to continue'
        />
      </div>

      {isConnected && (
        <>
          <div className="relative mb-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-medium tracking-tight outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="font-medium text-gray-700">USDC</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm px-1 mb-6">
            <span className="text-gray-600">Balance</span>
            <span className="text-gray-900">
              {isLoadingUsdcBalance ? 'Loading...' : formatUiNumber(formattedUsdcBalance, 'USDC')}
            </span>
          </div>

          <div className='mb-6 mt-8'>
            <BounceButton
              className="tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full"
              radius="full"
              size="lg"
              onPress={hasInsufficientBalance ? undefined : (needsApproval ? handleApproveUsdc : handlePayEvmUSDC)}
              isLoading={isApproving || isPaying}
              isDisabled={hasInsufficientBalance || isApproving || isPaying || !amount}
            >
              {actionButtonContent}
            </BounceButton>
          </div>
        </>
      )}

      <p className="text-center text-xs text-gray-500">
        Powered by USDC&apos;s CCTP
      </p>
    </AnimateComponent>
  )
} 