import { useDashboard } from '@/contexts/DashboardContext'
import { ArrowUpRightIcon, SparklesIcon, CheckCircleIcon, ExternalLinkIcon } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import ColorCard from '../elements/ColorCard'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useZkLogin } from '@/providers/ZkLoginProvider'
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@heroui/react'
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction as SolanaTransaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { decryptEphemeralPrivKey, loadPivyProgram, deriveStealthKeypair } from '@/lib/pivy-stealth/pivy-stealth'
import { decryptEphemeralPrivKey as decryptEphemeralPrivKeySui, deriveStealthKeypair as deriveStealthKeypairSui } from '@/lib/pivy-stealth/pivy-stealth-sui';
import { useWallet as useSuiWallet } from '@suiet/wallet-kit';
import { SuiClient } from '@mysten/sui/client';
import { isValidSuiAddress} from '@mysten/sui/utils';
import { Transaction as SuiTransaction } from '@mysten/sui/transactions';
import { genAddressSeed, getZkLoginSignature } from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { jwtDecode } from 'jwt-decode';

import BN from 'bn.js';
import { CHAINS, isTestnet } from '@/config'
import { sleep } from '@/utils/process'
import gsap from 'gsap'
import Portal from '../shared/Portal'
import { shortenAddress, getExplorerTxLink } from '@/utils/misc'
import BounceButton from '../elements/BounceButton'
import axios from 'axios'

const validateAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

const validateSuiAddress = (address) => {
  return isValidSuiAddress(address)
}

