import React from 'react'

import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
  } from "@/components/ui/menubar"
import Link from 'next/link'

interface AdminNavbarProps {
  mobile?: boolean
}

const AdminNavbar = ({ mobile = false }: AdminNavbarProps) => {
  if (mobile) {
    return (
      <div className="space-y-1">
        <div className="font-semibold text-slate-900 px-3 py-2">Admin</div>
        <Link href='/admin/financas'>
          <div className="block py-2 px-3 text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Finanças</div>
        </Link>
        <Link href='/admin/account-recovery'>
          <div className="block py-2 px-3 text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Recuperar a Conta</div>
        </Link>
      </div>
    )
  }

  return (
     <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Admin</MenubarTrigger>
        <MenubarContent>
          <Link href='/admin/financas'>
            <MenubarItem>Finanças</MenubarItem>
          </Link>

          <MenubarSeparator />

          <Link href='/admin/account-recovery'>
            <MenubarItem>Recuperar a Conta</MenubarItem>
          </Link>
        </MenubarContent>
        </MenubarMenu>
    </Menubar>
  )
}

export default AdminNavbar