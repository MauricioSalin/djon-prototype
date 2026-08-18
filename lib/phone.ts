const BRAZIL_COUNTRY_CODE = "55"
const MAX_BRAZIL_PHONE_DIGITS = 11

export function phoneDigits(value?: string) {
  let digits = (value ?? "").replace(/\D/g, "")
  if (digits.length > MAX_BRAZIL_PHONE_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    digits = digits.slice(BRAZIL_COUNTRY_CODE.length)
  }
  return digits.slice(0, MAX_BRAZIL_PHONE_DIGITS)
}

export function formatPhone(value?: string) {
  const digits = phoneDigits(value)
  if (!digits) return ""
  if (digits.length === 1) return `(${digits}`
  if (digits.length === 2) return `(${digits})`

  const areaCode = digits.slice(0, 2)
  const subscriber = digits.slice(2)
  const prefixLength = subscriber.startsWith("9") ? 5 : 4

  if (subscriber.length <= prefixLength) return `(${areaCode}) ${subscriber}`
  return `(${areaCode}) ${subscriber.slice(0, prefixLength)}-${subscriber.slice(prefixLength)}`
}

export function phoneMatchesSearch(phone: string | undefined, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return true
  const searchDigits = normalizedSearch.replace(/\D/g, "")
  return formatPhone(phone).toLowerCase().includes(normalizedSearch)
    || Boolean(searchDigits && phoneDigits(phone).includes(searchDigits))
}

export function whatsappUrl(value: string) {
  return `https://wa.me/${BRAZIL_COUNTRY_CODE}${phoneDigits(value)}`
}
