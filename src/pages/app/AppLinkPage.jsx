import { useAuth } from '@/providers/AuthProvider'
import axios from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@heroui/react'
import { ArrowUpRightIcon, CopyIcon, LinkIcon, WalletIcon, FileIcon, PencilIcon, QrCodeIcon } from 'lucide-react'
import { COLORS, CHAINS, SPECIAL_THEMES } from '@/config'
import ColorCard from '@/components/elements/ColorCard'
import AnimateComponent from '@/components/elements/AnimateComponent'
import { linkEvents } from '@/lib/events'
import { AnimatePresence, motion } from 'framer-motion'
import CreateLinkModal from '@/components/app/CreateLinkModal'
import QRModal from '../../components/shared/QRModal'

export default function AppLinkPage() {
  const { accessToken } = useAuth()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedLinkId, setCopiedLinkId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const timeoutRef = useRef(null)
  const [selectedQRLink, setSelectedQRLink] = useState(null)

  // Get tokens based on environment
  const isTestnet = import.meta.env.VITE_IS_TESTNET === "true"
  const networkTokens = isTestnet ? CHAINS.DEVNET.tokens : CHAINS.MAINNET.tokens

  const getDisplayLink = (link) => {
    return `pivy.me/${link.user.username}${link.tag ? `/${link.tag}` : ''}`
  }

  const getActualLink = (link) => {
    const origin = window.location.origin
    return `${origin}/${link.user.username}${link.tag ? `/${link.tag}` : ''}`
  }

  const handleFetchLinks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/link/my-links`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      console.log('my links', response.data)
      // Deduplicate links by tag since we get preview and non-preview versions
      const uniqueLinks = response.data.reduce((acc, link) => {
        if (!acc[link.tag]) {
          acc[link.tag] = link
        }
        return acc
      }, {})

      setLinks(Object.values(uniqueLinks))
    } catch (error) {
      console.error('Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleFetchLinks()

    // Subscribe to link creation events
    const unsubscribe = linkEvents.subscribe(() => {
      handleFetchLinks()
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  const handleCopyLink = async (link) => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      await navigator.clipboard.writeText(getActualLink(link))
      setCopiedLinkId(link.id)
      timeoutRef.current = setTimeout(() => {
        setCopiedLinkId(null)
        timeoutRef.current = null
      }, 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getPaymentTypeLabel = (link) => {
    if (link.type === 'DOWNLOAD') return 'File Download'
    if (link.amountType === 'FIXED') return 'Fixed Amount'
    return 'Open Amount'
  }

  const handleEditLink = async (link) => {
    setEditingLink(link)
    // Wait a bit to let the form populate before showing the modal
    await new Promise(resolve => setTimeout(resolve, 100))
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Clear editing link after modal closes
    setTimeout(() => {
      setEditingLink(null)
    }, 300) // Wait for modal close animation to finish
  }

  return (
    <div className="container max-w-2xl mx-auto z-50 py-14 pt-[10rem] pb-[15rem] px-2 md:px-0">
      <div className="flex flex-col gap-12">
        {/* Header Section */}
        <AnimateComponent>
          <div className="flex flex-col gap-2">
            <h1 className='font-bold tracking-tight text-3xl text-gray-900'>
              Payment Links ✨
            </h1>
            <p className="text-gray-600">
              Share these links to receive payments securely and privately
            </p>
          </div>
        </AnimateComponent>

        <AnimateComponent delay={200}>
          {loading ? (
            <div className="p-8 text-center nice-card">
              <div className="flex flex-col items-center gap-4">
                <WalletIcon className="w-12 h-12 text-primary-500" />
                <p className="text-gray-600 text-sm animate-pulse">Loading your payment links...</p>
              </div>
            </div>
          ) : links.length === 0 ? (
            // Empty State
            <ColorCard color="blue" className="nice-card p-2">
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <LinkIcon className="w-12 h-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">No payment links yet</h3>
                    <p className="text-gray-600 mt-1">Create your first payment link to start receiving payments</p>
                  </div>
                  <Button
                    color="primary"
                    radius="full"
                    className="mt-4 font-medium tracking-tight"
                    startContent={<LinkIcon className="w-4 h-4" />}
                  >
                    Create Payment Link
                  </Button>
                </div>
              </div>
            </ColorCard>
          ) : (
            // Links Grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {links.map((link, index) => (
                <AnimateComponent key={link.tag} delay={175 + (index * 50)} className='h-full flex flex-col'>
                  <ColorCard
                    color={link.isPersonalLink ? 'primary' : link.backgroundColor}
                    className="nice-card p-2 h-full"
                  >
                    <div className="p-4">
                      {/* Link Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm relative"
                            style={{ backgroundColor: COLORS.find(c => c.id === link.backgroundColor)?.light }}
                          >
                            <span className="text-xl">{link.emoji}</span>
                            {link.specialTheme && link.specialTheme !== 'default' && (
                              <div
                                className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white shadow-sm p-0 border border-gray-100 overflow-hidden"
                                title={`${SPECIAL_THEMES.find(t => t.id === link.specialTheme)?.name || 'Special'} Theme`}
                              >
                                <img
                                  src={SPECIAL_THEMES.find(t => t.id === link.specialTheme)?.icon}
                                  alt="Theme"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{link.label || link.tag}</h3>
                            <p className="text-sm text-gray-500">{getPaymentTypeLabel(link)}</p>
                          </div>
                        </div>
                        {link.isPersonalLink === false &&
                          <Button
                            isIconOnly
                            variant="light"
                            radius="full"
                            className="text-gray-400 hover:text-black"
                            onClick={() => handleEditLink(link)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        }
                      </div>

                      {/* Link Details */}
                      <div className="space-y-3">
                        {/* Payment URL with Copy and QR Buttons */}
                        <div
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 rounded-xl text-sm border border-black/5 group cursor-pointer hover:bg-gray-100/80 transition-colors"
                          onClick={() => window.open(getActualLink(link), '_blank')}
                        >
                          <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
                          <span className="text-gray-600 font-medium flex-1 group-hover:text-gray-900 truncate">
                            {getDisplayLink(link)}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              isIconOnly
                              variant="flat"
                              radius="full"
                              size="sm"
                              className="text-gray-500 hover:text-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQRLink(link);
                              }}
                            >
                              <QrCodeIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              isIconOnly
                              variant="flat"
                              radius="full"
                              size="sm"
                              className="text-gray-500 hover:text-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink(link);
                              }}
                              isDisabled={copiedLinkId === link.id}
                            >
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={copiedLinkId === link.id ? 'check' : 'copy'}
                                  initial={{ opacity: 0, scale: 0.7 }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    rotate: copiedLinkId === link.id ? [0, 10, -5, 0] : 0
                                  }}
                                  exit={{ opacity: 0, scale: 0.7 }}
                                  transition={{
                                    duration: 0.15,
                                    ease: [0.23, 1.2, 0.32, 1],
                                  }}
                                >
                                  {copiedLinkId === link.id ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="w-3.5 h-3.5 text-green-500"
                                    >
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                  ) : (
                                    <CopyIcon className="w-3.5 h-3.5" />
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            </Button>
                          </div>
                        </div>

                        {/* File Info (if download type) */}
                        {link.type === 'DOWNLOAD' && link.file && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 rounded-xl text-sm border border-black/5">
                            <FileIcon className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                              <span className="text-gray-900 font-medium">{link.file.filename}</span>
                              <span className="text-gray-500 text-xs ml-2">
                                {(link.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Amount Info (if fixed) */}
                        {link.amountType === 'FIXED' && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 rounded-xl text-sm border border-black/5">
                            <div className="flex items-center gap-3 flex-1">
                              {link.mint?.imageUrl ? (
                                <img
                                  src={link.mint.imageUrl}
                                  alt={link.mint.symbol}
                                  className="w-5 h-5 rounded-full"
                                />
                              ) : (
                                <WalletIcon className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="font-medium text-gray-900">
                                {link.amount}
                                <span className="text-gray-500 ml-1">
                                  {link.mint?.symbol || 'tokens'}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ColorCard>
                </AnimateComponent>
              ))}
            </div>
          )}
        </AnimateComponent>
      </div>

      <CreateLinkModal
        open={isModalOpen}
        onClose={handleCloseModal}
        editLink={editingLink}
      />

      {/* QR Code Modal */}
      <QRModal
        isOpen={!!selectedQRLink}
        onClose={() => setSelectedQRLink(null)}
        url={selectedQRLink ? getActualLink(selectedQRLink) : ''}
        label={selectedQRLink ? (selectedQRLink.label || selectedQRLink.tag) : ''}
        color={selectedQRLink?.isPersonalLink ? 'primary' : selectedQRLink?.backgroundColor}
        emoji={selectedQRLink?.emoji}
      />
    </div>
  )
}
