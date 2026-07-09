// Palette color generation shared by the playgrounds. `t` is a 0..1 position, so
// the palette controls the *range* while each caller decides where within it a
// given shape/item lands.
import { hexToHsl, hslToHex, type Hsl } from './color'

export type PaletteMode = 'spectrum' | 'duo' | 'mono' | 'custom'

export interface PaletteParams {
  hue: number
  hueSpread: number
  sat: number
  light: number
  customColors: string[]
}

export function paletteColor(
  mode: PaletteMode,
  p: PaletteParams,
  t: number
): Hsl {
  const { hue, hueSpread, sat, light, customColors } = p
  switch (mode) {
    case 'spectrum':
      return { h: (hue + t * hueSpread + 360) % 360, s: sat, l: light }
    case 'duo': {
      const partner = (hue + hueSpread) % 360
      const d = ((partner - hue + 540) % 360) - 180 // short arc
      const k = t < 0.5 ? 0 : 1 // hard split into two hues
      return { h: (hue + d * k + 360) % 360, s: sat, l: light + (t - 0.5) * 20 }
    }
    case 'mono':
      return { h: hue, s: sat * 0.5, l: light + (t - 0.5) * 44 }
    case 'custom': {
      if (!customColors.length) return { h: hue, s: sat, l: light }
      const i = Math.min(
        customColors.length - 1,
        Math.floor(t * customColors.length)
      )
      return hexToHsl(customColors[i])
    }
  }
}

/** A random pleasant hex (mid sat/light so palettes don't come out muddy). */
export const randomHex = () =>
  hslToHex(
    Math.floor(Math.random() * 360),
    55 + Math.random() * 35,
    42 + Math.random() * 26
  )
