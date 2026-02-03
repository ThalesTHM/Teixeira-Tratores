"use client"

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavbarMenuBar from './navbar-menu/NavbarMenuBar'
import NotificationBell from './notification/NotificationBell'
import LogoutButton from './LogoutButton'
import AdminNavbar from './navbar-menu/AdminNavbar'
import MobileNav from './MobileNav'

const Navbar = () => {
  return (
    <header className='px-3 sm:px-5 py-3 bg-slate-50 shadow-md font-work-sans'>
        <nav className='flex justify-between items-center'>
            <div className='flex items-center gap-3'>
                <MobileNav />
                <Link href="/">
                    <Image 
                        src="/logo.png"
                        alt="Logo"
                        width={48}
                        height={48}
                        className='w-10 h-10 sm:w-12 sm:h-12'
                    />
                </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-3 text-black">
                <AdminNavbar />
                <NavbarMenuBar menuTitle='visualizar' />
                <NavbarMenuBar menuTitle='cadastrar' />
                <NotificationBell />
                <LogoutButton />
            </div>

            {/* Mobile Quick Actions */}
            <div className="flex lg:hidden items-center gap-2">
                <NotificationBell />
            </div>
        </nav>
    </header>
  )
}

export default Navbar