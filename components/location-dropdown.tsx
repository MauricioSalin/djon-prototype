"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import {
  academyLocationChangeEvent,
  academyLocationKeys,
  academyLocationStorageKey,
  academyLocations,
  isAcademyLocationKey,
  type AcademyLocationKey,
} from "@/lib/locations"

type LocationDropdownProps = {
  className?: string
  align?: "left" | "right"
  mobile?: boolean
}

export function LocationDropdown({ className = "", align = "right", mobile = false }: LocationDropdownProps) {
  const [selectedLocation, setSelectedLocation] = useState<AcademyLocationKey>("poa")
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const location = academyLocations[selectedLocation]

  useEffect(() => {
    const storedLocation = window.localStorage.getItem(academyLocationStorageKey)
    if (isAcademyLocationKey(storedLocation)) {
      setSelectedLocation(storedLocation)
    }

    const handleLocationChange = (event: Event) => {
      const nextLocation = (event as CustomEvent<{ location?: AcademyLocationKey }>).detail?.location
      if (isAcademyLocationKey(nextLocation)) {
        setSelectedLocation(nextLocation)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === academyLocationStorageKey && isAcademyLocationKey(event.newValue)) {
        setSelectedLocation(event.newValue)
      }
    }

    window.addEventListener(academyLocationChangeEvent, handleLocationChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener(academyLocationChangeEvent, handleLocationChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    return () => window.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  const selectLocation = (key: AcademyLocationKey) => {
    setSelectedLocation(key)
    setOpen(false)
    window.localStorage.setItem(academyLocationStorageKey, key)
    window.dispatchEvent(new CustomEvent(academyLocationChangeEvent, { detail: { location: key } }))
  }

  return (
    <div ref={rootRef} className={`relative ${mobile ? "w-full" : "w-auto"} ${className}`}>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`group flex items-center justify-between gap-3 rounded-full border border-djon-text/15 bg-djon-surface-4/90 px-5 py-2.5 text-left font-black text-djon-text shadow-djon-soft outline-none backdrop-blur-md transition-colors hover:border-djon-text/30 hover:bg-djon-surface-5 ${
          mobile ? "w-full" : "min-w-[188px]"
        }`}
        whileHover={{ scale: mobile ? 1 : 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0">
          <span className="block text-djon-caption leading-none tracking-[0.22em] text-djon-text/45">UNIDADE</span>
          <span className="mt-1 block truncate text-djon-meta tracking-widest">{location.label}</span>
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-djon-text/55 transition-transform group-hover:text-djon-text ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] as const }}
            className={`absolute z-50 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-djon-text/12 bg-djon-surface-6/98 p-2 shadow-djon-popover backdrop-blur-xl ${
              align === "right" ? "right-0" : "left-0"
            } top-full space-y-1`}
            role="listbox"
          >
            {academyLocationKeys.map((key) => {
              const item = academyLocations[key]
              const selected = key === selectedLocation

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectLocation(key)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    selected ? "bg-djon-text/10 text-djon-text" : "text-djon-text/70 hover:bg-djon-text/8 hover:text-djon-text"
                  }`}
                  role="option"
                  aria-selected={selected}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black tracking-widest">{item.label}</span>
                    <span className={`mt-1 block text-djon-meta leading-relaxed ${selected ? "text-djon-text/50" : "text-djon-text/35"}`}>
                      {item.address}
                    </span>
                  </span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
