"use client";

import React from 'react'
import { Notification } from '../types';
import NotificationCard from './NotificationsCard';

const NotificationsMenu = ({ notifications } : { notifications: Notification[] }) => {
  return (
    <div className='w-full bg-white shadow-lg border border-gray-200 rounded-lg max-h-[70vh] sm:max-h-[400px] overflow-y-auto overflow-x-hidden z-50'>
        {notifications.map((notification, index) => (
          <NotificationCard key={index} notification={notification} />
        )
      )}
    </div>
  )
}

export default NotificationsMenu