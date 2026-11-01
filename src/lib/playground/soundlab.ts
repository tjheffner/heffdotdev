// Soundlab's synth. One graph type drives both live playback (AudioContext)
// and WAV export (OfflineAudioContext), so what you hear is what you export.

export type Wave = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'noise'
export type Note = { step: number; row: number; len: number }
export type Instrument = {
  wave: Wave
  vol: number
  attack: number
  decay: number
  sustain: number
  release: number
  sweep: number // semitones the note starts away from its pitch
  sweepTime: number // seconds to glide back to pitch
  cutoff: number
  q: number
  detune: number // cents; > 0 stacks a second, detuned oscillator
  reverb: number
  echo: number
}
export type Track = Instrument & {
  name: string
  color: string
  octave: number
  mute: boolean
  // Own effects: when on, this track's reverb/echo sends go to its own room
  // (size, echo steps, feedback) instead of the song's.
  fx: boolean
  fxSize: number
  fxEcho: number
  fxFeedback: number
  notes: Note[]
}
export type Song = {
  bpm: number
  steps: number
  root: number
  scale: ScaleName
  loop: boolean
  reverbSize: number
  echoSteps: number
  echoFeedback: number
  tracks: Track[]
}

export const WAVES: Wave[] = ['sine', 'triangle', 'square', 'sawtooth', 'noise']
export const SCALES = {
  'Minor pent.': [0, 3, 5, 7, 10],
  'Major pent.': [0, 2, 4, 7, 9],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Major: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}
export type ScaleName = keyof typeof SCALES
export const SCALE_NAMES = Object.keys(SCALES) as ScaleName[]
export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

const BASE: Instrument = {
  wave: 'square',
  vol: 0.7,
  attack: 0.005,
  decay: 0.15,
  sustain: 0.5,
  release: 0.08,
  sweep: 0,
  sweepTime: 0.05,
  cutoff: 8000,
  q: 0,
  detune: 0,
  reverb: 0.15,
  echo: 0,
}
// Starting points; every value stays editable after loading one.
export const PRESETS: Record<string, Partial<Instrument>> = {
  'Chip lead': { echo: 0.2 },
  'Soft pad': {
    wave: 'triangle',
    attack: 0.6,
    decay: 0.8,
    sustain: 0.7,
    release: 1.2,
    cutoff: 1800,
    detune: 9,
    reverb: 0.6,
    echo: 0.1,
  },
  Pluck: {
    wave: 'sawtooth',
    attack: 0.002,
    decay: 0.25,
    sustain: 0,
    release: 0.2,
    cutoff: 2200,
    q: 4,
    reverb: 0.3,
  },
  Bell: {
    wave: 'sine',
    attack: 0.002,
    decay: 1.2,
    sustain: 0,
    release: 0.8,
    reverb: 0.5,
    echo: 0.25,
  },
  Bass: {
    wave: 'triangle',
    vol: 0.8,
    decay: 0.2,
    sustain: 0.6,
    release: 0.1,
    cutoff: 900,
    reverb: 0,
  },
  Kick: {
    wave: 'sine',
    vol: 0.9,
    attack: 0.001,
    decay: 0.25,
    sustain: 0,
    release: 0.05,
    sweep: 24,
    sweepTime: 0.06,
    reverb: 0,
  },
  Snare: {
    wave: 'noise',
    attack: 0.001,
    decay: 0.15,
    sustain: 0,
    release: 0.05,
    cutoff: 7000,
    reverb: 0.2,
  },
  Hat: {
    wave: 'noise',
    vol: 0.4,
    attack: 0.001,
    decay: 0.04,
    sustain: 0,
    release: 0.02,
    cutoff: 12000,
    reverb: 0,
  },
  Zap: {
    attack: 0.001,
    decay: 0.2,
    sustain: 0,
    release: 0.05,
    sweep: 12,
    sweepTime: 0.18,
    cutoff: 5000,
    reverb: 0,
  },
  Blip: {
    wave: 'triangle',
    attack: 0.001,
    decay: 0.08,
    sustain: 0,
    release: 0.04,
    sweep: -5,
    sweepTime: 0.03,
    reverb: 0.1,
  },
}
export const PRESET_NAMES = Object.keys(PRESETS)

// One per track, in order; new tracks take the first color not in use.
export const TRACK_COLORS = [
  '#8fa8ff', // periwinkle
  '#c79bf2', // lavender
  '#f283b0', // pink
  '#9fdc6e', // green
  '#6fc6e8', // sky
  '#f0e07a', // lemon
  '#e6e6e6', // silver
  '#b8a3ff', // iris
]

