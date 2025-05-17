import React, { useState } from 'react'
import { HomeIcon, LinkIcon, BellIcon, PlusIcon } from 'lucide-react'
import { Button } from '@heroui/react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BounceButton from '@/components/elements/BounceButton'

const NavItem = ({ href, icon, label, activeColor, pillColor, isActive }) => (
  <Link to={href} className='relative'>
    <motion.div
      animate={{
        scale: isActive ? 1 : 0.95,
        opacity: isActive ? 1 : 0.5
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 15,
      }}
    >
      <div className={`flex flex-row items-center gap-2 px-6 py-2 rounded-full ${isActive ? pillColor : ''}`}>
        <div className={isActive ? activeColor : 'text-gray-600'}>
          {icon}
        </div>
        <p className={`text-lg font-semibold ${isActive ? activeColor : 'text-gray-600'}`}>
          {label}
        </p>
      </div>
    </motion.div>
  </Link>
)

const NAVIGATION_ITEMS = [
  {
    label: 'Home',
    icon: <HomeIcon className='w-5 h-5' />,
    href: '/',
    activeColor: 'text-primary-600',
    pillColor: 'bg-primary-100'
  },
  {
    label: 'Links',
    icon: <LinkIcon className='w-5 h-5' />,
    href: '/links',
    activeColor: 'text-secondary-600',
    pillColor: 'bg-secondary-50'
  },
  // {
  //   label: 'Alerts',
  //   icon: <BellIcon className='w-5 h-5' />,
  //   href: '/alerts',
  //   activeColor: 'text-warning-600',
  //   pillColor: 'bg-warning-50'
  // },
]

export default function BottomBar({
  isCreateLinkModalOpen,
  setIsCreateLinkModalOpen
}) {
  const location = useLocation()
  const shouldShow = ['/', '/links', '/alerts'].includes(location.pathname)

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div 
          className='fixed bottom-0 left-0 right-0 bottom-[1rem] z-50'
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
        >
          <div className='container w-fit mx-auto'>
            <div className='mx-2 mb-4'>
              <div className='bg-white shadow-lg rounded-full p-1 flex items-center justify-between gap-2'>
                {NAVIGATION_ITEMS.map((item) => (
                  <NavItem
                    key={item.label}
                    {...item}
                    isActive={location.pathname === item.href}
                  />
                ))}

                <BounceButton
                  className="bg-[#333333] text-white font-semibold tracking-tight px-6 shadow-lg hover:shadow-xl transition-shadow"
                  startContent={<PlusIcon className="w-5 h-5" />}
                  onPress={() => setIsCreateLinkModalOpen(true)}
                >
                  Create Link
                </BounceButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
