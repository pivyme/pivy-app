import React, { createContext, useContext, useState, useEffect } from 'react'

// Solana
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { useWalletModal as useSolanaWalletModal } from '@solana/wallet-adapter-react-ui'

// SUI
import { useWallet as useSuiWallet } from '@suiet/wallet-kit';

// Other
import axios from 'axios'
import { NATIVE_MINT } from '@solana/spl-token'
import { CHAINS, isTestnet } from '@/config'

const ReceiveContext = createContext({
  // States
  stealthData: null,
  paymentSuccess: null,
  isInitializing: true,
  error: null,
  sourceChain: null,
  isUsdcMode: false,
  tokenBalances: null,
  selectedToken: null,
  tokenSearchValue: "",
  amount: "",

  // Wallet
  wallet: {
    connected: false,
    connecting: false,
    publicKey: null,
    disconnect: () => { },
  },
  handleOpenWalletModal: () => { },

  // Functions
  setIsUsdcMode: (value) => { },
  setSelectedToken: (token) => { },
  setTokenSearchValue: (value) => { },
  setAmount: (value) => { },
  handlePayment: () => { },
  setPaymentSuccess: (details) => { },
  normalizeTokenData: (token) => token,
})

export function useReceive() {
  const context = useContext(ReceiveContext)
  if (!context) {
    throw new Error('useReceive must be used within a ReceiveProvider')
  }
  return context
}

