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
import { capitalize } from '@/lib/utils';
  

const NavbarMenuBar = (props: { menuTitle: string }) => {
  const { menuTitle } = props;

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>{capitalize(menuTitle)}</MenubarTrigger>
        <MenubarContent>
          <Link href={`/${menuTitle}/cliente`}>
            <MenubarItem>Cliente{menuTitle == "visualizar" && 's'}</MenubarItem>
          </Link>

          <MenubarSeparator />

          <Link href={`/${menuTitle}/projeto`}>
            <MenubarItem>{menuTitle == "visualizar" ? "Projetos" : "Projeto"}</MenubarItem>
          </Link>
          
          <MenubarSeparator />

          <Link href={`/${menuTitle}/fornecedor`}>
            <MenubarItem>{menuTitle == "visualizar" ? "Fornecedores" : "Fornecedor"}</MenubarItem>
          </Link>
    
          <MenubarSeparator />

          <MenubarSub>
            <MenubarSubTrigger>{menuTitle == "visualizar" ? "Contas" : "Conta"}</MenubarSubTrigger>
            <MenubarSubContent>
              <Link href={`/${menuTitle}/conta/conta-a-pagar`}>
                <MenubarItem>{menuTitle == "visualizar" ? "Contas" : "Conta"} a Pagar</MenubarItem>
              </Link>
              <Link href={`/${menuTitle}/conta/conta-a-receber`}>
                <MenubarItem>{menuTitle == "visualizar" ? "Contas" : "Conta"} a Receber</MenubarItem>
              </Link>
            </MenubarSubContent>
          </MenubarSub>
          
          <MenubarSeparator />

          <MenubarSub>
            <MenubarSubTrigger>Equipamento</MenubarSubTrigger>
            <MenubarSubContent>
              <Link href={`/${menuTitle}/equipamento`}>
                <MenubarItem>{capitalize(menuTitle)} {menuTitle == "visualizar" ? "Equipamentos" : "Equipamento"}</MenubarItem>
              </Link>
              <Link href={`/${menuTitle}/conta/equipamento`}>
                <MenubarItem>{capitalize(menuTitle)} {menuTitle == "visualizar" ? "Contas dos Equipamentos" : "Conta do Equipamento"}</MenubarItem>
              </Link>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSeparator />

          <MenubarSub>
            <MenubarSubTrigger>Maquinário</MenubarSubTrigger>
            <MenubarSubContent>
              <Link href={`/${menuTitle}/maquinario`}>
                <MenubarItem>{capitalize(menuTitle)} {menuTitle == "visualizar" ? "Maquinários" : "Maquinário"}</MenubarItem>
              </Link>
              <Link href={`/${menuTitle}/conta/maquinario`}>
                <MenubarItem>{capitalize(menuTitle)} {menuTitle == "visualizar" ? "Contas dos Maquinários" : "Conta do Maquinário"}</MenubarItem>
              </Link>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>    
      </MenubarMenu>
    </Menubar>
  )
}

export default NavbarMenuBar