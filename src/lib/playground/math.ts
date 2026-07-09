// Small numeric helpers shared across the playgrounds.

export const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n))

/** Random float in [min, max], rounded to 2 decimals. */
export const rand = (min: number, max: number) =>
  Math.round((min + Math.random() * (max - min)) * 100) / 100

/** Random integer in [min, max] (inclusive). */
export const randInt = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1))

/** Random element of an array. */
export const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]

/** Round to `p` decimal places (default 3). */
export const round = (n: number, p = 3) => Math.round(n * 10 ** p) / 10 ** p
