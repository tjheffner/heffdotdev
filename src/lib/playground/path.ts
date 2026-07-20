// Freeform pen paths: polylines drawn on a pad, stored as flat [x0,y0,x1,y1,…]
// arrays in the pad's centered unit space ([-1,1] on both axes). A path is a
// list of strokes. Helpers here keep them smooth (even resampling) and small
// (fixed-width base36 packing for scene tokens).

import { clamp } from './math'

/**
 * Resample a raw pointer trail to evenly spaced points along its arc length.
 * Smooths capture jitter and bounds the point count for tokens/rendering.
 */
export function resampleStroke(
  pts: number[],
  spacing = 0.035,
  maxPts = 72
): number[] {
  const n = pts.length / 2
  if (n < 2) return pts.slice()
  let len = 0
  for (let i = 1; i < n; i++)
    len += Math.hypot(
      pts[i * 2] - pts[i * 2 - 2],
      pts[i * 2 + 1] - pts[i * 2 - 1]
    )
  if (len === 0) return [pts[0], pts[1], pts[0], pts[1]]
  const count = Math.max(2, Math.min(maxPts, Math.round(len / spacing) + 1))
  const step = len / (count - 1)
  const out: number[] = [pts[0], pts[1]]
  let need = step // distance left until the next sample lands
  for (let i = 1; i < n; i++) {
    let x0 = pts[i * 2 - 2]
    let y0 = pts[i * 2 - 1]
    const x1 = pts[i * 2]
    const y1 = pts[i * 2 + 1]
    let seg = Math.hypot(x1 - x0, y1 - y0)
    while (seg >= need && out.length / 2 < count - 1) {
      const t = need / seg
      x0 += (x1 - x0) * t
      y0 += (y1 - y0) * t
      out.push(x0, y0)
      seg = Math.hypot(x1 - x0, y1 - y0)
      need = step
    }
    need -= seg
  }
  while (out.length / 2 < count) out.push(pts[n * 2 - 2], pts[n * 2 - 1])
  return out
}

// Each coordinate quantizes to 2 base36 chars (0..1295 across [-1,1], ~0.0015
// resolution), concatenated without separators; strokes join with '-'. All of
// it is token-safe (no '.', '_' or '~', which delimit fields/layers/sections).
const Q = 1295

export const packPath = (strokes: number[][]): string =>
  strokes
    .map((pts) =>
      pts
        .map((v) =>
          Math.round(clamp((v + 1) / 2, 0, 1) * Q)
            .toString(36)
            .padStart(2, '0')
        )
        .join('')
    )
    .join('-')

export const unpackPath = (s: string): number[][] =>
  s
    .split('-')
    .filter(Boolean)
    .map((chunk) =>
      (chunk.match(/.{2}/g) || []).map((cc) => (parseInt(cc, 36) / Q) * 2 - 1)
    )
    .filter(
      (pts) =>
        pts.length >= 4 && pts.length % 2 === 0 && pts.every(Number.isFinite)
    )
