const MAX_CPF_DIGITS = 11

export function cpfDigits(value?: string) {
  return (value ?? "").replace(/\D/g, "").slice(0, MAX_CPF_DIGITS)
}

export function formatCpf(value?: string) {
  const digits = cpfDigits(value)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}
