import React, { useState, useRef, useEffect } from 'react'
import { Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react'
import { ArrowUpRightIcon, CopyIcon, LinkIcon, WalletIcon, FileIcon, PencilIcon, QrCodeIcon, BarChart3Icon, EyeIcon } from 'lucide-react'
import ColorCard from '@/components/elements/ColorCard'
import AnimateComponent from '@/components/elements/AnimateComponent'
import { AnimatePresence, motion } from 'framer-motion'
import { SPECIAL_THEMES, COLORS } from '@/config';
import { formatUiNumber } from '@/utils/formatting'

export default function LinkItem({
  link,
  index,
  copiedLinkId,
  onCopyLink,
  onEditLink,
  onQRClick,
  getDisplayLink,
  getActualLink,
  getPaymentTypeLabel
}) {
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const formatTokenAmount = (amount, decimals) => {
    const divisor = Math.pow(10, decimals)
    const humanAmount = parseFloat(amount) / divisor
    return humanAmount.toLocaleString()
  }

  const StatsContent = () => (
    <div className="w-72 p-1">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <BarChart3Icon className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-gray-900">Statistics</span>
        </div>

        {/* Overview Stats */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <EyeIcon className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {formatUiNumber(link.stats?.viewCount || link.viewCount || 0, '', {
                  humanize: true,
                  humanizeThreshold: 1000
                })}
              </span>
              <span className="text-xs text-gray-500">views</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{link.stats?.totalPayments || 0}</span>
            <span className="text-xs text-gray-500">payments</span>
          </div>
        </div>

        {/* Payment Breakdown */}
        {link.stats?.paymentStats && link.stats.paymentStats.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2 px-1">Payment Breakdown</h4>
            <div className="space-y-1.5">
              {link.stats.paymentStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {stat.token?.imageUrl ? (
                      <img
                        src={stat.token.imageUrl}
                        alt={stat.token.symbol}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <WalletIcon className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {stat.token?.symbol || 'Token'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatTokenAmount(stat.amount, stat.token?.decimals || 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stat.count} payment{stat.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No payments message */}
        {(!link.stats?.paymentStats || link.stats.paymentStats.length === 0) && (
          <div className="text-center py-3">
            <WalletIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-500">No payments received yet</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">{getPaymentTypeLabel(link)}</p>
                  {/* View Count */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <EyeIcon className="w-3 h-3" />
                    <span>
                      {formatUiNumber(link.stats?.viewCount || link.viewCount || 0, '', {
                        humanize: true,
                        humanizeThreshold: 1000
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Stats Button */}
              <Popover placement="bottom-end" showArrow>
                <PopoverTrigger>
                  <Button
                    isIconOnly
                    variant="light"
                    radius="full"
                    size='sm'
                    className="text-gray-400 hover:text-black p"
                  >
                    <BarChart3Icon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2">
                  <StatsContent />
                </PopoverContent>
              </Popover>

              {/* Edit Button */}
              {link.isPersonalLink === false && (
                <Button
                  isIconOnly
                  variant="light"
                  radius="full"
                  className="text-gray-400 hover:text-black"
                  onClick={() => onEditLink(link)}
                  size='sm'
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
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
                    onQRClick(link);
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
                    onCopyLink(link);
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
  )
} 