// Compact, URL-safe scene tokens. Numbers are stored as scaled base36 integers,
// so there are no decimal points and no base64 wrapper. Callers join with '~'
// (sections), '.' (fields) and '_' (list items); those, base36 digits and '-'
// are all URL-safe.

/** number → scaled base36 int, e.g. n36(0.42, 100) => "bo", n36(-0.08, 100) => "-8". */
export const n36 = (value: number, scale = 1): string =>
  Math.round(value * scale).toString(36)

/** base36 int → number / scale, with a fallback for missing/garbage fields. */
export const p36 = (str: string | undefined, scale = 1, dflt = 0): number => {
  if (!str) return dflt
  const v = parseInt(str, 36)
  return Number.isFinite(v) ? v / scale : dflt
}

/** Fixed-width 6-char hex colors concatenated, so no separator is needed. */
export const packHex = (list: string[]): string =>
  list.map((c) => c.replace(/^#/, '')).join('')
export const unpackHex = (s: string): string[] =>
  (s.match(/.{6}/g) || []).map((h) => `#${h}`)
