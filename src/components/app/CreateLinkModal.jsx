import React, { useState, useEffect, useRef } from 'react'
import { Button, Input, Popover, PopoverTrigger, PopoverContent, DropdownItem, DropdownMenu, Dropdown, DropdownTrigger } from '@heroui/react'
import { LinkIcon, FileIcon, XIcon, SmileIcon, PaintbrushIcon, SparklesIcon, TrashIcon } from 'lucide-react'
import { CHAINS, SPECIAL_THEMES } from '@/config'
import axios from 'axios'
import { useAuth } from '@/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { sleep } from '@/utils/process'
import { COLORS } from '@/config'
import { linkEvents } from '@/lib/events'
import { useDashboard } from '@/contexts/DashboardContext'
import Modal from '@/components/shared/Modal'

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
  onClose,
  editLink = null
}) {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkType, setLinkType] = useState(null)
  const [linkName, setLinkName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🔗')
  const [selectedColor, setSelectedColor] = useState('gray')
  const [customizePopoverOpen, setCustomizePopoverOpen] = useState(false)
  const [amountType, setAmountType] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const backdropRef = useRef(null)
  const [showSpecialThemes, setShowSpecialThemes] = useState(false)
  const [selectedSpecialTheme, setSelectedSpecialTheme] = useState(null)

  // Get tokens based on environment
  const isTestnet = import.meta.env.VITE_IS_TESTNET === "true"
  const networkTokens = isTestnet ? CHAINS.DEVNET.tokens : CHAINS.MAINNET.tokens
  const [selectedToken, setSelectedToken] = useState(networkTokens[0])

  // Load link data when editing
  useEffect(() => {
    if (editLink) {
      // Set all form fields synchronously to avoid flicker
      const updates = {
        linkType: editLink.type.toLowerCase(),
        linkName: editLink.label || editLink.tag || '',
        emoji: editLink.emoji || '🔗',
        color: editLink.backgroundColor || 'gray',
        amountType: editLink.amountType?.toLowerCase() || null,
        amount: editLink.amount || '',
        description: editLink.description || '',
        showThemes: editLink.specialTheme && editLink.specialTheme !== 'default',
        specialTheme: editLink.specialTheme === 'default' ? null : editLink.specialTheme,
      }

      // Apply all updates at once to minimize re-renders
      setLinkType(updates.linkType)
      setLinkName(updates.linkName)
      setSelectedEmoji(updates.emoji)
      setSelectedColor(updates.color)
      setAmountType(updates.amountType)
      setAmount(updates.amount)
      setDescription(updates.description)
      setShowSpecialThemes(updates.showThemes)
      setSelectedSpecialTheme(updates.specialTheme)
      
      // Set token if exists
      if (editLink.mint) {
        const token = networkTokens.find(t => t.symbol === editLink.mint.symbol)
        if (token) setSelectedToken(token)
      }
    }
  }, [editLink])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      // Delay form reset until after close animation
      setTimeout(handleResetForm, 300)
    }
  }, [open])

  // Predefined emojis and colors
  const emojis = ['🔗', '💫', '🌟', '✨', '💎', '🎯', '🎨', '🎭', '🎪', '🎢', '🎡', '🎠', '🎮', '🎲', '🎰', '��']
  const colors = COLORS.map(color => ({
    id: color.id,
    value: color.light
  }))

  const getColorValue = (colorId) => {
    return colors.find(c => c.id === colorId)?.value || colors[0].value
  }

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
      formData.append('emoji', selectedEmoji)
      formData.append('backgroundColor', selectedColor)
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
      if (selectedSpecialTheme && showSpecialThemes) {
        formData.append('specialTheme', selectedSpecialTheme)
      } else {
        formData.append('specialTheme', 'default')
      }

      // Make API call to create or update link
      const endpoint = editLink 
        ? `${import.meta.env.VITE_BACKEND_URL}/link/update-link/${editLink.id}`
        : `${import.meta.env.VITE_BACKEND_URL}/link/create-link`

      const response = await axios.post(
        endpoint,
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

      // Close modal and navigate to links page
      onClose()
      navigate('/links')

      handleResetForm()

      // Emit link created/updated event
      linkEvents.emit()

    } catch (error) {
      console.error('Failed to save link:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editLink) return
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this payment link? This action cannot be undone.')) {
      return
    }

    setIsSubmitting(true)
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/link/delete-link/${editLink.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      // Close modal and navigate to links page
      onClose()
      navigate('/links')

      handleResetForm()

      // Emit link deleted event
      linkEvents.emit()

    } catch (error) {
      console.error('Failed to delete link:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setLinkType(null)
    setLinkName('')
    setSelectedEmoji('🔗')
    setSelectedColor('gray')
    setAmountType(null)
    setAmount('')
    setDescription('')
    setFile(null)
    setIsSubmitting(false)
    setSelectedSpecialTheme(null)
    setShowSpecialThemes(false)
    setSelectedToken(networkTokens[0])
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
    <Modal
      isOpen={open}
      onClose={onClose}
      maxWidth="42rem"
    >
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
        {/* Link Name and Customization */}
        <div className='space-y-2'>
          <label className='text-lg font-semibold tracking-tight'>Link Name & Style</label>
          <div className='flex gap-2'>
            {/* Combined Emoji and Color Picker */}
            <Popover 
              isOpen={customizePopoverOpen}
              onOpenChange={setCustomizePopoverOpen}
            >
              <PopoverTrigger>
                <Button
                  variant="bordered"
                  isIconOnly
                  size='lg'
                  className="aspect-square p-0 border border-black/10 overflow-hidden"
                  style={{
                    borderRadius: '100%',
                    backgroundColor: getColorValue(selectedColor)
                  }}
                >
                  <span className="text-2xl">{selectedEmoji}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-fit">
                <div className="p-4 space-y-4">
                  {/* Emoji Grid */}
                  <div>
                    <div className="text-sm font-medium mb-2">Choose Emoji</div>
                    <div className="grid grid-cols-4 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`flex items-center justify-center p-2 rounded-lg hover:bg-black/5 transition-colors ${
                            selectedEmoji === emoji ? 'ring-2 ring-black' : ''
                          }`}
                        >
                          <span className="text-2xl">{emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Grid */}
                  <div>
                    <div className="text-sm font-medium mb-2">Choose Color</div>
                    <div className="grid grid-cols-4 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedColor(color.id)}
                          className={`w-12 h-12 rounded-lg transition-all ${
                            selectedColor === color.id ? 'ring-2 ring-black scale-95' : 'hover:scale-95'
                          }`}
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Input
              placeholder="e.g., design-project"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              size='lg'
              className='text-base flex-1'
              variant='bordered'
            />
          </div>
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
                          {/* More to come */}
                          <DropdownItem className='cursor-not-allowed'>
                            <div className='text-xs text-gray-500/60 text-center w-full'>
                              More tokens to come! 🔥
                            </div>
                          </DropdownItem>
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

        {/* Special Themes Section */}
        <div className='space-y-3'>
          {/* Initial State */}
          <div 
            className={`flex items-center justify-between p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
              showSpecialThemes ? 'border-primary-300 bg-primary-50' : 'border-black/5 hover:border-primary-200 hover:bg-primary-50/50'
            }`}
            onClick={() => setShowSpecialThemes(!showSpecialThemes)}
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center'>
                <SparklesIcon className='w-5 h-5 text-primary-600' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Wanna spice up your link?</h3>
                <p className='text-sm text-gray-500'>Add some Indonesian creative flair to your payment link</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md border-2 transition-colors flex items-center justify-center ${
              showSpecialThemes ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
            }`}>
              {showSpecialThemes && <span className='text-white text-lg'>✓</span>}
            </div>
          </div>

          {/* Expanded State */}
          <AnimatePresence>
            {showSpecialThemes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className='overflow-hidden'
              >
                <div className='space-y-4 pt-2'>
                  <div className='text-sm text-gray-500'>
                    Special themes are powered by Indonesian 🇮🇩 creative IPs from{' '}
                    <a 
                      href="https://infiacorp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className='text-black font-medium hover:underline'
                    >
                      Infia Group
                    </a>
                  </div>

                  <div className='grid grid-cols-3 gap-3'>
                    {SPECIAL_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedSpecialTheme(theme.id === selectedSpecialTheme ? null : theme.id)}
                        className={`relative p-3 rounded-xl border-2 transition-all ${
                          theme.id === selectedSpecialTheme 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-100 hover:border-primary-200'
                        }`}
                      >
                        <div className='flex flex-col items-center gap-2'>
                          <img 
                            src={theme.icon} 
                            alt={theme.name}
                            className='w-12 h-12 object-contain'
                          />
                          <span className='text-sm font-medium text-gray-900'>
                            {theme.name}
                          </span>
                        </div>
                        {theme.id === selectedSpecialTheme && (
                          <div className='absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center'>
                            <span className='text-white text-xs'>✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          color="primary"
          size="lg"
          className='w-full font-semibold tracking-tight text-base py-6'
          isDisabled={!linkType || !amountType || isSubmitting}
          isLoading={isSubmitting}
        >
          {editLink ? 'Update Payment Link' : 'Create Payment Link'}
        </Button>

        {/* Delete Button - Only show when editing */}
        {editLink && (
          <Button
            type="button"
            color="danger"
            variant="light"
            size="lg"
            className='w-full font-semibold tracking-tight text-base py-6  transition-colors'
            isDisabled={isSubmitting}
            onClick={handleDelete}
            startContent={<TrashIcon className="w-4 h-4" />}
          >
            Delete Link
          </Button>
        )}
      </motion.form>
    </Modal>
  )
}

