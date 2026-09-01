"use client"

import type { ReactNode } from "react"
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
  preview?: ReactNode
  disabled?: boolean
}

type DjonSelectProps = {
  value: string
  onChange: (value: string) => void
  options: readonly DjonSelectOption[]
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
          <SelectItem
            key={option.value}
            value={option.value}
            textValue={option.label}
            disabled={option.disabled}
          >
            {option.preview ? (
              <span
                data-slot="select-option-preview"
                aria-hidden="true"
                className="flex shrink-0 items-center justify-center"
              >
                {option.preview}
              </span>
            ) : null}
            <span>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
