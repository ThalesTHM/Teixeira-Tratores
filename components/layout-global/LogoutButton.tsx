import { logout } from '@/lib/auth/actions'
import React from 'react'
import { Button } from '../ui/button'

const LogoutButton = () => {
  return (
    <div className='ml-6'>
        <form action={logout}>
            <Button 
                variant='outline' 
                className='hidden md:inline-flex' 
            >
                Sair
            </Button>
        </form>
    </div>
  )
}

export default LogoutButton