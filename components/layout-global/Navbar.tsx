import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavbarMenuBar from './navbar-menu/NavbarMenuBar'
import NotificationBell from './notification/NotificationBell'
import LogoutButton from './LogoutButton'
import AdminNavbar from './navbar-menu/AdminNavbar'

const Navbar = () => {
  return (
    <header className='px-5 py-3 bg-slate-50 shadow-md font-work-sans'>
        <nav className='flex justify-between items-center'>
            <Link href="/">
                <Image 
                    src="/logo.png"
                    alt="Logo"
                    width={48}
                    height={48}
                />
            </Link>

            <div className="flex items-center gap-3 text-black">
                <AdminNavbar />
                <NavbarMenuBar menuTitle='visualizar' />
                <NavbarMenuBar menuTitle='cadastrar' />
                <NotificationBell />
                <LogoutButton />
            </div>
        </nav>
    </header>
  )
}

export default Navbar