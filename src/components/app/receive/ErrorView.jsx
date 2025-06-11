import React from 'react'

export default function ErrorView({ error }) {
  return (
    <div className='nice-card p-8 w-full flex flex-col items-center'>
      <div className='text-2xl mb-2'>😕</div>
      <div className='text-lg font-medium text-gray-900'>
        Oops! Something went wrong
      </div>
      <div className='mt-2 text-sm text-gray-500 text-center'>
        {error}
      </div>
    </div>
  )
}
