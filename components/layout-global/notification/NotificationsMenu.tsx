"use client";

import React from 'react'
import { Notification } from '../types';
import NotificationCard from './NotificationsCard';

const NotificationsMenu = ({ notifications } : { notifications: Notification[] }) => {
  return (
    <div className='w-full bg-black shadow-lg border-1 max-h-[400px] overflow-y-auto overflow-x-hidden z-10'>
        {notifications.map((notification, index) => (
          <NotificationCard key={index} notification={notification} />
        )
      )}
    </div>
  )
}

export default NotificationsMenu