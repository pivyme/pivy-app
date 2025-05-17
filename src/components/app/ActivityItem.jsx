import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon, ChevronDownIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { COLORS } from '@/config';
import { getExplorerAccountLink, getExplorerTxLink, shortenAddress } from '@/utils/misc';

export default function ActivityItem({ activity, isExpanded, onToggle }) {
  // Helper function to format amount based on decimals
  const formatAmount = (amount, decimals) => {
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: decimals });
  };

  // Get the token details - handle both structures
  const token = activity.type === 'WITHDRAWAL' ? activity.tokens[activity.token.symbol] : activity.token;
  const amount = formatAmount(activity.amount, token.decimals);

  // Get the relevant address based on type
  const relevantAddress = activity.type === 'WITHDRAWAL' 
    ? activity.destinationPubkey 
    : activity.from;

  const isIncoming = activity.type === 'PAYMENT';

  // Find the color config for the link's backgroundColor
  const getColorConfig = (colorId) => {
    return COLORS.find(color => color.id === colorId) || COLORS.find(color => color.id === 'gray');
  };

  const linkColor = activity.link?.backgroundColor
    ? getColorConfig(activity.link.backgroundColor)
    : getColorConfig('gray');

  const linkStyles = "font-mono text-gray-700 hover:text-gray-900 hover:underline transition-colors flex items-center gap-1";

  return (
    <motion.div
      layout
      className={`w-full overflow-hidden rounded-2xl border transition-colors ${
        isExpanded ? 'bg-white border-gray-200' : 'bg-gray-50/50 border-transparent hover:bg-gray-100/80'
      }`}
    >
      {/* Header - Always visible */}
      <motion.div
        layout="position"
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          {/* Transaction Type Indicator */}
          <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
            {isIncoming ? (
              <ArrowDownIcon className="w-5 h-5 text-green-600" />
            ) : (
              <ArrowUpIcon className="w-5 h-5 text-red-600" />
            )}
          </div>

          {/* Amount and Token Info */}
          <div className="flex items-center gap-3">
            {token.imageUrl ? (
              <img
                src={token.imageUrl}
                alt={token.symbol}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                💰
              </div>
            )}
            <div>
              <p className="font-semibold text-lg text-gray-900">
                {amount} {token.symbol}
              </p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(activity.timestamp * 1000, { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Label Badge */}
          {activity.link?.label && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: linkColor.light,
                color: linkColor.value,
              }}
            >
              <span>{activity.link.emoji}</span>
              <span>{activity.link.label}</span>
            </div>
          )}

          {/* Expand/Collapse Icon */}
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-3 text-sm text-gray-600">
              <div className="h-px bg-gray-100" />

              {/* Transaction Details */}
              <div className="space-y-0 pt-2">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-500">Tx Hash</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={getExplorerTxLink(activity.id, activity.chain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkStyles}
                    >
                      {shortenAddress(activity.id, 8, 8)}
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-500">{isIncoming ? 'From' : 'To'}</span>
                  <a
                    href={getExplorerAccountLink(relevantAddress, activity.chain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkStyles}
                  >
                    {shortenAddress(relevantAddress, 4, 4)}
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Link Details - Only for Payment type */}
                {/* {activity.type === 'PAYMENT' && activity.link && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-500">Payment Link</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{activity.link.emoji}</span>
                      <span className="text-gray-900">{activity.link.label}</span>
                    </div>
                  </div>
                )} */}

                {/* <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-500">Network</span>
                  <span className="font-medium text-gray-700">{activity.chain}</span>
                </div> */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 