import React from 'react'

const NotificationsCount = (props: { count: number }) => {
  const { count } = props
  
  return (
    <div className='bg-red-600'>
        <span className='absolute -top-0.5 -right-0.5 text-white font-bold text-xs bg-red-600 rounded-full px-1'>
            {count}
        </span>
    </div>
  )
}

export default NotificationsCount