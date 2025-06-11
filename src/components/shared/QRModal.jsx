import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import ColorCard from '../elements/ColorCard';
import Modal from './Modal';

export default function QRModal({ isOpen, onClose, url, label, color, emoji }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="24rem">
      <div className="flex flex-col items-center text-center">
        {/* Emoji and Title */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mb-6"
        >
          <div className="text-4xl mb-2">{emoji}</div>
          <h3 className="text-xl font-semibold">{label}</h3>
          <p className="text-gray-500 text-sm mt-1">Scan to open payment link</p>
        </motion.div>

        {/* QR Code */}
        <ColorCard className='p-2 rounded-2xl' color={color} >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_8px_-2px_rgba(0,0,0,0.05)]"
          >
            <QRCodeSVG
              value={url}
              size={220}
              level="H"
              includeMargin={true}
            />
          </motion.div>
        </ColorCard>

        {/* URL Display */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-sm text-gray-500 break-all px-4 font-mono bg-gray-50/80 py-2 rounded-xl"
        >
          {url}
        </motion.p>

        {/* Logo */}
        <motion.img
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          src="/pivy-horizontal-logo.svg"
          alt="Pivy"
          className="w-[6rem] mt-8 opacity-50"
        />
      </div>
    </Modal>
  );
} 