"use client";

import Image from 'next/image'
import React, { useState } from 'react'
import NotificationsCount from './NotificationsCount'

const NotificationBell = () => {
  const [notificationMenu, setnotificationMenu] = useState<boolean>(false)
  const notifications = [
    { id: 1, message: 'Novo projeto adicionado', read: false },
    { id: 2, message: 'Novo cliente cadastrado', read: true },
    { id: 3, message: 'Novo fornecedor adicionado', read: false },
    { id: 4, message: 'Novo funcionário cadastrado', read: true },
  ]
  
  return (
    <>
        <div className='rounded-full bg-slate-50 relative cursor-pointer border-1 shadow-lg' onClick={() => setnotificationMenu(!notificationMenu)}>
            {notifications.filter(notification => !notification.read).length > 0 && (
                <NotificationsCount count={notifications.filter(notification => !notification.read).length} />
            )}

            <Image
                src="/notification-icon.png"
                alt="N"
                width={37}
                height={37}
                className='rounded-full'
            />
        </div>
        <div className='absolute'>
            
        </div>
    </>
  )
}

export default NotificationBell