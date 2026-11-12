export function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  const short = /^#([0-9a-fA-F]{3})$/
  const full = /^#([0-9a-fA-F]{6})$/

  if (full.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  const match = trimmed.match(short)
  if (!match) {
    return null
  }

  const [r, g, b] = match[1].split('')
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
}
