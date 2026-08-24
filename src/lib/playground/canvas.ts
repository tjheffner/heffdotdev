// Camera and export helpers shared by the canvas playgrounds. Pure functions
// over a canvas and a { panX, panY, zoom } camera.
import { hexRgb } from './color'
import { clamp } from './math'

export type Camera = { panX: number; panY: number; zoom: number }

/**
 * Cursor-anchored zoom. Holds the scene point under (mx, my) fixed while
 * scaling. Assumes the renderer centers its scene at (w/2 + panX, h/2 + panY)
 * and scales linearly with zoom.
 */
export function zoomAt(
  cam: Camera,
  mx: number,
  my: number,
  deltaY: number,
  w: number,
  h: number,
  zoomMin: number,
  zoomMax: number
): Camera {
  const relx = (mx - (w / 2 + cam.panX)) / cam.zoom
  const rely = (my - (h / 2 + cam.panY)) / cam.zoom
  const factor = Math.exp(-deltaY * 0.0015)
  const zoom = clamp(cam.zoom * factor, zoomMin, zoomMax)
  return {
    panX: mx - w / 2 - relx * zoom,
    panY: my - h / 2 - rely * zoom,
    zoom,
  }
}

/**
 * Downscaled JPEG dataURL of a canvas. Paints `bgFill` first so transparent
 * scenes do not thumbnail see-through.
 */
export function snapshotCanvas(
  canvas: HTMLCanvasElement | undefined,
  bgFill: string,
  maxDim = 128
): string | null {
  if (!canvas || !canvas.width) return null
  const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height))
  const sw = Math.max(1, Math.round(canvas.width * scale))
  const sh = Math.max(1, Math.round(canvas.height * scale))
  const c = document.createElement('canvas')
  c.width = sw
  c.height = sh
  const cc = c.getContext('2d')
  if (!cc) return null
  cc.fillStyle = bgFill
  cc.fillRect(0, 0, sw, sh)
  cc.drawImage(canvas, 0, 0, sw, sh)
  try {
    return c.toDataURL('image/jpeg', 0.72)
  } catch {
    return null
  }
}

/** Download the canvas as a PNG. */
export function downloadCanvasPng(
  canvas: HTMLCanvasElement | undefined,
  filename: string
) {
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

// Reused scratch canvas so luminance sampling reads back a few hundred pixels
// instead of the full strip.
let scratch: HTMLCanvasElement | undefined
let sctx: CanvasRenderingContext2D | null = null

/**
 * Average perceived brightness (0..1) of the top `stripFrac` of a canvas,
 * composited over `backdropHex` so semi-transparent pixels read correctly.
 */
export function sampleLuminance(
  canvas: HTMLCanvasElement | undefined,
  backdropHex: string,
  stripFrac = 0.16
): number | null {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null
  if (!scratch) {
    scratch = document.createElement('canvas')
    scratch.width = 48
    scratch.height = 8
    sctx = scratch.getContext('2d', { willReadFrequently: true })
  }
  if (!sctx) return null
  const bd = hexRgb(backdropHex)
  sctx.clearRect(0, 0, 48, 8)
  sctx.fillStyle = `rgb(${bd.r}, ${bd.g}, ${bd.b})`
  sctx.fillRect(0, 0, 48, 8)
  const sh = Math.max(1, Math.round(canvas.height * stripFrac))
  sctx.drawImage(canvas, 0, 0, canvas.width, sh, 0, 0, 48, 8)
  let data: Uint8ClampedArray
  try {
    data = sctx.getImageData(0, 0, 48, 8).data
  } catch {
    return null
  }
  let sum = 0
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    n++
  }
  return n ? sum / n / 255 : null
}
