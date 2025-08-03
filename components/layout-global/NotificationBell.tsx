"use client";

import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import NotificationsCount from './NotificationsCount'
import NotificationsMenu from './NotificationsMenu';
import { marknotificaitonsAsRead, markNotificationsAsSoftRead } from '@/lib/notification/actions';

const NotificationBell = () => {
  const [notificationMenu, setnotificationMenu] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<any[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications");
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(data);
      console.log("Received notifications:", data);
    };
    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (!notificationMenu) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        bellRef.current && !bellRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setnotificationMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationMenu]);

  useEffect(() => {
    if (!notificationMenu) return;

    markNotificationsAsSoftRead();

    return () => {
      setnotificationMenu(false);
    };
  }, [notificationMenu])
  

  return (
    <div className="relative flex items-center">
      <div
        ref={bellRef}
        className="rounded-full bg-slate-50 cursor-pointer border-1 shadow-lg"
        onClick={() => setnotificationMenu(!notificationMenu)}
        style={{ zIndex: 51 }}
      >
        {notifications.filter(notification => !notification.softRead).length > 0 && (
          <NotificationsCount count={notifications.filter(notification => !notification.softRead).length} />
        )}
        <Image
          src="/notification-icon.png"
          alt="N"
          width={37}
          height={37}
          className="rounded-full"
        />
      </div>
      {notificationMenu && (
        <div
          ref={menuRef}
          className="absolute top-14 w-80 right-[-80px]"
        >
          <NotificationsMenu notifications={notifications} />
        </div>
      )}
    </div>
  )
}

export default NotificationBell