export const makeTrack = (
  name: string,
  preset: string,
  color: string,
  octave = 4,
  notes: Note[] = []
): Track => ({
  ...BASE,
  ...PRESETS[preset],
  name,
  color,
  octave,
  mute: false,
  fx: false,
  fxSize: 2.2,
  fxEcho: 3,
  fxFeedback: 0.35,
  notes,
})

/** The reverb size, echo time (s) and feedback a track actually plays through. */
export function fxOf(s: Song, t: Track) {
  const [size, steps, feedback] = t.fx
    ? [t.fxSize, t.fxEcho, t.fxFeedback]
    : [s.reverbSize, s.echoSteps, s.echoFeedback]
  return { size, echo: Math.min(5, steps * stepDur(s.bpm)), feedback }
}

/** Grid rows: two octaves of the scale plus the top root. */
export const rowCount = (scale: ScaleName) => SCALES[scale].length * 2 + 1
export const stepDur = (bpm: number) => 60 / bpm / 4 // 16th notes
export function midiOf(
  root: number,
  scale: ScaleName,
  octave: number,
  row: number
) {
  const s = SCALES[scale]
  return (
    12 * (octave + 1) +
    root +
    s[row % s.length] +
    12 * Math.floor(row / s.length)
  )
}
export const noteName = (midi: number) =>
  `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
const freqOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

function impulse(ctx: BaseAudioContext, seconds: number) {
  const n = Math.max(1, Math.round(Math.max(0.05, seconds) * ctx.sampleRate))
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3
  return buf
}

/**
 * Effect buses plus a per-note voice factory. Buses are made on demand and
 * cached by their settings, so the song's room and any per-track rooms are
 * the same thing, and tracks with matching settings share one bus.
 */
export function createGraph(ctx: BaseAudioContext) {
  const out = ctx.createGain()
  out.gain.value = 0.4
  out.connect(ctx.destination)
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  noise.getChannelData(0).forEach((_, i, d) => (d[i] = Math.random() * 2 - 1))

  // Dragging an effect slider mid-play makes a new bus per value; keep the 8
  // most recently used and drop the rest (a dropped bus's tail is cut).
  const buses = new Map<string, AudioNode>()
  function bus(key: string, make: () => AudioNode) {
    let node = buses.get(key)
    if (node) buses.delete(key)
    else node = make()
    buses.set(key, node)
    if (buses.size > 8) {
      const [oldKey, old] = buses.entries().next().value!
      old.disconnect()
      buses.delete(oldKey)
    }
    return node
  }
  const reverbBus = (size: number) =>
    bus(`r${size}`, () => {
      const v = ctx.createConvolver()
      v.buffer = impulse(ctx, size)
      v.connect(out)
      return v
    })
  const echoBus = (time: number, feedback: number) =>
    bus(`e${time}|${feedback}`, () => {
      const d = ctx.createDelay(5)
      d.delayTime.value = time
      const fb = ctx.createGain()
      fb.gain.value = feedback
      d.connect(fb).connect(d)
      d.connect(out)
      return d
    })

  function play(s: Song, t: Track, n: Note, time: number) {
    const dur = n.len * stepDur(s.bpm)
    const f = freqOf(midiOf(s.root, s.scale, t.octave, n.row))
    const env = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    filt.frequency.value = t.cutoff
    filt.Q.value = t.q
    filt.connect(env).connect(out)
    const fx = fxOf(s, t)
    for (const [amt, to] of [
      [t.reverb, () => reverbBus(fx.size)],
      [t.echo, () => echoBus(fx.echo, fx.feedback)],
    ] as const) {
      if (amt <= 0) continue
      const send = ctx.createGain()
      send.gain.value = amt
      env.connect(send).connect(to())
    }

    const stacked = t.detune > 0 && t.wave !== 'noise'
    const peak = t.vol * (stacked ? 0.6 : 1)
    const a = Math.max(0.001, t.attack)
    const relAt = time + Math.max(dur, a)
    const end = relAt + t.release + 0.02
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(peak, time + a)
    env.gain.setTargetAtTime(
      peak * t.sustain,
      time + a,
      Math.max(0.001, t.decay) / 4
    )
    env.gain.setTargetAtTime(0, relAt, Math.max(0.001, t.release) / 5)

    const glide = (p: AudioParam, v: number) => {
      p.setValueAtTime(t.sweep ? v * 2 ** (t.sweep / 12) : v, time)
      if (t.sweep)
        p.exponentialRampToValueAtTime(v, time + Math.max(0.001, t.sweepTime))
    }
    const start = (src: AudioScheduledSourceNode) => {
      src.connect(filt)
      src.start(time)
      src.stop(end)
    }
    if (t.wave === 'noise') {
      // Pitch shifts the noise's color: low rows rumble, high rows hiss.
      const src = ctx.createBufferSource()
      src.buffer = noise
      src.loop = true
      glide(src.playbackRate, Math.min(4, f / 880))
      start(src)
    } else {
      for (const cents of stacked ? [-t.detune, t.detune] : [0]) {
        const osc = ctx.createOscillator()
        osc.type = t.wave
        osc.detune.value = cents
        glide(osc.frequency, f)
        start(osc)
      }
    }
  }

  // Silence everything this graph has playing or queued (notes, tails,
  // reverb, echo) with a ~20ms fade so it doesn't click. The graph is
  // spent afterwards; build a new one to play again.
  function silence() {
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.005)
    setTimeout(() => out.disconnect(), 100)
  }

  return { play, silence }
}

/** Seconds of sound after the last note ends: release, reverb, echo decay. */
function tailSeconds(s: Song) {
  const tails = s.tracks
    .filter((t) => !t.mute)
    .map((t) => {
      const fx = fxOf(s, t)
      const repeats =
        t.echo <= 0
          ? 0
          : fx.feedback > 0.01
            ? Math.ceil(Math.log(0.01) / Math.log(fx.feedback))
            : 1
      return t.release + (t.reverb > 0 ? fx.size : 0) + fx.echo * repeats
    })
  return Math.min(12, Math.max(0, ...tails) + 0.1)
}

/**
 * Render the song offline. Loop mode renders two passes and keeps the second,
 * so tails and held notes from the end wrap into the start and the file
 * repeats without a seam. One-shot mode keeps the full tail, then trims silence.
 */
export async function renderSong(
  s: Song,
  sampleRate: number,
  normalize: boolean
) {
  const sd = stepDur(s.bpm)
  const len = s.steps * sd
  const lastEnd = Math.max(
    0,
    ...s.tracks.flatMap((t) => t.notes.map((n) => (n.step + n.len) * sd))
  )
  const total = s.loop ? len * 2 : Math.max(len, lastEnd) + tailSeconds(s)
  const ctx = new OfflineAudioContext(
    1,
    Math.ceil(total * sampleRate),
    sampleRate
  )
  const g = createGraph(ctx)
  for (let pass = 0; pass < (s.loop ? 2 : 1); pass++)
    for (const t of s.tracks)
      if (!t.mute)
        for (const n of t.notes)
          if (n.step < s.steps) g.play(s, t, n, pass * len + n.step * sd)
  let data = (await ctx.startRendering()).getChannelData(0)

  let peak = 0
  for (const v of data) peak = Math.max(peak, Math.abs(v))
  if (s.loop)
    data = data.slice(
      Math.round(len * sampleRate),
      Math.round(2 * len * sampleRate)
    )
  else {
    let last = data.length - 1
    while (last > 0 && Math.abs(data[last]) < peak * 1e-3) last--
    data = data.slice(
      0,
      Math.min(data.length, last + Math.round(0.01 * sampleRate))
    )
  }
  if (normalize && peak > 0) data = data.map((v) => (v / peak) * 0.89)
  return encodeWav(data, sampleRate)
}

/** 16-bit mono PCM WAV. */
export function encodeWav(data: Float32Array, sampleRate: number) {
  const buf = new DataView(new ArrayBuffer(44 + data.length * 2))
  const str = (o: number, s: string) =>
    [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  buf.setUint32(4, 36 + data.length * 2, true)
  str(8, 'WAVEfmt ')
  buf.setUint32(16, 16, true)
  buf.setUint16(20, 1, true) // PCM
  buf.setUint16(22, 1, true) // mono
  buf.setUint32(24, sampleRate, true)
  buf.setUint32(28, sampleRate * 2, true)
  buf.setUint16(32, 2, true)
  buf.setUint16(34, 16, true)
  str(36, 'data')
  buf.setUint32(40, data.length * 2, true)
  data.forEach((v, i) =>
    buf.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true)
  )
  return new Blob([buf], { type: 'audio/wav' })
}
