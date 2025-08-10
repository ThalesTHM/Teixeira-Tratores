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

const AdminNavbar = () => {
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