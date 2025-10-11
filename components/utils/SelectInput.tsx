"use client";

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const SelectInput = (
  { name, items, selectLabel, placeholder, defaultValue }:
  { name: string, items: Array<Record<string, string>>, selectLabel: string, placeholder: string, defaultValue?: string }
) => {
  const [value, setValue] = React.useState(defaultValue || "")

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value} onValueChange={setValue}
      >
        <SelectTrigger className="forms-input">
          <SelectValue 
            placeholder={placeholder} 
            className="truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-full" 
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{selectLabel}</SelectLabel>
            {items.map((item, index)=> (
              <SelectItem key={index} value={item.key} className="max-w-full">
                <span 
                  className="truncate overflow-hidden text-ellipsis whitespace-nowrap block max-w-[200px]" 
                  title={item.value}
                >
                  {item.value}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}