export function ReceiveProvider({ children, username, tag }) {
  /* --------------------------------- General -------------------------------- */
  const [stealthData, setStealthData] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState(null)
  const [sourceChain, setSourceChain] = useState(null)
  const [isUsdcMode, setIsUsdcMode] = useState(false)

  /* --------------------------------- Chain Specific States -------------------------------- */
  const [tokenBalances, setTokenBalances] = useState(null)
  const [selectedToken, setSelectedToken] = useState(null)
  const [tokenSearchValue, setTokenSearchValue] = useState("")
  const [amount, setAmount] = useState("")

  /* --------------------------------- Wallet States -------------------------------- */
  const [wallet, setWallet] = useState({
    publicKey: null,
    connected: false,
    connecting: false,
    disconnect: () => { },
  })

  // Solana
  const solanaWallet = useSolanaWallet()
  const { setVisible: setSolanaWalletVisible } = useSolanaWalletModal()

  // SUI
  const suiWallet = useSuiWallet()

  useEffect(() => {
    if (sourceChain === 'SOLANA') {
      setWallet({
        connected: solanaWallet.connected,
        publicKey: solanaWallet.publicKey,
        disconnect: solanaWallet.disconnect,
        connecting: solanaWallet.connecting,
      })
    } else if (sourceChain === 'SUI') {
      setWallet({
        connected: suiWallet.connected,
        publicKey: suiWallet.account?.address,
        disconnect: suiWallet.disconnect,
        connecting: suiWallet.connecting,
      })
    }
  }, [sourceChain, solanaWallet.connected, suiWallet.connected])

  const handleOpenWalletModal = () => {
    if (sourceChain === 'SOLANA') {
      setSolanaWalletVisible(true)
    } else if (sourceChain === 'SUI') {
      const suiConnectButton = document.getElementById('sui-connect-button')
      if (suiConnectButton) {
        const childButton = suiConnectButton.querySelector('button')
        if (childButton) {
          childButton.click()
        }
      }
    }
  }

  /* --------------------------------- Chain Specific Functions -------------------------------- */
  const normalizeTokenData = (token) => {
    if (sourceChain === 'SOLANA') {
      const isNativeToken = 'symbol' in token && !('token' in token);
      if (isNativeToken) {
        return {
          isNative: true,
          amount: token.amount,
          decimals: token.decimals,
          address: 'native',
          imageUrl: token.imageUrl,
          name: token.name,
          symbol: token.symbol
        };
      }
      return {
        isNative: false,
        amount: token.tokenAmount,
        decimals: token.token.decimals,
        address: token.mint,
        imageUrl: token.token.imageUrl,
        name: token.token.name,
        symbol: token.token.symbol
      };
    }

    if (sourceChain === 'SUI') {
      const isNativeToken = 'symbol' in token && !('token' in token);
      return {
        isNative: isNativeToken,
        amount: token.amount || 0,
        decimals: token.decimals || 9,
        address: token.address,
        imageUrl: token.imageUrl,
        name: token.name,
        symbol: token.symbol
      }
    }

    return token
  }

  const normalizeFixedTokenData = (tokenInfo) => {
    if (sourceChain === 'SOLANA') {
      return {
        isNative: tokenInfo.address === NATIVE_MINT.toString(),
        amount: 0,
        decimals: tokenInfo.decimals,
        address: tokenInfo.address,
        imageUrl: tokenInfo.imageUrl,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol
      }
    }

    if (sourceChain === 'SUI') {
      // Dummy implementation for SUI
      return {
        isNative: tokenInfo.isNative,
        amount: 0,
        decimals: tokenInfo.decimals,
        address: tokenInfo.address,
        imageUrl: tokenInfo.imageUrl,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol
      }
    }


    return tokenInfo
  }

  const handleFetchTokenBalances = async () => {
    try {
      if (sourceChain === 'SOLANA') {
        const balances = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/user/balance/${wallet.publicKey}`,
          {
            params: {
              chain: import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"
            }
          }
        )
        setTokenBalances(balances.data)

        // Handle fixed amount payments with new structure
        if (stealthData?.linkData?.amountType === 'FIXED' && stealthData?.linkData?.mint) {
          const mintAddress = stealthData.linkData.mint.mintAddress;
          let matchingToken;

          if (mintAddress === NATIVE_MINT.toString()) {
            matchingToken = balances.data.nativeBalance;
          } else {
            matchingToken = balances.data.splBalance?.find(t => t.mint === mintAddress);
          }

          if (matchingToken) {
            const normalizedToken = normalizeTokenData(matchingToken);
            setSelectedToken(normalizedToken);
            setTokenSearchValue(normalizedToken.name);
          } else {
            // If token not in balance, use mint info
            const mintInfo = stealthData.linkData.mint;
            const normalizedToken = normalizeFixedTokenData({
              address: mintInfo.mintAddress,
              decimals: mintInfo.decimals,
              imageUrl: mintInfo.imageUrl,
              name: mintInfo.name,
              symbol: mintInfo.symbol
            });
            setSelectedToken(normalizedToken);
            setTokenSearchValue(normalizedToken.name);
          }

          // Use chainAmount which is already in the correct format
          setAmount((stealthData.linkData.amount || 0).toString());
        } else if (balances.data?.nativeBalance) {
          setSelectedToken(normalizeTokenData(balances.data.nativeBalance))
          setTokenSearchValue(balances.data.nativeBalance.name)
          setAmount("")
        }
      }

      if (sourceChain === 'SUI') {
        const balances = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/user/balance/${wallet.publicKey}`,
          {
            params: {
              chain: isTestnet ? "SUI_TESTNET" : "SUI_MAINNET"
            }
          }
        )

        setTokenBalances(balances.data)

        // Handle fixed amount payments with new structure
        if (stealthData?.linkData?.amountType === 'FIXED' && stealthData?.linkData?.mint) {
          const mintAddress = stealthData.linkData.mint.mintAddress;
          let matchingToken;

          if (mintAddress === '0x2::sui::SUI') {
            matchingToken = balances.data.nativeBalance;
          } else {
            matchingToken = balances.data.tokens?.find(t => t.address === mintAddress);
          }

          if (matchingToken) {
            const normalizedToken = normalizeTokenData(matchingToken);
            setSelectedToken(normalizedToken);
            setTokenSearchValue(matchingToken.name);
          } else {
            // If token not in balance, use mint info
            const mintInfo = stealthData.linkData.mint;
            const normalizedToken = normalizeFixedTokenData({
              address: mintInfo.mintAddress,
              decimals: mintInfo.decimals,
              imageUrl: mintInfo.imageUrl,
              name: mintInfo.name,
              symbol: mintInfo.symbol,
              isNative: mintAddress === '0x2::sui::SUI'
            });
            setSelectedToken(normalizedToken);
            setTokenSearchValue(normalizedToken.name);
          }

          // Use amount directly
          setAmount((stealthData.linkData.amount || 0).toString());
        } else if (balances.data?.nativeBalance) {
          setSelectedToken(normalizeTokenData(balances.data.nativeBalance))
          setTokenSearchValue(balances.data.nativeBalance.name)
          setAmount("")
        }
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }

  const handlePayment = async () => {
    if (sourceChain === 'SOLANA') {
      // This will be handled by the PayButton component for now
      return
    }

    if (sourceChain === 'SUI') {
      // Dummy implementation for SUI
      console.log('SUI payment', { amount, selectedToken })
      setPaymentSuccess({
        signature: 'dummy_sui_signature',
        amount,
        token: selectedToken,
        timestamp: Date.now()
      })
    }
  }

  /* --------------------------------- Effects -------------------------------- */
  useEffect(() => {
    let mounted = true

    const initializeData = async () => {
      setIsInitializing(true)
      setError(null)

      try {
        if (!username) {
          throw new Error('No username provided')
        }

        const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 2000))

        const fetchDataPromise = async () => {
          const stealthResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/address/${username}/${tag}`,
            {
              params: {
                chain: import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"
              }
            }
          )

          if (!mounted) return

          if (!stealthResponse.data) {
            throw new Error("User not found")
          }

          setStealthData(stealthResponse.data)
          setSourceChain(stealthResponse.data.sourceChain)

          if (wallet.connected && wallet.publicKey) {
            await handleFetchTokenBalances()
          }
        }

        await Promise.all([minimumLoadingTime, fetchDataPromise()])
      } catch (err) {
        if (!mounted) return
        console.error("Error initializing:", err.response)
        setError(
          err.response?.status === 404 || err.response?.data?.message === "User not found"
            ? "User not found"
            : err.response?.data?.message || "Failed to load data"
        )
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeData()

    return () => {
      mounted = false
    }
  }, [username, tag])

  useEffect(() => {
    if (wallet.connected) {
      handleFetchTokenBalances()
    } else {
      setTokenBalances(null)
      setSelectedToken(null)
      setTokenSearchValue("")
      setAmount("")
    }
  }, [wallet.connected, stealthData])

  const value = {
    // States
    stealthData,
    paymentSuccess,
    isInitializing,
    error,
    sourceChain,
    isUsdcMode,
    tokenBalances,
    selectedToken,
    tokenSearchValue,
    amount,

    // Wallet
    wallet,
    handleOpenWalletModal,

    // Functions
    setIsUsdcMode,
    setSelectedToken,
    setTokenSearchValue,
    setAmount,
    handlePayment,
    setPaymentSuccess,
    normalizeTokenData
  }

  return (
    <ReceiveContext.Provider value={value}>
      {children}
    </ReceiveContext.Provider>
  )
} 