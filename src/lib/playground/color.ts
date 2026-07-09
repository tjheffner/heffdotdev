// Color conversions shared across the playgrounds.

export type Hsl = { h: number; s: number; l: number }
export type Rgb = { r: number; g: number; b: number }

const clamp01to100 = (n: number) => Math.min(100, Math.max(0, n))

/** #rrggbb → { h, s, l }. Falls back to a neutral gray on a malformed input. */
export function hexToHsl(hex: string): Hsl {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return { h: 0, s: 0, l: 60 }
  const int = parseInt(m[1], 16)
  const r = (int >> 16) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

/** #rrggbb → { r, g, b } (0–255). Falls back to the default panel color. */
export function hexRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return { r: 20, g: 20, b: 26 }
  const int = parseInt(m[1], 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** { h, s, l } → an `hsl(...)` string, lightness clamped to a valid range. */
export const hslString = (c: Hsl) =>
  `hsl(${c.h.toFixed(0)}, ${c.s.toFixed(0)}%, ${clamp01to100(c.l).toFixed(0)}%)`
