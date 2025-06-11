import axios from "axios";
import AnimateComponent from "@/components/elements/AnimateComponent";
import BounceButton from "@/components/elements/BounceButton";
import { CheckCircle2Icon, DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { motion } from 'framer-motion';
import { getExplorerTxLink } from "@/utils/misc";
import { Button } from "@heroui/react";
import solanaLogo from '/chains/solana.svg';
import suiLogo from '/chains/sui.svg';
import { useReceive } from "./ReceiveProvider";

export default function PaymentSuccessView({ paymentDetails, stealthData, publicKey }) {
  const { sourceChain } = useReceive()
  const { signature, amount, token, timestamp } = paymentDetails;

  const renderFromAddress = () => {
    if (paymentDetails.sourceChain === 'SUI') {
      return (
        <div className="flex justify-between items-center">
          <span className="text-gray-600">From</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{paymentDetails.fromAddress?.slice(0, 4)}...{paymentDetails.fromAddress?.slice(-4)}</span>
            <img src={suiLogo} alt="SUI Chain" className="w-4 h-4" />
          </div>
        </div>
      );
    } else if (paymentDetails.sourceChain === 'SOLANA') {
      return (
        <div className="flex justify-between items-center">
          <span className="text-gray-600">From</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</span>
            <img src={solanaLogo} alt="Solana Chain" className="w-4 h-4" />
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-between items-center">
          <span className="text-gray-600">From</span>
          <span className="font-medium text-gray-900">EVM Wallet</span>
        </div>
      );
    }
  };

  return (
    <AnimateComponent>
      <div className='nice-card p-8 w-full flex flex-col items-center'>
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CheckCircle2Icon className="w-12 h-12 text-green-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Receipt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Receipt Header */}
            <div className="px-6 py-5 border-b border-gray-100 text-center relative">
              <div className="absolute left-0 right-0 -bottom-1 h-1 bg-gradient-to-r from-primary-100 via-primary-500 to-primary-100 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-900">Payment Complete 🎉</h2>
              <p className="text-gray-600 mt-1">
                {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString()}
              </p>
            </div>

            {/* Receipt Details */}
            <div className="px-6 py-5 space-y-4">
              {/* Amount */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {amount} {token.symbol}
                </div>
                <div className="text-gray-600 text-sm mt-1">
                  Payment Amount
                </div>
              </div>

              {/* Divider with dots */}
              <div className="flex items-center gap-1 py-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 border-b-2 border-dotted border-gray-200" />
                ))}
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">To</span>
                  <span className="font-medium text-gray-900">{stealthData.username}</span>
                </div>
                {renderFromAddress()}
                {stealthData?.linkData?.label && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Label</span>
                    <span className="font-medium text-gray-900">{stealthData.linkData.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-5 space-y-3">
              <a
                href={getExplorerTxLink(
                  signature, 
                  sourceChain === 'SUI' 
                    ? (import.meta.env.VITE_IS_TESTNET === "true" ? "SUI_TESTNET" : "SUI_MAINNET")
                    : (import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET")
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 font-medium"
              >
                View on {sourceChain === 'SUI' ? 'Suiscan' : 'Solscan'}
                <ExternalLinkIcon className="w-4 h-4" />
              </a>

              {stealthData?.linkData?.type === 'DOWNLOAD' && stealthData?.linkData?.file && (
                <BounceButton
                  className="w-full tracking-tight font-bold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm"
                  radius="full"
                  size="lg"
                  onPress={async () => {
                    try {
                      // Call the download endpoint with the transaction signature
                      const response = await axios.get(
                        `${import.meta.env.VITE_BACKEND_URL}/link/file/${stealthData.linkData.file.id}`,
                        {
                          params: {
                            txHash: signature,
                            chain: import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"
                          },
                          responseType: 'blob'
                        }
                      )

                      // Create a blob URL and trigger download
                      const blob = new Blob([response.data])
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = stealthData.linkData.file.filename
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    } catch (error) {
                      console.error('Error downloading file:', error)
                      // You might want to show an error message to the user here
                    }
                  }}
                  startContent={<DownloadIcon className="w-5 h-5" />}
                >
                  🎁 Download File
                </BounceButton>
              )}
            </div>
          </div>
        </motion.div>

        {/* Share or New Payment */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <Button
            variant="light"
            radius="full"
            className="font-medium"
            onPress={() => window.location.reload()}
          >
            Make Another Payment
          </Button>
        </motion.div>
      </div>
    </AnimateComponent>
  );
};