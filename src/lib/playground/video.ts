// Client-side video capture for the canvas playgrounds. Frame-stepped (not a
// real-time screen grab) so the resolution, fps and duration are exact and the
// motion is smooth regardless of the live frame rate.
//
// Primary path: WebCodecs `VideoEncoder` (H.264) + `mp4-muxer` → a real .mp4,
// which embeds everywhere that matters (GitHub, LinkedIn, Slack, this site).
// Fallback: `MediaRecorder` on a captured canvas stream → .webm, for browsers
// without WebCodecs/H.264 (older Firefox). The caller supplies a `draw(ctx, i)`
// that paints frame `i`; we own the canvas, the encoder, and the download.

export type RecordOptions = {
  width: number
  height: number
  fps: number
  frames: number
  /** Paint frame `i` into the capture context. */
  draw: (ctx: CanvasRenderingContext2D, i: number) => void
  /** Download filename, without extension. */
  filename: string
  /** 0..1 progress callback. */
  onProgress?: (fraction: number) => void
}

export type RecordResult = { format: 'mp4' | 'webm' }

const nextTick = () => new Promise((r) => setTimeout(r, 0))

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function bitrateFor(w: number, h: number, fps: number) {
  // ~0.13 bits per pixel per frame, clamped to a sane band for these scenes.
  return Math.min(
    16_000_000,
    Math.max(2_000_000, Math.round(w * h * fps * 0.13))
  )
}

// True if the browser can encode H.264 at this size via WebCodecs.
async function mp4Supported(
  width: number,
  height: number,
  fps: number
): Promise<boolean> {
  const VE = (globalThis as any).VideoEncoder
  if (!VE || typeof VE.isConfigSupported !== 'function') return false
  try {
    const res = await VE.isConfigSupported({
      codec: 'avc1.42001f', // H.264 baseline, level 3.1
      width,
      height,
      bitrate: bitrateFor(width, height, fps),
      framerate: fps,
    })
    return !!res?.supported
  } catch {
    return false
  }
}

async function encodeMp4(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  opts: RecordOptions
) {
  const { Muxer, ArrayBufferTarget } = (await import('mp4-muxer')) as any
  const { width, height, fps, frames } = opts

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height, frameRate: fps },
    fastStart: 'in-memory',
  })

  const VideoEncoder = (globalThis as any).VideoEncoder
  const VideoFrame = (globalThis as any).VideoFrame
  let encodeError: unknown = null
  const encoder = new VideoEncoder({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: unknown) => (encodeError = e),
  })
  encoder.configure({
    codec: 'avc1.42001f',
    width,
    height,
    bitrate: bitrateFor(width, height, fps),
    framerate: fps,
  })

  const usPerFrame = 1_000_000 / fps
  for (let i = 0; i < frames; i++) {
    if (encodeError) break
    opts.draw(ctx, i)
    const frame = new VideoFrame(canvas, {
      timestamp: Math.round(i * usPerFrame),
      duration: Math.round(usPerFrame),
    })
    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 })
    frame.close()
    opts.onProgress?.((i + 1) / frames)
    // Yield periodically so the UI stays responsive and the encoder can drain.
    if (encoder.encodeQueueSize > 6 || i % 4 === 0) await nextTick()
  }

  await encoder.flush()
  muxer.finalize()
  if (encodeError) throw encodeError
  download(
    new Blob([muxer.target.buffer], { type: 'video/mp4' }),
    `${opts.filename}.mp4`
  )
}

async function encodeWebm(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  opts: RecordOptions
) {
  const { fps, frames } = opts
  const mime = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m))
  if (!mime) throw new Error('no-encoder')

  const stream = canvas.captureStream(fps)
  const rec = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: bitrateFor(opts.width, opts.height, fps),
  })
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const stopped = new Promise<void>((res) => (rec.onstop = () => res()))
  rec.start()

  // MediaRecorder samples the canvas in real time, so paint each frame and hold
  // it for one frame's worth of wall-clock before advancing.
  const msPerFrame = 1000 / fps
  for (let i = 0; i < frames; i++) {
    const t0 = performance.now()
    opts.draw(ctx, i)
    opts.onProgress?.((i + 1) / frames)
    const spent = performance.now() - t0
    await new Promise((r) => setTimeout(r, Math.max(0, msPerFrame - spent)))
  }
  rec.stop()
  await stopped
  download(new Blob(chunks, { type: 'video/webm' }), `${opts.filename}.webm`)
}

/** Even, viewport-aspect capture dimensions with `long` as the long edge. */
export function viewportClipDims(long = 960): {
  width: number
  height: number
} {
  const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280
  const vh = (typeof window !== 'undefined' && window.innerHeight) || 720
  const width = vw >= vh ? long : Math.round((long * vw) / vh)
  const height = vw >= vh ? Math.round((long * vh) / vw) : long
  return { width: width - (width % 2), height: height - (height % 2) }
}

/**
 * Record a clip at the viewport aspect. `draw(ctx, i, W, H)` paints frame `i`.
 * `before`/`after` run around the whole capture (e.g. to pause a live loop).
 */
export async function recordViewportClip(opts: {
  seconds: number
  fps: number
  filename: string
  draw: (
    ctx: CanvasRenderingContext2D,
    i: number,
    W: number,
    H: number,
    frames: number
  ) => void
  onProgress?: (fraction: number) => void
  before?: () => void
  after?: () => void
  long?: number
}): Promise<RecordResult> {
  const { width, height } = viewportClipDims(opts.long ?? 960)
  const frames = Math.max(1, Math.round(opts.seconds * opts.fps))
  opts.before?.()
  try {
    return await recordClip({
      width,
      height,
      fps: opts.fps,
      frames,
      filename: opts.filename,
      draw: (ctx, i) => opts.draw(ctx, i, width, height, frames),
      onProgress: opts.onProgress,
    })
  } finally {
    opts.after?.()
  }
}

/**
 * Record `frames` frames into a downloaded clip. Prefers MP4 (H.264); falls back
 * to WebM. Throws `Error('no-encoder')` if neither path is available.
 */
export async function recordClip(opts: RecordOptions): Promise<RecordResult> {
  // H.264 requires even dimensions.
  const width = opts.width - (opts.width % 2)
  const height = opts.height - (opts.height % 2)
  const o = { ...opts, width, height }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no-encoder')

  if (await mp4Supported(width, height, o.fps)) {
    await encodeMp4(canvas, ctx, o)
    return { format: 'mp4' }
  }
  await encodeWebm(canvas, ctx, o)
  return { format: 'webm' }
}
