import React from 'react'

export default function PaymentDetail({
  stealthData
}) {
  return (
    <div className='nice-card p-6 mb-8 relative before:absolute before:inset-0 before:p-[2px] before:rounded-3xl before:bg-gradient-to-br before:from-primary-500 before:to-primary-300 before:-z-10 bg-white shadow-sm'>
      <div className='flex flex-col gap-6'>
        {/* Header with fun emoji and text */}
        <div className='flex items-center gap-3'>
          <span className='text-3xl'>
            {stealthData?.linkData?.type === 'DOWNLOAD' ? '🎁' : '✨'}
          </span>
          <div>
            <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
              {stealthData?.linkData?.type === 'DOWNLOAD'
                ? 'Unlock This File'
                : `Send funds to ${stealthData?.username}`}
            </h2>
            <p className='text-gray-600'>
              {stealthData?.linkData?.type === 'DOWNLOAD'
                ? <span>from <span className='font-semibold text-gray-900'>{stealthData?.username}</span></span>
                : <span>secure & private payment</span>
              }
              {stealthData?.linkData?.label && (
                <span className='text-primary-600'> • {stealthData?.linkData?.label}</span>
              )}
            </p>
          </div>
        </div>

        {/* Description with fun style */}
        {stealthData?.linkData?.description && (
          <div className='text-gray-600 italic border-l-4 border-primary-200 pl-4 py-1'>
            &ldquo;{stealthData.linkData.description}&rdquo;
          </div>
        )}

        {/* Download Preview */}
        {stealthData?.linkData?.type === 'DOWNLOAD' && stealthData?.linkData?.file && (
          <div className='flex items-center gap-4 border border-gray-200 p-4 rounded-2xl bg-gray-50/80'>
            <span className='text-2xl'>📄</span>
            <div className='flex-1'>
              <p className='font-medium text-gray-900'>{stealthData.linkData.file.filename}</p>
              <p className='text-sm text-gray-600'>
                {(stealthData.linkData.file.size / 1024 / 1024).toFixed(2)} MB • Ready after payment
              </p>
            </div>
          </div>
        )}

        {/* Amount Info */}
        {stealthData?.linkData?.amountType === 'FIXED' ? (
          <div className='flex items-center gap-4 border border-gray-200 p-4 rounded-2xl bg-gray-50/80'>
            <span className='text-2xl'>🎯</span>
            <div>
              <p className='font-medium text-gray-900'>Fixed Price</p>
              <p className='text-sm text-gray-600'>
                {stealthData.linkData.amount} {stealthData.linkData.mint?.symbol || 'tokens'}
              </p>
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-4 border border-gray-200 p-4 rounded-2xl bg-gray-50/80'>
            <span className='text-2xl'>🌟</span>
            <div>
              <p className='font-medium text-gray-900'>Custom Amount</p>
              <p className='text-sm text-gray-600'>Choose how much to send</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
