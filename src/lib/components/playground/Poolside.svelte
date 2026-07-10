<script lang="ts">
  import { onMount } from 'svelte';
  import { hexRgb } from '$lib/playground/color';
  import CanvasStage, { type StageView } from './CanvasStage.svelte';

  // Top-down pool caustics: an animated shimmering light-network over colored
  // water. Unlike the other (static) canvas playgrounds, this one runs its own
  // requestAnimationFrame loop — each tick advances `time`, recomputes a small
  // offscreen buffer per-pixel, and repaints the stage. `draw()` is a pure blit;
  // all the per-pixel work lives in the tick so panning/zooming stays smooth.

  // --- water color (3 gradient stops the caustic intensity maps through) ---
  export let deepColor = '#0a3a5c'; // base water + the full-bleed pre-fill
  export let shallowColor = '#1f8fb5';
  export let causticColor = '#dffbff'; // bright veins

  // --- pattern -------------------------------------------------------------
  export let speed = 1; // animation rate (0 = frozen)
  export let scale = 6; // field zoom — vein density/size
  export let intensity = 1; // highlight gain
  export let sharpness = 8; // vein thinness/contrast (pow exponent)
  export let iterations = 5; // detail vs perf
  export let turbulence = 0.4; // domain-warp amount
  export let phase = 0; // offsets the field so scenes differ
  export let angle = 0; // rotates the whole field (degrees) — flow direction
  export let swirl = 0; // radius-based domain twist — bends the network into spirals
  export let grain = 1; // caustic vein thickness / coverage (scales inner reciprocal)
  export let weave = 3.5; // per-octave time divergence — restructures the interference
  export let detail = 256; // offscreen buffer long edge (px) — perf/quality dial

  // --- camera (mirrors Triangles) -----------------------------------------
  export let zoom = 1;
  export let zoomMin = 0.25;
  export let zoomMax = 4;
  export let contained = true;
  export let interactive = false;
  export let onRendered: (() => void) | undefined = undefined;

  const TAU = Math.PI * 2;
  const INTEN = 0.005; // fixed inner scale of the caustic reciprocal

  // Camera/canvas live in CanvasStage; these mirror the current view.
  let stage: CanvasStage;
  let w = 0;
  let h = 0;
  let panX = 0;
  let panY = 0;

  // Offscreen buffer we compute into, then blit (scaled) onto the stage.
  let buffer: HTMLCanvasElement | undefined;
  let bctx: CanvasRenderingContext2D | null = null;
  let imageData: ImageData | undefined;
  let u32: Uint32Array | undefined;
  let bufW = 0;
  let bufH = 0;

  // 256-entry packed-ABGR gradient LUT (deep → shallow → caustic), rebuilt only
  // when a color changes so the per-pixel path is a single index + store.
  let lut = new Uint32Array(256);

  // Per-octave phase scratch (constant across pixels within a frame).
  const octScratch = new Float64Array(16);
  // Seamless-loop state (see beginLoop): each octave's phase advances by a whole
  // number of cycles over u∈[0,1), passed to fillCaustic during loop capture.
  let loopBase: Float64Array | null = null;
  let loopCyc: Float64Array | null = null;

  let time = 0;
  let lastNow = 0;
  let rafId = 0;
  let mounted = false;
  let reduced = false;
  let mql: MediaQueryList | undefined;
  let onMQ: () => void;
  let onVisibility: () => void;

  // Pack r,g,b into the little-endian RGBA byte order ImageData expects.
  const abgr = (r: number, g: number, b: number) =>
    ((0xff000000 | (b << 16) | (g << 8) | r) >>> 0);

  function buildLut() {
    const d = hexRgb(deepColor);
    const s = hexRgb(shallowColor);
    const c = hexRgb(causticColor);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let r: number;
      let g: number;
      let b: number;
      if (t < 0.5) {
        const k = t / 0.5;
        r = d.r + (s.r - d.r) * k;
        g = d.g + (s.g - d.g) * k;
        b = d.b + (s.b - d.b) * k;
      } else {
        const k = (t - 0.5) / 0.5;
        r = s.r + (c.r - s.r) * k;
        g = s.g + (c.g - s.g) * k;
        b = s.b + (c.b - s.b) * k;
      }
      lut[i] = abgr(r | 0, g | 0, b | 0);
    }
  }

  // (Re)allocate the buffer when the detail or the canvas aspect changes.
  function ensureBuffer() {
    const long = Math.max(16, Math.round(detail));
    let bw: number;
    let bh: number;
    if (w >= h) {
      bw = long;
      bh = Math.max(1, Math.round((long * h) / w));
    } else {
      bh = long;
      bw = Math.max(1, Math.round((long * w) / h));
    }
    if (bw === bufW && bh === bufH && buffer) return;
    bufW = bw;
    bufH = bh;
    if (!buffer) buffer = document.createElement('canvas');
    buffer.width = bw;
    buffer.height = bh;
    bctx = buffer.getContext('2d');
    imageData = bctx?.createImageData(bw, bh);
    u32 = imageData ? new Uint32Array(imageData.data.buffer) : undefined;
  }

  // The classic TDM caustic, ported per-pixel into `out`. Each divisor is
  // epsilon-guarded (the sin/cos terms cross zero) and the final intensity
  // clamped, so a bad pixel degrades to deep water rather than NaN/Infinity
  // speckle. Pure over the current scene params + the passed time/camera, so the
  // live loop and the video exporter share one code path. `pfx`/`pfy` are the
  // pan as a fraction of the viewport (0,0 = centered).
  function fillCaustic(
    out: Uint32Array,
    bw: number,
    bh: number,
    timeVal: number,
    pfx: number,
    pfy: number,
    lb?: Float64Array | null,
    lc?: Float64Array | null,
    lu = 0
  ) {
    const aspect = bw / bh;
    const T = timeVal * 0.5 + 23.0 + phase * 0.15;
    const off = 250.0 + phase; // sampling-window shift → distinct looks per phase
    const turbMul = 0.55 + turbulence * 0.9;
    const iters = Math.max(2, Math.round(iterations));
    const table = lut;
    const sin = Math.sin;
    const cos = Math.cos;
    const sqrt = Math.sqrt;

    // Per-octave phase is constant across all pixels, so hoist it out of the pixel
    // loop. In loop mode it comes from precomputed base/cycle arrays (whole cycles
    // over u∈[0,1), for a seamless clip); otherwise it advances linearly with time.
    const oct = octScratch;
    if (lb && lc) {
      for (let n = 0; n < iters; n++) oct[n] = lb[n] + lc[n] * lu;
    } else {
      const wv = weave || 3.5;
      for (let n = 0; n < iters; n++) oct[n] = T * (1 - wv / (n + 1));
    }

    // Fold the camera into the field so the buffer always fills the viewport
    // (no border to reveal) and pan/zoom tile through an infinite caustic field.
    const iz = 1 / (zoom || 1);
    // Structural levers that restructure the wave shapes (not just brightness):
    // rotation sets the flow direction; swirl twists the domain by an angle that
    // grows with radius (bending the network into spirals); weave changes how the
    // octaves' phases diverge; grain scales the vein thickness.
    const ang = angle * (Math.PI / 180);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const inten = INTEN * (grain || 1);

    let idx = 0;
    for (let y = 0; y < bh; y++) {
      const by = (y / bh - 0.5 - pfy) * iz;
      for (let x = 0; x < bw; x++) {
        const bx = (x / bw - 0.5 - pfx) * iz * aspect;
        let rx = bx * cosA - by * sinA;
        let ry = bx * sinA + by * cosA;
        if (swirl !== 0) {
          const r = sqrt(rx * rx + ry * ry);
          const sa = swirl * r;
          const cs = cos(sa);
          const sn = sin(sa);
          const nx = rx * cs - ry * sn;
          ry = rx * sn + ry * cs;
          rx = nx;
        }
        const ux = (rx * scale * TAU) % TAU;
        const uy = (ry * scale * TAU) % TAU;
        const pX = ux - off;
        const pY = uy - off;

        let ix = pX;
        let iy = pY;
        let c = 1.0;
        for (let n = 0; n < iters; n++) {
          const t = oct[n];
          const nix = pX + turbMul * (cos(t - ix) + sin(t + iy));
          const niy = pY + turbMul * (sin(t - iy) + cos(t + ix));
          ix = nix;
          iy = niy;
          let sx = sin(ix + t);
          let cxy = cos(iy + t);
          if (sx > -1e-4 && sx < 1e-4) sx = sx < 0 ? -1e-4 : 1e-4;
          if (cxy > -1e-4 && cxy < 1e-4) cxy = cxy < 0 ? -1e-4 : 1e-4;
          const ax = (pX * inten) / sx;
          const ay = (pY * inten) / cxy;
          c += 1.0 / (sqrt(ax * ax + ay * ay) + 1e-4);
        }
        c /= iters;
        c = 1.17 - Math.pow(Math.abs(c), 1.4);
        let v = Math.pow(Math.abs(c), sharpness) * intensity;
        // Clamp + NaN guard before indexing the LUT.
        let m = v <= 0 ? 0 : v >= 1 ? 1 : v;
        if (m !== m) m = 0; // NaN
        out[idx++] = table[(m * 255) | 0];
      }
    }
  }

  function computeField() {
    if (!bctx || !imageData || !u32) return;
    fillCaustic(u32, bufW, bufH, time, panX / (w || 1), panY / (h || 1));
    bctx.putImageData(imageData, 0, 0);
  }

  // Pure blit. `paint()` has already cleared + set the dpr transform. The buffer
  // is computed at the viewport aspect and the camera lives inside the field, so
  // we blit it 1:1 across the whole viewport — it always fills, no border. The
  // deep-color fill only covers the first frame before the buffer exists.
  function draw(context: CanvasRenderingContext2D, view: StageView) {
    w = view.w;
    h = view.h;
    panX = view.panX;
    panY = view.panY;
    context.fillStyle = deepColor;
    context.fillRect(0, 0, w, h);
    if (!buffer || !bufW) return;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(buffer, 0, 0, buffer.width, buffer.height, 0, 0, w, h);
  }

  function renderFrame() {
    if (!w || !h) return;
    ensureBuffer();
    computeField();
    stage?.paint();
  }

  function tick(now: number) {
    const dt = Math.min((now - lastNow) / 1000, 1 / 30);
    lastNow = now;
    if (!document.hidden) {
      time += dt * speed;
      renderFrame();
    }
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    lastNow = performance.now();
    if (reduced) {
      renderFrame(); // one still frame, no loop
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  // Rebuild the color LUT (cheap) whenever a stop changes.
  $: if (mounted) {
    void [deepColor, shallowColor, causticColor];
    buildLut();
    if (reduced) renderFrame();
  }

  // Camera + export helpers forward to the stage. `sampleLuminance` returns the
  // deep-color luminance so the page's chrome-contrast logic works without a
  // per-frame canvas readback.
  export const recenter = () => stage?.recenter();
  export const snapshot = (bgFill: string, maxDim = 128) =>
    stage?.snapshot(bgFill, maxDim) ?? null;
  export const saveImage = (filename = 'poolside.png') => stage?.saveImage(filename);
  export const sampleLuminance = () => {
    const { r, g, b } = hexRgb(deepColor);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  // --- video capture -------------------------------------------------------
  // A separate offscreen buffer so recording never disturbs the live buffer.
  let capBuf: HTMLCanvasElement | undefined;
  let capBctx: CanvasRenderingContext2D | null = null;
  let capImg: ImageData | undefined;
  let capU32: Uint32Array | undefined;
  let capBw = 0;
  let capBh = 0;

  function ensureCapBuffer(long: number, aw: number, ah: number) {
    let bw: number;
    let bh: number;
    if (aw >= ah) {
      bw = long;
      bh = Math.max(1, Math.round((long * ah) / aw));
    } else {
      bh = long;
      bw = Math.max(1, Math.round((long * aw) / ah));
    }
    if (bw === capBw && bh === capBh && capBuf) return;
    capBw = bw;
    capBh = bh;
    if (!capBuf) capBuf = document.createElement('canvas');
    capBuf.width = bw;
    capBuf.height = bh;
    capBctx = capBuf.getContext('2d');
    capImg = capBctx?.createImageData(bw, bh);
    capU32 = capImg ? new Uint32Array(capImg.data.buffer) : undefined;
  }

  /** The current animation clock, so a clip can start from "now". */
  export const currentTime = () => time;

  /**
   * Paint one frame at `W`×`H` for animation time `tSeconds` into `ctx`. Used by
   * the video exporter: current zoom/pan/colors/params apply (the pan fraction is
   * resolution-independent, so the clip matches the on-screen framing). The
   * caustic is computed at the `detail` buffer size then upscaled.
   */
  export function captureFrame(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    tSeconds: number
  ) {
    ensureCapBuffer(Math.max(16, Math.round(detail)), W, H);
    if (!capBctx || !capImg || !capU32 || !capBuf) return;
    fillCaustic(capU32, capBw, capBh, tSeconds, panX / (w || 1), panY / (h || 1));
    capBctx.putImageData(capImg, 0, 0);
    ctx.fillStyle = deepColor;
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(capBuf, 0, 0, capBw, capBh, 0, 0, W, H);
  }

  // --- seamless loop -------------------------------------------------------
  // The field depends on time only through one phase per octave, so a loop just
  // needs each octave to advance a whole number of cycles. `beginLoop` snaps each
  // octave's advance to the nearest integer cycle count; `captureLoopFrame(u)`
  // then evaluates the field at loop position u∈[0,1). round() makes the seam
  // exact; the advance size only affects how much motion the loop shows.
  export function beginLoop(seconds: number) {
    const iters = Math.max(2, Math.round(iterations));
    const T0 = time * 0.5 + 23.0 + phase * 0.15;
    const wv = weave || 3.5;
    let dTnom = 0.5 * speed * seconds; // T advance over the clip at the live speed
    let maxK = 0;
    for (let n = 0; n < iters; n++) {
      const k = Math.abs(1 - wv / (n + 1));
      if (k > maxK) maxK = k;
    }
    // Guarantee the fastest octave makes a couple of cycles so the loop isn't near-static.
    if (speed > 0 && maxK > 0) dTnom = Math.max(dTnom, (2 * Math.PI * 2) / maxK);
    loopBase = new Float64Array(iters);
    loopCyc = new Float64Array(iters);
    for (let n = 0; n < iters; n++) {
      const k = 1 - wv / (n + 1);
      loopBase[n] = T0 * k;
      loopCyc[n] = Math.round((dTnom * k) / (2 * Math.PI)) * 2 * Math.PI;
    }
  }
  export function endLoop() {
    loopBase = null;
    loopCyc = null;
  }
  export function captureLoopFrame(ctx: CanvasRenderingContext2D, W: number, H: number, u: number) {
    ensureCapBuffer(Math.max(16, Math.round(detail)), W, H);
    if (!capBctx || !capImg || !capU32 || !capBuf) return;
    fillCaustic(capU32, capBw, capBh, 0, panX / (w || 1), panY / (h || 1), loopBase, loopCyc, u);
    capBctx.putImageData(capImg, 0, 0);
    ctx.fillStyle = deepColor;
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(capBuf, 0, 0, capBw, capBh, 0, 0, W, H);
  }

  onMount(() => {
    mounted = true;
    buildLut();
    mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = mql.matches;
    onMQ = () => {
      reduced = mql?.matches ?? false;
      start();
    };
    mql.addEventListener?.('change', onMQ);

    onVisibility = () => {
      // Reset the clock on return so the dt clamp doesn't have to absorb the gap.
      lastNow = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);

    start();

    return () => {
      cancelAnimationFrame(rafId);
      mql?.removeEventListener?.('change', onMQ);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
</script>

<CanvasStage
  bind:this={stage}
  {draw}
  bind:zoom
  {zoomMin}
  {zoomMax}
  {contained}
  {interactive}
  {onRendered}
/>
