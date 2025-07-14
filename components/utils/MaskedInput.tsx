'use client'

import { IMaskInput } from 'react-imask'
import { cn } from "@/lib/utils"

type Props = {
  mask: string
  name: string
  id: string
  placeholder?: string
  className?: string
  defaultValue? : string
}

export const MaskedInput = ({ mask, name, id, placeholder, className, defaultValue }: Props) => {
  return (
    <IMaskInput
      mask={mask}
      name={name}
      id={id}
      placeholder={placeholder}
      defaultValue={defaultValue || ""}
      className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
    />
  )
}