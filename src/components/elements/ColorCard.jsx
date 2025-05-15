import React from 'react'
import { COLORS } from '@/config'

export default function ColorCard({
  children,
  className = '',
  color = 'blue',
  onClick,
  hoverEffect = true
}) {
  // Special case for primary color
  if (color === 'primary') {
    return (
      <div
        className={`relative flex flex-col overflow-hidden transition-all ${hoverEffect ? 'hover:shadow-lg' : ''} ${className}`}
        onClick={onClick}
        style={{
          background: `linear-gradient(135deg, #1bff6a -10%, #aeffcb 130%)`,
        }}
      >
        {/* Decorative corner accent */}
        <div 
          className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 rotate-45 opacity-40 blur-2xl"
          style={{ background: '#00e950' }}
        />

        {/* White background container */}
        <div className="relative h-full bg-white/90 backdrop-blur-md m-[2px] rounded-[14px] shadow-sm">
          {children}
        </div>
      </div>
    )
  }

  // Default case for other colors
  const colorObj = COLORS.find(c => c.id === color) || COLORS[0]

  return (
    <div
      className={`relative flex flex-col overflow-hidden transition-all ${hoverEffect ? 'hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${colorObj.value} -20%, ${colorObj.value}40 100%)`,
      }}
    >
      {/* Decorative corner accent */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 rotate-45 opacity-30"
        style={{ background: colorObj.value }}
      />

      {/* White background container */}
      <div className="relative h-full bg-white m-[2px] rounded-[14px] shadow-sm">
        {children}
      </div>
    </div>
  )
} 