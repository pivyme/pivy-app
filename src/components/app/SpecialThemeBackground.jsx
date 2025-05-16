import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const backgroundVariants = {
  initial: {
    opacity: 0,
    scale: 1.1,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      when: "beforeChildren"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.5,
      ease: "easeIn",
      when: "afterChildren"
    }
  }
}

const childrenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.2
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
}

export default function SpecialThemeBackground({
  specialTheme
}) {
  return (
    <AnimatePresence mode="wait">
      {specialTheme === 'default' ? (
        <motion.div
          key="default"
          variants={backgroundVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed w-screen h-screen z-0"
        />
      ) : specialTheme === 'mindblowon' ? (
        <MindblowonBackground key="mindblowon" />
      ) : specialTheme === 'tahilalats' ? (
        <TahilalatsBackground key="tahilalats" />
      ) : specialTheme === 'hai-dudu' ? (
        <HaiDuduBackground key="hai-dudu" />
      ) : null}
    </AnimatePresence>
  )
}

const MindblowonBackground = () => {
  return (
    <motion.div 
      className='fixed w-screen h-screen z-0 bg-[#86d2d6] overflow-hidden'
      variants={backgroundVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <img 
        src="/special-theme/mindblowon/planet.svg" 
        alt="Mindblowon Planet"
        className='w-full h-full object-cover overflow-visible fixed -bottom-[30%] pointer-events-none'
        style={{
          animation: 'spin 30s linear infinite'
        }}
      />

      <motion.img 
        variants={childrenVariants}
        src="/special-theme/mindblowon/white-radial-overlay.png" 
        alt=""
        className='w-full h-full object-cover fixed pointer-events-none'
        animate={{
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          opacity: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      />
    </motion.div>
  )
}

const TahilalatsBackground = () => {
  return (
    <motion.div 
      className='fixed w-screen h-screen z-0 bg-[#f0eae0] overflow-hidden'
      variants={backgroundVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.img 
        variants={childrenVariants}
        src="/special-theme/tahilalats/long-bg.png" 
        alt=""
        className='w-full object-cover h-[35vh] bottom-0 fixed pointer-events-none'
        animate={{
          y: [1, 2, 1],
        }}
        transition={{
          y: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      />

      <motion.img 
        variants={childrenVariants}
        src="/special-theme/tahilalats/flying.png" 
        alt=""
        className='pointer-events-none'
        initial={{ x: "60vw", y: "20vh" }}
        animate={{
          x: ["60vw", "70vw", "75vw", "73vw", "65vw", "80vw", "75vw", "60vw"],
          y: ["20vh", "15vh", "10vh", "18vh", "25vh", "15vh", "20vh", "20vh"],
          rotate: [-2, 2, -2]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
          rotate: {
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse"
          }
        }}
      />
    </motion.div>
  )
}

const HaiDuduBackground = () => {
  return (
    <motion.div 
      className='fixed w-screen h-screen z-0 bg-[#a1e0f6] overflow-hidden'
      variants={backgroundVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        variants={childrenVariants}
        className='w-48 h-48 rounded-full bg-[#fdef7a] fixed left-[8%] top-[12%] z-10'
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 15, -15, 0],
          y: [0, -15, 15, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          boxShadow: '0 0 100px 40px #fdef7a'
        }}
      />
      <motion.img 
        variants={childrenVariants}
        src="/special-theme/hai-dudu/background.png" 
        alt="Hai Dudu Background" 
        className='w-full h-[40vh] object-cover fixed bottom-0 left-0' 
      />
    </motion.div>
  )
}