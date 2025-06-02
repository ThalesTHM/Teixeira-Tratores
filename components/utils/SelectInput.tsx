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
  { name, items, selectLabel, placeholder }:
  { name: string, items: Array<Record<string, string>>, selectLabel: string, placeholder: string }
) => {
  const [value, setValue] = React.useState("")

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value} onValueChange={setValue}
      >
        <SelectTrigger className="forms-input">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{selectLabel}</SelectLabel>
            {items.map((item, index)=> (
              <SelectItem key={index} value={item.key}>{item.value}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}
