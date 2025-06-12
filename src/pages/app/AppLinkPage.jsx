import { useAuth } from '@/providers/AuthProvider'
import axios from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@heroui/react'
import { LinkIcon, WalletIcon } from 'lucide-react'
import { CHAINS } from '@/config'
import ColorCard from '@/components/elements/ColorCard'
import AnimateComponent from '@/components/elements/AnimateComponent'
import { linkEvents } from '@/lib/events'
import CreateLinkModal from '@/components/app/CreateLinkModal'
import QRModal from '../../components/shared/QRModal'
import LinkItem from '@/components/app/LinkItem'

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
                <LinkItem
                  key={link.tag}
                  link={link}
                  index={index}
                  copiedLinkId={copiedLinkId}
                  onCopyLink={handleCopyLink}
                  onEditLink={handleEditLink}
                  onQRClick={setSelectedQRLink}
                  getDisplayLink={getDisplayLink}
                  getActualLink={getActualLink}
                  getPaymentTypeLabel={getPaymentTypeLabel}
                />
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
