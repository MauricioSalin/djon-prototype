export type AcademyLocation = {
  label: string
  shortLabel: string
  address: string
  lines: readonly string[]
  mapSrc: string
  mapsHref: string
  phone?: string
  email?: string
  instagram?: string
  facebook?: string
  openingHours?: string
}

export const academyLocations: Record<string, AcademyLocation> = {
  poa: {
    label: "Porto Alegre / RS",
    shortLabel: "POA",
    address: "Rua General Vitorino 77, Sala 504 — Centro, POA",
    lines: ["Rua General Vitorino 77, Sala 504.", "Centro. Porto Alegre - RS"],
    mapSrc:
      "https://www.openstreetmap.org/export/embed.html?bbox=-51.2291%2C-30.0323%2C-51.2231%2C-30.0283&layer=mapnik",
    mapsHref: "https://www.google.com/maps/search/?api=1&query=-30.0303,-51.2261",
    phone: "(51) 99700-7846",
    email: "contato@djonacademy.com",
    instagram: "https://www.instagram.com/djonacademy",
    facebook: "https://www.facebook.com/djonacademy",
    openingHours: "Segunda à sexta das 9h às 18h",
  },
  camboriu: {
    label: "Camboriú / SC",
    shortLabel: "Camboriú",
    address: "Alameda Cap. Ernesto Nunes, 987 — Bairro Cedros, Camboriú",
    lines: ["Alameda Cap. Ernesto Nunes, 987.", "Bairro Cedros. Camboriú - SC"],
    mapSrc:
      "https://www.openstreetmap.org/export/embed.html?bbox=-48.65211135766976%2C-27.036794365919074%2C-48.64611135766976%2C-27.032794365919072&layer=mapnik",
    mapsHref: "https://www.google.com/maps/search/?api=1&query=-27.034794365919073,-48.64911135766976",
    phone: "(51) 99700-7846",
    email: "contato@djonacademy.com",
    instagram: "https://www.instagram.com/djonacademy",
    facebook: "https://www.facebook.com/djonacademy",
    openingHours: "Segunda à sexta das 9h às 18h",
  },
}

export type AcademyLocationKey = string

export const academyLocationKeys = Object.keys(academyLocations) as AcademyLocationKey[]
export const academyLocationStorageKey = "djon-academy-location"
export const academyLocationChangeEvent = "djon-academy-location-change"

export function isAcademyLocationKey(value: string | null | undefined): value is AcademyLocationKey {
  return Boolean(value?.trim())
}
