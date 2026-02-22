"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { capitalize } from '@/lib/utils'
import NotificationBell from './notification/NotificationBell'
import LogoutButton from './LogoutButton'
import AdminNavbar from './navbar-menu/AdminNavbar'

interface MenuSection {
  title: string
  items: MenuItem[]
}

interface MenuItem {
  label: string
  href: string
}

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const visualizarItems: MenuItem[] = [
    { label: 'Clientes', href: '/visualizar/cliente' },
    { label: 'Projetos', href: '/visualizar/projeto' },
    { label: 'Fornecedores', href: '/visualizar/fornecedor' },
    { label: 'Funcionários', href: '/visualizar/funcionario' },
    { label: 'Horas de Funcionários', href: '/visualizar/funcionario-horas' },
    { label: 'Convites', href: '/visualizar/convite' },
  ]

  const visualizarContasItems: MenuItem[] = [
    { label: 'Contas a Pagar', href: '/visualizar/conta/conta-a-pagar' },
    { label: 'Contas a Receber', href: '/visualizar/conta/conta-a-receber' },
  ]

  const cadastrarItems: MenuItem[] = [
    { label: 'Cliente', href: '/cadastrar/cliente' },
    { label: 'Projeto', href: '/cadastrar/projeto' },
    { label: 'Fornecedor', href: '/cadastrar/fornecedor' },
    { label: 'Funcionário', href: '/cadastrar/funcionario' },
    { label: 'Horas de Funcionário', href: '/cadastrar/funcionario-horas' },
  ]

  const cadastrarContasItems: MenuItem[] = [
    { label: 'Conta a Pagar', href: '/cadastrar/conta/conta-a-pagar' },
    { label: 'Conta a Receber', href: '/cadastrar/conta/conta-a-receber' },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2 hover:bg-slate-100 rounded-md transition-colors">
          <Menu className="h-6 w-6 text-slate-900" />
          <span className="sr-only">Abrir menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col gap-4 mt-6">
          {/* Admin Section */}
          <div className="border-b pb-4">
            <AdminNavbar mobile />
          </div>

          {/* Visualizar Section */}
          <div>
            <button
              onClick={() => toggleSection('visualizar')}
              className="flex items-center justify-between w-full py-2 px-3 text-left font-semibold text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              <span>Visualizar</span>
              {expandedSections.has('visualizar') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('visualizar') && (
              <div className="ml-4 mt-2 space-y-1">
                {visualizarItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-2 px-3 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className="pl-2">
                  <button
                    onClick={() => toggleSection('visualizar-contas')}
                    className="flex items-center justify-between w-full py-2 px-3 text-left text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <span>Contas</span>
                    {expandedSections.has('visualizar-contas') ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {expandedSections.has('visualizar-contas') && (
                    <div className="ml-4 mt-1 space-y-1">
                      {visualizarContasItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block py-2 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cadastrar Section */}
          <div>
            <button
              onClick={() => toggleSection('cadastrar')}
              className="flex items-center justify-between w-full py-2 px-3 text-left font-semibold text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              <span>Cadastrar</span>
              {expandedSections.has('cadastrar') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('cadastrar') && (
              <div className="ml-4 mt-2 space-y-1">
                {cadastrarItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-2 px-3 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className="pl-2">
                  <button
                    onClick={() => toggleSection('cadastrar-contas')}
                    className="flex items-center justify-between w-full py-2 px-3 text-left text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <span>Conta</span>
                    {expandedSections.has('cadastrar-contas') ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {expandedSections.has('cadastrar-contas') && (
                    <div className="ml-4 mt-1 space-y-1">
                      {cadastrarContasItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block py-2 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="flex items-center gap-2 px-3">
              <NotificationBell />
              <span className="text-sm text-slate-700">Notificações</span>
            </div>
            <div className="px-3">
              <LogoutButton />
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export default MobileNav
