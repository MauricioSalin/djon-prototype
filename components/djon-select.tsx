"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type DjonSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type DjonSelectProps = {
  value: string
  onChange: (value: string) => void
  options: DjonSelectOption[]
  placeholder?: string
  ariaLabel?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export function DjonSelect({
  value,
  onChange,
  options,
  placeholder = "Selecionar...",
  ariaLabel,
  className,
  disabled = false,
  required = false,
}: DjonSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
      <SelectTrigger
        aria-label={ariaLabel ?? placeholder}
        className={cn("group w-full pr-5 font-bold", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={8}
        align="start"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
