import React, { useState, useEffect, useRef } from 'react'
import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import { LinkIcon, FileIcon, XIcon } from 'lucide-react'
import { CHAINS } from '@/config'
import axios from 'axios'
import { useAuth } from '@/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')        // Remove all non-word chars
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export default function CreateLinkModal({
  open,
  onClose
}) {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkType, setLinkType] = useState(null)
  const [linkName, setLinkName] = useState('')
  const [amountType, setAmountType] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const backdropRef = useRef(null)

  // Get tokens based on environment
  const isTestnet = import.meta.env.VITE_IS_TESTNET === "true"
  const networkTokens = isTestnet ? CHAINS.DEVNET.tokens : CHAINS.MAINNET.tokens
  const [selectedToken, setSelectedToken] = useState(networkTokens[0])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!linkType || !amountType) return

    setIsSubmitting(true)
    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append('type', linkType)
      formData.append('name', linkName)
      formData.append('slug', slugify(linkName))
      formData.append('amountType', amountType)
      if (amountType === 'fixed') {
        formData.append('amount', amount)
        formData.append('token', JSON.stringify(selectedToken))
      }
      if (description) {
        formData.append('description', description)
      }
      if (linkType === 'download' && file) {
        formData.append('file', file)
      }

      // Make API call to create link
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/link/create-link`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          },
          params: {
            chain: import.meta.env.VITE_IS_TESTNET === "true" ? 'DEVNET' : 'MAINNET'
          }
        }
      )

      console.log(response.data)

      // Close modal and navigate to links page
      onClose()
      navigate('/app/links')
    } catch (error) {
      console.error('Failed to create link:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!backdropRef.current) return

    if (open) {
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
  }, [open])

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div 
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          className='z-20 fixed top-0 left-0 w-screen h-screen'
        >
          {/* Backdrop with blur - now using GSAP */}
          <div
            ref={backdropRef}
            className='absolute inset-0 bg-white/50'
            onClick={onClose}
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
              className='max-w-2xl w-full p-6 relative nice-card'
            >
              <motion.button
                initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ 
                  opacity: 0,
                  scale: 0.8,
                  rotate: 180,
                  transition: { duration: 0.2 }
                }}
                transition={{ 
                  delay: 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 20
                }}
                onClick={onClose}
                className='absolute top-4 right-4 p-2 rounded-full hover:bg-background-600/40 transition-colors'
              >
                <XIcon className='w-5 h-5' />
              </motion.button>

              <motion.form 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ 
                  opacity: 0,
                  y: -20,
                  scale: 0.95,
                  transition: { duration: 0.2 }
                }}
                transition={{ 
                  delay: 0.15,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                onSubmit={handleSubmit} 
                className='space-y-6'
              >
                {/* Link Name */}
                <div className='space-y-2'>
                  <label className='text-lg font-semibold tracking-tight'>Link Name</label>
                  <Input
                    placeholder="e.g., design-project"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    size='lg'
                    className='text-base'
                    variant='bordered'
                  />
                  <div className='text-sm text-gray-500'>
                    Your payment URL: {linkName && <span className='font-medium text-primary-600'>{`https://pivy.me/receive/${slugify(linkName)}`}</span>}
                  </div>
                </div>

                {/* Link Type */}
                <div className='space-y-3'>
                  <label className='text-lg font-semibold tracking-tight'>Link Type</label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      type="button"
                      onClick={() => setLinkType('simple')}
                      className='w-full text-left'
                    >
                      <div className={`relative p-4 rounded-xl transition-all ${linkType === 'simple'
                        ? 'bg-white ring-2 ring-black'
                        : 'bg-white border-2 border-black/5 hover:border-black/10'
                        }`}>
                        <div className='flex items-start gap-3'>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${linkType === 'simple' ? 'bg-secondary-200 ' : 'bg-white'
                            }`}>
                            <LinkIcon className={`w-5 h-5 transition-colors ${linkType === 'simple' ? 'text-secondary-600' : 'text-secondary-500'
                              }`} />
                          </div>
                          <div>
                            <div className='text-base font-semibold tracking-tight text-black/70'>Simple Payment</div>
                            <div className='text-xs text-black/50'>Basic payment link with optional fixed amount</div>
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLinkType('download')}
                      className='w-full text-left'
                    >
                      <div className={`relative p-4 rounded-xl transition-all ${linkType === 'download'
                        ? 'bg-white ring-2 ring-black'
                        : 'bg-white border-2 border-black/5 hover:border-black/10'
                        }`}>
                        <div className='flex items-start gap-3'>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${linkType === 'download' ? 'bg-tertiary-200' : 'bg-white'
                            }`}>
                            <FileIcon className={`w-5 h-5 transition-colors ${linkType === 'download' ? 'text-tertiary-600' : 'text-tertiary-500'
                              }`} />
                          </div>
                          <div>
                            <div className='text-base font-semibold tracking-tight text-black/70'>Digital Download</div>
                            <div className='text-xs text-black/50'>Deliver files automatically after payment</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className='space-y-3'>
                  <label className='text-lg font-semibold tracking-tight'>Amount</label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      type="button"
                      onClick={() => setAmountType('fixed')}
                      className='w-full text-left'
                    >
                      <div className={`relative p-3 rounded-xl transition-all h-[104px] ${amountType === 'fixed'
                        ? 'bg-white ring-2 ring-black'
                        : 'bg-white border-2 border-black/5 hover:border-black/10'
                        }`}>
                        <div className='flex flex-col gap-2'>
                          <div className='flex items-center gap-2'>
                            <div className='text-base'>🎯</div>
                            <div className='text-base font-semibold tracking-tight text-black/70'>Fixed Amount</div>
                          </div>
                          {amountType === 'fixed' ? (
                            <div className='flex gap-2'>
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button
                                    variant="bordered"
                                    className="px-2 border border-black/10"
                                    size='md'
                                    style={{
                                      height: 'unset'
                                    }}
                                  >
                                    <div className='flex items-center gap-2'>
                                      <img
                                        src={selectedToken.image}
                                        alt={selectedToken.symbol}
                                        className="w-5 h-5 object-contain"
                                      />
                                      <span className="text-sm font-medium">{selectedToken.symbol}</span>
                                    </div>
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                  aria-label="Token selection"
                                  variant="faded"
                                  selectionMode="single"
                                  selectedKeys={new Set([selectedToken.symbol])}
                                  onSelectionChange={(keys) => {
                                    const selected = networkTokens.find(t => t.symbol === Array.from(keys)[0])
                                    if (selected) setSelectedToken(selected)
                                  }}
                                >
                                  {networkTokens.map((token) => (
                                    <DropdownItem
                                      key={token.symbol}
                                      startContent={
                                        <img
                                          src={token.image}
                                          alt={token.symbol}
                                          className="w-5 h-5 object-contain"
                                        />
                                      }
                                    >
                                      {token.symbol}
                                    </DropdownItem>
                                  ))}
                                </DropdownMenu>
                              </Dropdown>
                              <Input
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                type="text"
                                size='lg'
                                className='flex-1'
                              />
                            </div>
                          ) : (
                            <div className='text-xs text-black/50'>Set a specific payment amount</div>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAmountType('open')}
                      className='w-full text-left'
                    >
                      <div className={`relative p-3 rounded-xl transition-all h-[104px] ${amountType === 'open'
                        ? 'bg-white ring-2 ring-black'
                        : 'bg-white border-2 border-black/5 hover:border-black/10'
                        }`}>
                        <div className='flex flex-col gap-2'>
                          <div className='flex items-center gap-2'>
                            <div className='text-base'>✨</div>
                            <div className='text-base font-semibold tracking-tight text-black/70'>Open Amount</div>
                          </div>
                          <div className='text-xs text-black/50'>Let the payer decide how much to send</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* File Upload for Digital Download */}
                {linkType === 'download' && (
                  <div className='space-y-3'>
                    <label className='text-lg font-semibold tracking-tight'>Upload File</label>
                    <div
                      className='bg-white border-2 border-black/5 hover:border-black/10 rounded-xl p-6 text-center cursor-pointer transition-colors'
                      onClick={() => document.getElementById('file-input').click()}
                    >
                      <input
                        id="file-input"
                        type="file"
                        className='hidden'
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                      {file ? (
                        <div>
                          <div className='text-base font-semibold tracking-tight text-black/70'>{file.name}</div>
                          <div className='text-xs text-black/50 mt-1'>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      ) : (
                        <div>
                          <div className='text-xl mb-2'>📄</div>
                          <div className='text-base font-semibold tracking-tight text-black/70'>Drag and drop or click to upload</div>
                          <div className='text-xs text-black/50 mt-1'>Max size: 100MB</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className='space-y-3'>
                  <label className='text-lg font-semibold tracking-tight'>Description (optional)</label>
                  <textarea
                    className='w-full bg-white rounded-xl border-2 border-black/5 px-4 py-3 text-base outline-none focus:ring-2 ring-black min-h-[100px] placeholder-black/30'
                    placeholder="Add details about this payment link"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className='w-full font-semibold tracking-tight text-base py-6'
                  isDisabled={!linkType || !amountType || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Create Payment Link
                </Button>
              </motion.form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

