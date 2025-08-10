"use client";

import React from 'react'
import { Notification } from '../types';
import Link from 'next/link';
import { marknotificaitonsAsRead } from '@/lib/notification/actions';

const NotificationCard = ({ notification }: { notification: Notification}) => {
  return (
    <Link 
      href={`/visualizando/${notification.notificationSource}/${notification.slug}`} 
      className={`w-full p-2 ${notification.read ? 'bg-gray-300' : 'bg-gray-100'} flex flex-row select-none relative z-10`}
      onClick={ () => marknotificaitonsAsRead(notification.id) }
    >
      <div className='w-1/6 flex items-center justify-center select-none'>
        { notification.priority === 'high' ? (
          <div className='bg-red-500 rounded-full w-5 h-5 flex items-center justify-center'>
            <span className='text-white font-bold rounded-full px-1'>!</span>
          </div>
        ) : notification.priority === 'medium' ? (
          <div className='bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center'>
            <span className='text-white font-bold rounded-full px-1'>!</span>
          </div>
        ) : notification.priority === 'low' ? (
          <div className='bg-green-500 rounded-full w-5 h-5 flex items-center justify-center'>
            <span className='text-white font-bold rounded-full px-1'>i</span>
          </div>
        ) :
        (
          <div className='w-5 h-5 bg-blue-400 flex rounded-full items-center justify-center'>
            <span className='text-white font-bold rounded-full px-1'>i</span>
          </div>
        )}
      </div>
      <div className='w-5/6 h-full flex flex-col justify-center px-4 select-none'>
        <span className='text-sm font-medium'>{notification.createdBy}</span>
        <span className='text-xs text-gray-500 break-words line-clamp-2 max-w-[95%] block'>
          {notification.message.replace(/\n/g, ' ')}
        </span>
        <span className='text-xs text-gray-400 mt-1'>
          {new Date(notification.createdAt as number).toLocaleString()}
        </span>
      </div>
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[85%] h-[1.5px] bg-gray-200 rounded-full" />
    </Link>
  )
}

export default NotificationCard