function TokenCard({ token, index }) {
  const { accessToken, me, walletChain, walletChainId, metaSpendPriv, metaViewPriv } = useAuth()
  const { 
    generateZkProof, 
    zkLoginUserAddress, 
    zkLoginJwt,
    zkLoginUserSalt,
    zkLoginEphemeralKeyPair,
    zkLoginMaxEpoch 
  } = useZkLogin()
  const [isOpen, setIsOpen] = useState(false)
  const { connection } = useConnection()
  const walletInstance = useWallet()
  const backdropRef = useRef(null)

  const suiWallet = useSuiWallet()

  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [lastTxSignature, setLastTxSignature] = useState(null)
  const [currentTxNumber, setCurrentTxNumber] = useState(0)
  const [totalTxCount, setTotalTxCount] = useState(0)

  const handleSend = async () => {
    if (isSending) return

    if (!amount || !address) {
      setError('Please enter an amount and address')
      return
    }

    if (amount > token.total) {
      setError('Amount is greater than balance')
      return
    }

    if (!address) {
      setError('Please enter an address')
      return
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    // Validate Solana address
    if (walletChain === 'SOLANA') {
      if (!validateAddress(address)) {
        setError('Invalid Solana address')
        return
      }
    }

    // Validate SUI address
    if (walletChain === 'SUI' || walletChain === 'SUI_ZKLOGIN') {
      if (!validateSuiAddress(address)) {
        setError('Invalid SUI address')
        return
      }
    }

    setError(null)
    setIsSending(true)

    try {
      if (walletChain === 'SOLANA') {
        console.log(`Sending ${amount} ${token.symbol} to ${address}`)

        const chain = CHAINS[import.meta.env.VITE_IS_TESTNET === "true" ? "DEVNET" : "MAINNET"]

        const program = await loadPivyProgram(
          connection,
          walletInstance,
          new PublicKey(chain.stealthProgramId)
        )

        const balances = token.balances.sort((a, b) => b.amount - a.amount).filter(b => b.amount > 0)
        console.log(balances)

        const picks = []
        let remaining = BigInt(Math.floor(amount * (10 ** token.decimals)))

        for (const balance of balances) {
          if (remaining <= 0n) break

          const balanceAmount = BigInt(Math.floor(balance.amount * (10 ** token.decimals)))
          const pick = remaining < balanceAmount ? remaining : balanceAmount

          picks.push({
            address: balance.address,
            ephemeralPubkey: balance.ephemeralPubkey,
            memo: balance.memo,
            mint: token.mintAddress,
            amount: Number(pick) / (10 ** token.decimals)
          })

          remaining -= pick
        }

        console.log('Picked wallets:', picks)

        const mint = new PublicKey(token.mintAddress)

        const destinationOwner = new PublicKey(address)
        const destinationAta = getAssociatedTokenAddressSync(
          mint,
          destinationOwner
        )

        console.log('Destination ATA:', destinationAta.toBase58())

        const ixs = [];

        // 1) ensure destination ATA exists
        if (!(await connection.getAccountInfo(destinationAta))) {
          console.log('Creating destination ATA…');
          ixs.push(
            createAssociatedTokenAccountInstruction(
              walletInstance.publicKey,
              destinationAta,
              destinationOwner,
              mint
            )
          );
        }

        // 2) for each picked stealth payment…
        const stealthSigners = [];
        for (const pick of picks) {
          const decryptedEphPriv = await decryptEphemeralPrivKey(
            pick.memo,
            metaViewPriv,
            pick.ephemeralPubkey,
          );

          console.log("decryptedEphPriv", decryptedEphPriv);

          const stealthKP = await deriveStealthKeypair(
            metaSpendPriv,
            me.metaViewPub,
            decryptedEphPriv,
          );

          const stealthAta = getAssociatedTokenAddressSync(
            mint,
            stealthKP.publicKey
          )

          console.log('stealthATA', stealthAta.toBase58())
          stealthSigners.push(stealthKP)

          ixs.push(
            await program.methods
              .withdraw({
                amount: new BN(pick.amount * 10 ** token.decimals),
              })
              .accounts({
                stealthOwner: stealthKP.publicKey,
                stealthAta: stealthAta,
                destinationAta: destinationAta,
                mint: mint,
                tokenProgram: TOKEN_PROGRAM_ID,
              })
              .instruction()
          );
        }
        // 3) assemble + partial sign + send
        const tx = new SolanaTransaction().add(...ixs);
        tx.feePayer = walletInstance.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // await Promise.all(stealthSigners.map(s => s.signTransaction(tx)));

        for (const stealthSigner of stealthSigners) {
          await stealthSigner.signTransaction(tx);
        }

        // now send the fully-signed tx
        const signed = await walletInstance.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
        });
        await connection.confirmTransaction(sig, 'confirmed');
        await sleep(4000)
        console.log('Withdrawal successful:', sig);
        setLastTxSignature(sig);
        setShowSuccessDialog(true);
        setIsOpen(false); // Close the popover
      }

      if (walletChain === 'SUI' || walletChain === 'SUI_ZKLOGIN') {
        console.log(`Sending ${amount} ${token.symbol} to ${address}`)
        console.log('Wallet Chain:', walletChain)
        console.log('zkLogin User Address:', zkLoginUserAddress)
        console.log('SUI Wallet Account:', suiWallet?.account?.address)

        const chain = isTestnet ? CHAINS.SUI_TESTNET : CHAINS.SUI_MAINNET
        const stealthProgramId = chain.stealthProgramId

        // Create SUI client
        const suiClient = new SuiClient({ url: chain.rpcUrl });

        const balances = token.balances.sort((a, b) => b.amount - a.amount).filter(b => b.amount > 0)
        console.log('balances', balances)

        const picks = []
        let remaining = BigInt(Math.floor(amount * (10 ** token.decimals)))

        for (const balance of balances) {
          if (remaining <= 0n) break

          const balanceAmount = BigInt(Math.floor(balance.amount * (10 ** token.decimals)))
          const pick = remaining < balanceAmount ? remaining : balanceAmount

          picks.push({
            address: balance.address,
            ephemeralPubkey: balance.ephemeralPubkey,
            memo: balance.memo,
            mint: token.mintAddress,
            amount: Number(pick) / (10 ** token.decimals)
          })

          remaining -= pick
        }

        console.log('Picked wallets:', picks)

        // Process each pick one at a time - build, sign, and execute before moving to next
        const txResults = [];
        const txDigests = [];

        // Set total transaction count
        setTotalTxCount(picks.length);
        setCurrentTxNumber(0);

        for (let i = 0; i < picks.length; i++) {
          setCurrentTxNumber(i + 1);
          const pick = picks[i];
          console.log(`Processing pick ${i + 1}/${picks.length} for ${pick.amount} ${token.symbol}`);

          try {
            // Get fresh gas coins for each transaction
            // Determine if we're using zkLogin (either by wallet chain or by having zkLoginUserAddress)
            const isUsingZkLogin = walletChain === 'SUI_ZKLOGIN' || zkLoginUserAddress;
            
            console.log('Gas payment debugging:', {
              walletChain,
              zkLoginUserAddress,
              suiWalletAddress: suiWallet?.account?.address,
              isUsingZkLogin
            });
            
            const gasOwnerAddress = isUsingZkLogin
              ? zkLoginUserAddress 
              : (suiWallet?.account?.address);
            
            if (!gasOwnerAddress) {
              console.error('Gas owner address resolution failed:', {
                walletChain,
                zkLoginUserAddress,
                suiWalletAddress: suiWallet?.account?.address,
                isUsingZkLogin
              });
              throw new Error(`Gas owner address not available for wallet type: ${walletChain}. zkLogin: ${!!zkLoginUserAddress}, suiWallet: ${!!suiWallet?.account?.address}`);
            }
            
            console.log('Using gas owner address:', gasOwnerAddress);
            
            const { data: gasCoins } = await suiClient.getCoins({
              owner: gasOwnerAddress,
              coinType: '0x2::sui::SUI'
            });

            if (gasCoins.length === 0) {
              throw new Error('No gas coins found in wallet');
            }

            // Sort gas coins by balance and use the largest one
            const sortedGasCoins = [...gasCoins].sort((a, b) => {
              const balanceA = BigInt(a.balance);
              const balanceB = BigInt(b.balance);
              if (balanceB > balanceA) return 1;
              if (balanceB < balanceA) return -1;
              return 0;
            });
            const gasCoin = sortedGasCoins[0];
            console.log(`Using gas coin ${gasCoin.coinObjectId} for transaction ${i + 1}`);

            // Derive stealth keypair
            console.log('Deriving stealth keypair...');
            const decryptedEphPriv = await decryptEphemeralPrivKeySui(
              pick.memo,
              metaViewPriv,
              pick.ephemeralPubkey,
            );

            console.log({
              metaspendpriv: metaSpendPriv,
              metaViewPub: me.metaViewPub,
              decryptedEphPriv: decryptedEphPriv,
            })

            const stealthKP = await deriveStealthKeypairSui(
              metaSpendPriv,
              me.metaViewPub,
              decryptedEphPriv
            );

            // Verify the stealth keypair matches the pick address
            const isStealthKpValid = stealthKP.toSuiAddress() === pick.address;
            console.log({
              pickAddress: pick.address,
              stealthKPAddress: stealthKP.toSuiAddress(),
              match: isStealthKpValid ? '✅' : '❌'
            });

            if (!isStealthKpValid) {
              throw new Error(`Stealth keypair does not match pick address: ${pick.address}`);
            }

            // Get coins owned by stealth address
            console.log('Fetching coins...');
            const { data: coins } = await suiClient.getCoins({
              owner: pick.address,
              coinType: pick.mint
            });

            if (coins.length === 0) {
              throw new Error(`No coins found for stealth address ${pick.address}`);
            }

            // Create new transaction for this pick
            console.log('Building transaction...');
            const withdrawTx = new SuiTransaction();

            // Find coins that sum up to the pick amount
            let remainingAmount = BigInt(Math.floor(pick.amount * (10 ** token.decimals)));
            const coinsToUse = [];

            for (const coin of coins) {
              if (remainingAmount <= 0n) break;
              coinsToUse.push(coin);
              remainingAmount -= BigInt(coin.balance);
            }

            if (remainingAmount > 0n) {
              throw new Error(`Insufficient balance in stealth address ${pick.address}`);
            }

            let finalCoin;

            if (coinsToUse.length === 1 && remainingAmount === 0n) {
              // Perfect match - use the coin directly
              finalCoin = withdrawTx.object(coinsToUse[0].coinObjectId);
            } else {
              // Need to merge or split coins
              if (coinsToUse.length > 1) {
                // Merge multiple coins into the first one
                const primaryCoin = withdrawTx.object(coinsToUse[0].coinObjectId);
                const otherCoins = coinsToUse.slice(1).map(coin => withdrawTx.object(coin.coinObjectId));
                withdrawTx.mergeCoins(primaryCoin, otherCoins);
                finalCoin = primaryCoin;
              } else {
                finalCoin = withdrawTx.object(coinsToUse[0].coinObjectId);
              }

              // If we have more than needed, split the coin
              if (remainingAmount < 0n) {
                const exactAmount = BigInt(Math.floor(pick.amount * (10 ** token.decimals)));
                const [splitCoin] = withdrawTx.splitCoins(finalCoin, [withdrawTx.pure.u64(exactAmount)]);
                finalCoin = splitCoin;
              }
            }

            // First transfer the coins directly
            console.log('Adding direct transfer...');
            withdrawTx.transferObjects([finalCoin], withdrawTx.pure.address(address));

            // Then call announce_withdraw
            console.log('Adding announce_withdraw call...');
            withdrawTx.moveCall({
              target: `${stealthProgramId}::pivy_stealth::announce_withdraw`,
              typeArguments: [pick.mint],
              arguments: [
                withdrawTx.pure.u64(BigInt(Math.floor(pick.amount * (10 ** token.decimals)))),
                withdrawTx.pure.address(address),
              ],
            });

            // Build transaction kind bytes
            console.log('Building transaction kind bytes...');
            let txKindBytes;
            try {
              txKindBytes = await withdrawTx.build({
                client: suiClient,
                onlyTransactionKind: true
              });
            } catch (buildError) {
              throw new Error(`Transaction build failed: ${buildError.message}`);
            }

            // Create sponsored transaction
            console.log('Creating sponsored transaction...');
            const sponsoredTx = SuiTransaction.fromKind(txKindBytes);
            sponsoredTx.setSender(pick.address);
            sponsoredTx.setGasOwner(gasOwnerAddress);
            sponsoredTx.setGasPayment([{
              objectId: gasCoin.coinObjectId,
              version: gasCoin.version,
              digest: gasCoin.digest
            }]);

            // Build final transaction bytes
            console.log('Building final transaction...');
            
            if (isUsingZkLogin) {
              // zkLogin signing flow
              console.log('Using zkLogin signing flow...');
              
              // Reconstruct ephemeral keypair first
              if (!zkLoginEphemeralKeyPair || !zkLoginMaxEpoch || !zkLoginJwt || !zkLoginUserSalt) {
                throw new Error('Missing zkLogin data for transaction signing');
              }
              
              console.log('Reconstructing ephemeral keypair...');
              const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(zkLoginEphemeralKeyPair.privateKey);
              
              // Create a new transaction that includes stealth signature
              const zkLoginTx = new SuiTransaction();
              
              // Re-add all the transaction logic for this specific transaction
              // Find coins that sum up to the pick amount
              let remainingAmount = BigInt(Math.floor(pick.amount * (10 ** token.decimals)));
              const coinsToUse = [];

              for (const coin of coins) {
                if (remainingAmount <= 0n) break;
                coinsToUse.push(coin);
                remainingAmount -= BigInt(coin.balance);
              }

              let finalCoin;

              if (coinsToUse.length === 1 && remainingAmount === 0n) {
                // Perfect match - use the coin directly
                finalCoin = zkLoginTx.object(coinsToUse[0].coinObjectId);
              } else {
                // Need to merge or split coins
                if (coinsToUse.length > 1) {
                  // Merge multiple coins into the first one
                  const primaryCoin = zkLoginTx.object(coinsToUse[0].coinObjectId);
                  const otherCoins = coinsToUse.slice(1).map(coin => zkLoginTx.object(coin.coinObjectId));
                  zkLoginTx.mergeCoins(primaryCoin, otherCoins);
                  finalCoin = primaryCoin;
                } else {
                  finalCoin = zkLoginTx.object(coinsToUse[0].coinObjectId);
                }

                // If we have more than needed, split the coin
                if (remainingAmount < 0n) {
                  const exactAmount = BigInt(Math.floor(pick.amount * (10 ** token.decimals)));
                  const [splitCoin] = zkLoginTx.splitCoins(finalCoin, [zkLoginTx.pure.u64(exactAmount)]);
                  finalCoin = splitCoin;
                }
              }

              // Transfer the coins directly
              zkLoginTx.transferObjects([finalCoin], zkLoginTx.pure.address(address));

              // Call announce_withdraw
              zkLoginTx.moveCall({
                target: `${stealthProgramId}::pivy_stealth::announce_withdraw`,
                typeArguments: [pick.mint],
                arguments: [
                  zkLoginTx.pure.u64(BigInt(Math.floor(pick.amount * (10 ** token.decimals)))),
                  zkLoginTx.pure.address(address),
                ],
              });
              
              // Set transaction parameters
              zkLoginTx.setSender(pick.address); // Stealth address is the sender
              zkLoginTx.setGasOwner(zkLoginUserAddress); // zkLogin user pays gas
              zkLoginTx.setGasPayment([{
                objectId: gasCoin.coinObjectId,
                version: gasCoin.version,
                digest: gasCoin.digest
              }]);
              
              // Sign with both stealth keypair and zkLogin
              console.log('Signing with stealth keypair...');
              const stealthSignedTx = await zkLoginTx.sign({
                client: suiClient,
                signer: stealthKP,
              });
              
              // Now sign with zkLogin ephemeral keypair for gas sponsoring
              console.log('Signing with zkLogin ephemeral keypair...');
              const ephemeralSignedTx = await zkLoginTx.sign({
                client: suiClient,
                signer: ephemeralKeyPair,
              });
              
              console.log('Getting ZK proof...');
              const partialZkLoginSignature = await generateZkProof();
              
              // Decode JWT to get sub and aud
              console.log('Decoding JWT...');
              const decodedJwt = jwtDecode(zkLoginJwt);
              
              // Generate address seed
              console.log('Generating address seed...');
              console.log('Raw zkLoginUserSalt:', zkLoginUserSalt);
              
              // Convert base64 salt to BigInt
              let saltBigInt;
              try {
                // If salt is base64 encoded, decode it first
                const saltBytes = atob(zkLoginUserSalt);
                const saltArray = new Uint8Array(saltBytes.length);
                for (let i = 0; i < saltBytes.length; i++) {
                  saltArray[i] = saltBytes.charCodeAt(i);
                }
                // Convert bytes to hex string, then to BigInt
                const saltHex = Array.from(saltArray)
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('');
                saltBigInt = BigInt('0x' + saltHex);
                console.log('Converted salt to BigInt:', saltBigInt.toString());
              } catch (error) {
                console.error('Error converting salt:', error);
                // Fallback: try to use salt directly if it's already a number
                saltBigInt = BigInt(zkLoginUserSalt);
              }
              
              const addressSeed = genAddressSeed(
                saltBigInt,
                'sub',
                decodedJwt.sub,
                decodedJwt.aud,
              ).toString();
              
              // Create zkLogin signature for gas sponsoring
              console.log('Creating zkLogin signature...');
              const zkLoginSignature = getZkLoginSignature({
                inputs: {
                  ...partialZkLoginSignature,
                  addressSeed,
                },
                maxEpoch: zkLoginMaxEpoch,
                userSignature: ephemeralSignedTx.signature,
              });
              
              // Execute transaction with both signatures
              console.log('Executing zkLogin transaction...');
              const zkLoginTxResponse = await suiClient.executeTransactionBlock({
                transactionBlock: stealthSignedTx.bytes,
                signature: [stealthSignedTx.signature, zkLoginSignature],
                requestType: 'WaitForLocalExecution',
              });
              
              console.log(`Transaction for pick ${i + 1} executed:`, zkLoginTxResponse);
              txResults.push({
                index: i + 1,
                pick,
                digest: zkLoginTxResponse.digest,
                success: true,
                response: zkLoginTxResponse
              });
              txDigests.push(zkLoginTxResponse.digest);
            } else {
              // Regular SUI wallet signing flow  
              const finalTxBytes = await sponsoredTx.build({ client: suiClient });

              // Sign and execute immediately
              console.log('Signing transaction...');
              const signatures = [];

              // Get stealth signature
              const stealthSignature = await stealthKP.signTransaction(finalTxBytes);
              signatures.push(stealthSignature.signature);

              // Regular SUI wallet signature
              if (!suiWallet?.signTransaction) {
                throw new Error('SUI wallet not available for signing');
              }
              
              const userSignatureResult = await suiWallet.signTransaction({
                transaction: sponsoredTx
              });
              signatures.push(userSignatureResult.signature);

              // Execute transaction
              console.log('Executing transaction...');
              const txResponse = await suiClient.executeTransactionBlock({
                transactionBlock: finalTxBytes,
                signature: signatures,
                requestType: 'WaitForLocalExecution',
              });

              console.log(`Transaction for pick ${i + 1} executed:`, txResponse);
              txResults.push({
                index: i + 1,
                pick,
                digest: txResponse.digest,
                success: true,
                response: txResponse
              });
              txDigests.push(txResponse.digest);
            }

            // Wait for transaction to be fully confirmed before proceeding
            console.log('Waiting for transaction confirmation...');
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            console.error(`Failed to process pick ${i + 1}:`, error);
            txResults.push({
              index: i + 1,
              pick,
              success: false,
              error: error.message
            });
          }
        }

        // Create combined withdrawal ID
        const withdrawalId = txDigests.join('|');

        // Log comprehensive results
        console.log('=== WITHDRAWAL SUMMARY ===');
        console.log(`Total picks processed: ${picks.length}`);
        console.log(`Successful transactions: ${txResults.filter(r => r.success).length}`);
        console.log(`Failed transactions: ${txResults.filter(r => !r.success).length}`);
        console.log(`Withdrawal ID: ${withdrawalId}`);
        console.log('Transaction details:');

        txResults.forEach(result => {
          if (result.success) {
            console.log(`✅ TX${result.index}: ${result.pick.amount} ${token.symbol} from ${result.pick.address} - ${result.digest}`);
          } else {
            console.log(result)
            console.log(`❌ TX${result.index}: ${result.pick.amount} ${token.symbol} from ${result.pick.address} - ERROR: ${result.error}`);
          }
        });

        console.log('=== END WITHDRAWAL SUMMARY ===');

        // Save the withdrawal group for better UX later
        const withdrawalGroupRes = await axios({
          url: `${import.meta.env.VITE_BACKEND_URL}/user/sui/withdrawal-group`,
          method: 'POST',
          data: {
            withdrawalId: withdrawalId,
          },
          params: {
            chain: walletChainId
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        console.log('Withdrawal group saved:', withdrawalGroupRes.data)

        // Store withdrawal ID and show success if any transactions succeeded
        if (txDigests.length > 0) {
          setLastTxSignature(withdrawalId);
          setShowSuccessDialog(true);
          setIsOpen(false);
        } else {
          throw new Error('All transactions failed');
        }
      }
    } catch (error) {
      console.log('Withdrawal error:', error)
      setError(`Transaction failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (!backdropRef.current) return

    if (showSuccessDialog) {
      // Entry animation
      gsap.fromTo(backdropRef.current,
        {
          backdropFilter: 'blur(0px)',
          opacity: 0
        },
        {
          backdropFilter: 'blur(8px)',
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out'
        }
      )
    } else {
      // Exit animation
      gsap.to(backdropRef.current, {
        backdropFilter: 'blur(0px)',
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      })
    }
  }, [showSuccessDialog])

  return (
    <>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 1,
          delay: index * 0.08,
        }}
      >
        <div className='bg-white p-4 rounded-2xl border-[1.5px] border-gray-200/80 transition-colors group shadow-sm hover:shadow'>
          <div className='flex items-center justify-between gap-3'>
            {/* Token Icon */}
            <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100'>
              {token.imageUrl ? (
                <img
                  src={token.imageUrl}
                  alt={token.name}
                  className='w-full h-full object-cover'
                />
              ) : (
                <span className='text-xl'>💰</span>
              )}
            </div>

            {/* Token Amount and Name */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-baseline gap-2'>
                <p className='text-xl font-bold tracking-tight text-gray-900 truncate'>
                  {token.total.toLocaleString('en-US', { minimumFractionDigits: token.decimals === 6 ? 2 : 4, maximumFractionDigits: token.decimals === 6 ? 2 : 4 })}
                </p>
                <p className='text-lg font-medium text-gray-500'>{token.symbol}</p>
              </div>
              <div className='flex items-baseline justify-between'>
                <p className='text-sm text-gray-500 truncate'>{token.name}</p>
                <p className='text-sm font-medium text-gray-900'>
                  ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Popover
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              placement='bottom'
              classNames={{
                content: "rounded-2xl shadow-xl border border-gray-100",
              }}
            >
              <PopoverTrigger>
                <Button
                  isIconOnly
                  size='md'
                  variant='light'
                  className='-mr-2'
                >
                  <ArrowUpRightIcon className='w-6 h-6 opacity-40' />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="min-w-[18rem] p-4 bg-white rounded-2xl">
                <div className="flex flex-col gap-4 w-full">
                  {/* Header */}
                  <div className="text-lg font-bold tracking-tight text-gray-900">
                    Withdraw {token.symbol}
                  </div>

                  {/* Amount Input */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600 font-medium">Amount to Withdraw</label>
                      <button
                        onClick={() => setAmount(token.total)}
                        className="text-xs px-2 py-1 rounded-xl bg-primary-500 hover:bg-primary-600 text-gray-900 font-semibold transition-colors"
                      >
                        Max
                      </button>
                    </div>
                    <Input
                      type="number"
                      value={amount}
                      onValueChange={(val) => {
                        setAmount(val);
                        setError(null);
                      }}
                      placeholder="0.00"
                      endContent={<span className="text-gray-600">{token.symbol}</span>}
                      classNames={{
                        input: "bg-white",
                        inputWrapper: "border border-gray-100 hover:border-gray-200 bg-white"
                      }}
                    />
                  </div>

                  {/* Address Input */}
                  <div className="w-full">
                    <label className="text-sm text-gray-600 font-medium mb-2 block">Recipient Address</label>
                    <Input
                      type="text"
                      value={address}
                      onValueChange={(val) => {
                        setAddress(val);
                        setError(null);
                      }}
                      placeholder={
                        walletChain === "SOLANA" 
                          ? "Solana wallet address" 
                          : walletChain === "SUI_ZKLOGIN"
                            ? "SUI zkLogin wallet address"
                            : "SUI wallet address"
                      }
                      classNames={{
                        input: "bg-white",
                        inputWrapper: "border border-gray-100 hover:border-gray-200 bg-white"
                      }}
                    />
                  </div>

                  {error && <div className="text-red-500 text-sm -mt-2">{error}</div>}

                  <Button
                    onPress={handleSend}
                    isDisabled={isSending || !amount || !address}
                    isLoading={isSending}
                    className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-bold tracking-tight w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                  >
                    {isSending 
                      ? (totalTxCount > 1 
                          ? `Processing (${currentTxNumber}/${totalTxCount})...` 
                          : 'Processing...')
                      : 'Withdraw Funds'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </motion.div>

      {/* Success Dialog */}
      <Portal>
        <AnimatePresence mode="wait">
          {showSuccessDialog && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              className='z-50 fixed top-0 left-0 w-screen h-screen'
              style={{ position: 'fixed', top: 0, left: 0 }}
            >
              {/* Backdrop with blur */}
              <div
                ref={backdropRef}
                className='absolute inset-0 bg-white/50'
                onClick={() => setShowSuccessDialog(false)}
                style={{
                  backdropFilter: 'blur(0px)',
                  opacity: 0
                }}
              />

              <div className='w-full h-full flex items-center justify-center p-4'>
                <motion.div
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{
                    scale: 1,
                    y: 0,
                    opacity: 1
                  }}
                  exit={{
                    scale: 0.95,
                    y: 10,
                    opacity: 0,
                    transition: {
                      duration: 0.1,
                      ease: "easeOut"
                    }
                  }}
                  transition={{
                    duration: 0.25,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 1
                  }}
                  className='max-w-md w-full p-6 relative nice-card'
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
                    >
                      <CheckCircleIcon className="w-10 h-10 text-green-500" />
                    </motion.div>

                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Woohoo! 🎉
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Your funds are on their way to their new home
                      </p>
                    </div>

                    {/* Token Amount Info */}
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0 border border-gray-100">
                        {token.imageUrl ? (
                          <img
                            src={token.imageUrl}
                            alt={token.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">💰</span>
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold tracking-tight text-gray-900">
                            {amount.toLocaleString('en-US', { minimumFractionDigits: token.decimals === 6 ? 2 : 4, maximumFractionDigits: token.decimals === 6 ? 2 : 4 })}
                          </span>
                          <span className="text-base font-medium text-gray-500">
                            {token.symbol}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ≈ ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="w-full space-y-2">
                      {/* Recipient Address */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Sent to</span>
                        <span className="font-medium text-gray-900">
                          {shortenAddress(address, 4, 4)}
                        </span>
                      </div>

                      {/* Transaction Hash */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Transaction</span>
                        <div className="flex flex-col items-end gap-1">
                          {lastTxSignature.includes('|') ? (
                            // Multiple transactions
                            lastTxSignature.split('|').map((hash, index) => (
                              <a
                                key={hash}
                                href={getExplorerTxLink(hash, walletChainId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-gray-600 transition-colors group"
                              >
                                {shortenAddress(hash, 4, 4)}
                                <ExternalLinkIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              </a>
                            ))
                          ) : (
                            // Single transaction
                            <a
                              href={getExplorerTxLink(lastTxSignature, walletChainId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-gray-600 transition-colors group"
                            >
                              {shortenAddress(lastTxSignature, 4, 4)}
                              <ExternalLinkIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 text-xs text-center text-gray-400">
                        Click the transaction hash to view more details ✨
                      </div>
                    </div>

                    <BounceButton
                      className="tracking-tight font-semibold px-8 py-6 text-lg bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm w-full mt-4"
                      onClick={() => setShowSuccessDialog(false)}

                    >
                      Back
                    </BounceButton>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}

export default function FundsCard() {
  const { balances } = useDashboard()

  // Calculate total USD value
  const totalUsdValue = balances?.tokens?.reduce((acc, token) => acc + token.usdValue, 0) || 0

  return (
    <ColorCard color="primary" className='nice-card p-2 w-full'>
      <AnimatePresence mode="popLayout">
        {!balances ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1,
              duration: 0.2
            }}
            className='p-8 flex flex-col items-center justify-center'
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <SparklesIcon className='w-12 h-12 text-primary-500' />
            </motion.div>
            <div className='mt-4 text-lg font-medium text-gray-900'>
              Loading your balances...
            </div>
            <div className='mt-2 text-sm text-gray-500'>
              This will just take a moment ✨
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1,
            }}
            className='p-4'
          >
            {/* Header with total value */}
            <motion.div
              className='mb-8'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 1,
              }}
            >
              <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
                My Wallet
              </h2>
              <div className='mt-2'>
                <span className='text-4xl font-bold tracking-tighter text-gray-900'>
                  ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className='text-sm text-gray-500 ml-2'>USD</span>
              </div>
            </motion.div>

            {/* Token Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {balances.tokens?.map((token, index) => (
                <TokenCard key={token.mintAddress} token={token} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ColorCard>
  )
}
