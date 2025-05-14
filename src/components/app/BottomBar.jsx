import React from 'react'
import { HomeIcon, LinkIcon, BellIcon, PlusIcon } from 'lucide-react'
import { Button } from '@heroui/react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

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
    href: '/app',
    activeColor: 'text-primary-600',
    pillColor: 'bg-primary-100'
  },
  {
    label: 'Links',
    icon: <LinkIcon className='w-5 h-5' />,
    href: '/app/links',
    activeColor: 'text-secondary-600',
    pillColor: 'bg-secondary-50'
  },
  {
    label: 'Alerts',
    icon: <BellIcon className='w-5 h-5' />,
    href: '/app/alerts',
    activeColor: 'text-warning-600',
    pillColor: 'bg-warning-50'
  },
]

export default function BottomBar() {
  const location = useLocation()
  const shouldShow = ['/app', '/app/links', '/app/alerts'].includes(location.pathname)

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div 
          className='fixed bottom-0 left-0 right-0 z-50'
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
              <div className='bg-white shadow-lg rounded-full p-1 flex items-center justify-between'>
                {NAVIGATION_ITEMS.map((item) => (
                  <NavItem
                    key={item.label}
                    {...item}
                    isActive={location.pathname === item.href}
                  />
                ))}

                <Button
                  className="bg-[#333333] text-white font-semibold tracking-tight px-6"
                  radius="full"
                  size="lg"
                  startContent={<PlusIcon className="w-5 h-5" />}
                >
                  Create Link
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
