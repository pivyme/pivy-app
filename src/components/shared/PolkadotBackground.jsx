import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function PolkadotBackground() {
  const COLORS = [
    '#a04eff',
    '#64c6ff',
    '#ffcd6c',
    '#00ca78',
    '#ff4000',
  ]

  const [dots, setDots] = useState([])

  useEffect(() => {
    // Generate random dots on component mount
    const generateDots = () => {
      const newDots = []
      const numDots = Math.floor(window.innerWidth * window.innerHeight / 25000) // Adjust density
      
      for (let i = 0; i < numDots; i++) {
        newDots.push({
          id: i,
          x: Math.random() * 100, // percentage
          y: Math.random() * 100, // percentage
          size: Math.random() * 6 + 4, // 4-10px
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 2, // Random delay for animation
        })
      }
      setDots(newDots)
    }

    generateDots()
    window.addEventListener('resize', generateDots)
    return () => window.removeEventListener('resize', generateDots)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
          }}
          initial={{ scale: 0.8, opacity: 0.1 }}
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.2, 1, 0.2],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            delay: dot.delay,
          }}
        />
      ))}
    </div>
  )
}
