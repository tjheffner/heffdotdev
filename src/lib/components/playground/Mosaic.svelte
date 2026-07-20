<script lang="ts" context="module">
  export type MosaicShape = 'square' | 'circle' | 'ring' | 'triangle' | 'diamond' | 'arc' | 'line';
  export type MosaicMotion = 'none' | 'pulse' | 'spin' | 'wave' | 'fade';
  export type MosaicColorMode = 'spectrum' | 'duo' | 'mono' | 'custom';
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { makeRng, hashSeed } from '$lib/playground/rng';
  import { hslString as hsl } from '$lib/playground/color';
  import { paletteColor as palette } from '$lib/playground/palette';
  import CanvasStage, { type StageView } from './CanvasStage.svelte';

  // --- grid ----------------------------------------------------------------
  export let bg = '#101018';
  export let seed: string | number = 'mosaic';
  export let cols = 14; // cells across; rows follow from the viewport
  export let gap = 0.14; // padding inside each cell, fraction of the cell
  export let density = 0.92; // chance a cell is filled at all

  // --- shapes ---------------------------------------------------------------
  export let shapes: MosaicShape[] = ['square', 'circle', 'arc'];
  export let size = 0.8; // base shape size, fraction of the cell
  export let vary = 0.3; // per-cell size variation, 0..1
  export let rotate = 0; // max random rotation per cell, degrees
  export let round = 0.18; // corner rounding for squares, 0..1

  // --- color ----------------------------------------------------------------
  export let colorMode: MosaicColorMode = 'spectrum';
  export let hue = 210;
  export let hueSpread = 140;
  export let sat = 70;
  export let light = 60;
  export let customColors: string[] = ['#ff6b35', '#ffd23f', '#3bceac', '#0ead69', '#540d6e'];

  // --- motion ---------------------------------------------------------------
  // One shared tween; Desync blends between the whole grid moving in phase
  // (a coherent breath/ripple) and every cell on its own random clock.
  export let motion: MosaicMotion = 'pulse';
  export let speed = 0.25; // 0 = still
  export let desync = 0.35;

  export let zoom = 1;
  export let zoomMin = 0.25;
  export let zoomMax = 4;
  export let contained = true;
  export let interactive = false;
  export let onRendered: (() => void) | undefined = undefined;

  let stage: CanvasStage;
  let mounted = false;

  const TAU = Math.PI * 2;
  const QUARTER = Math.PI / 2;

  // --- per-cell randomness ---------------------------------------------------
  // Only the raw rng draws are cached (they depend on the seed alone, in a
  // fixed order); everything visible derives from them plus the current
  // settings each frame. Tweaking a slider reshapes cells in place — it never
  // reshuffles the grid — and cells keep their identity as the grid grows.
  const R_SKIP = 0;
  const R_SHAPE = 1;
  const R_COLOR = 2;
  const R_LIGHT = 3;
  const R_SIZE = 4;
  const R_ROT = 5;
  const R_ORIENT = 6;
  const R_PHASE = 7;
  const R_RATE = 8;
  const R_DIR = 9;
  let cellCache = new Map<string, Float64Array>();
  let cacheSeed: string | number = '';

  function cellRaw(col: number, row: number): Float64Array {
    if (cacheSeed !== seed) {
      cellCache = new Map();
      cacheSeed = seed;
    }
    const key = `${col}:${row}`;
    let raw = cellCache.get(key);
    if (!raw) {
      const rng = makeRng(hashSeed(`${seed}:${col}:${row}`));
      raw = new Float64Array(10);
      for (let i = 0; i < 10; i++) raw[i] = rng();
      cellCache.set(key, raw);
    }
    return raw;
  }

  // --- animation clock -------------------------------------------------------
  let time = 0;
  let rafId = 0;
  let lastNow = 0;
  let reduced = false;
  let mql: MediaQueryList | undefined;
  let onMQ: (() => void) | undefined;
  let onVisibility: (() => void) | undefined;

  $: animating = motion !== 'none' && speed > 0 && !reduced;

  function tick(now: number) {
    const dt = Math.min((now - lastNow) / 1000, 1 / 30);
    lastNow = now;
    if (!document.hidden) {
      time += dt;
      stage?.paint();
    }
    rafId = requestAnimationFrame(tick);
  }

  function syncLoop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (animating) {
      lastNow = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  $: if (mounted) {
    void animating;
    syncLoop();
  }

  // --- drawing ---------------------------------------------------------------
  function drawShape(
    ctx: CanvasRenderingContext2D,
    kind: MosaicShape,
    e: number,
    color: string
  ) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    switch (kind) {
      case 'square': {
        const r = Math.min(1, Math.max(0, round)) * e;
        ctx.beginPath();
        ctx.roundRect(-e, -e, e * 2, e * 2, r);
        ctx.fill();
        break;
      }
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, e, 0, TAU);
        ctx.fill();
        break;
      case 'ring':
        ctx.beginPath();
        ctx.arc(0, 0, e * 0.72, 0, TAU);
        ctx.lineWidth = e * 0.45;
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -e);
        ctx.lineTo(e * 0.92, e * 0.75);
        ctx.lineTo(-e * 0.92, e * 0.75);
        ctx.closePath();
        ctx.fill();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -e);
        ctx.lineTo(e, 0);
        ctx.lineTo(0, e);
        ctx.lineTo(-e, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case 'arc':
        // Truchet quarter-pipes: two arcs joining edge midpoints. Orientation
        // comes from the cell's quarter-turn rotation.
        ctx.lineWidth = e * 0.38;
        ctx.beginPath();
        ctx.arc(-e, -e, e, 0, QUARTER);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(e, e, e, Math.PI, Math.PI + QUARTER);
        ctx.stroke();
        break;
      case 'line':
        ctx.lineWidth = e * 0.32;
        ctx.beginPath();
        ctx.moveTo(-e, -e);
        ctx.lineTo(e, e);
        ctx.stroke();
        break;
    }
  }

  // Mirrored camera so the video exporter can reproduce the on-screen framing
  // at clip resolution.
  let w = 0;
  let h = 0;
  let panX = 0;
  let panY = 0;

  // Seamless-loop state: every time-varying term is a sinusoid (or a rotation,
  // which is 2π-periodic), so a loop just needs each one to advance a whole
  // number of cycles over the clip — snapped per cell via round().
  let loopBaseClock = 0;
  let loopAdv = 0;

  function renderGrid(
    ctx: CanvasRenderingContext2D,
    w0: number,
    h0: number,
    px: number,
    py: number,
    tSec: number,
    loop: { u: number } | null
  ) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w0, h0);

    const enabled = shapes.length ? shapes : (['square'] as MosaicShape[]);
    const n = Math.max(2, Math.round(cols));
    const cell = w0 / n;
    const rows = Math.ceil(h0 / cell);
    const inner = (cell * (1 - Math.min(0.9, Math.max(0, gap)))) / 2;
    const rotMax = (rotate * Math.PI) / 180;
    const clock = tSec * (0.6 + speed * 3);
    const live = motion !== 'none' && speed > 0;
    // Time angle at frequency multiple k: the live clock, or the loop-snapped
    // equivalent (base + whole-cycles · u).
    const ang = (k: number) =>
      loop ? loopBaseClock * k + Math.round((loopAdv * k) / TAU) * TAU * loop.u : clock * k;

    ctx.save();
    ctx.translate(w0 / 2 + px, h0 / 2 + py);
    ctx.scale(zoom, zoom);
    ctx.translate(-w0 / 2, -h0 / 2);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < n; col++) {
        const raw = cellRaw(col, row);
        if (raw[R_SKIP] > density) continue;

        const kind = enabled[Math.floor(raw[R_SHAPE] * enabled.length) % enabled.length];
        const c = palette(colorMode, { hue, hueSpread, sat, light, customColors }, raw[R_COLOR]);
        const color = hsl({ ...c, l: c.l + (raw[R_LIGHT] - 0.5) * 14 });

        const sizeMul = Math.max(0.05, size * (1 + (raw[R_SIZE] - 0.5) * vary));
        // Quarter-turn orientation gives arc/line/triangle crisp variants even
        // at Rotate 0; free rotation layers on top.
        const orient =
          kind === 'arc' || kind === 'line' || kind === 'triangle'
            ? Math.floor(raw[R_ORIENT] * 4) * QUARTER
            : 0;
        let rot = orient + (raw[R_ROT] - 0.5) * 2 * rotMax;
        let scl = 1;
        let dy = 0;
        let alpha = 1;

        if (live) {
          // Shared tween, phased per cell: a diagonal grid ripple blended
          // toward each cell's own random phase/rate by Desync.
          const phase =
            (col + row) * 0.7 * (1 - desync) + raw[R_PHASE] * TAU * desync;
          const rate = 1 + (raw[R_RATE] - 0.5) * (0.2 + desync * 0.8);
          if (motion === 'pulse') scl = 1 + 0.22 * Math.sin(ang(rate * 1.7) + phase);
          else if (motion === 'spin') rot += (raw[R_DIR] < 0.5 ? -1 : 1) * ang(rate * 1.2);
          else if (motion === 'wave') dy = Math.sin(ang(rate * 1.5) + phase) * cell * 0.18;
          else if (motion === 'fade') alpha = 0.55 + 0.45 * Math.sin(ang(rate * 1.6) + phase);
        }

        ctx.save();
        ctx.translate((col + 0.5) * cell, (row + 0.5) * cell + dy);
        if (rot) ctx.rotate(rot);
        ctx.globalAlpha = Math.max(0.05, alpha);
        drawShape(ctx, kind, inner * sizeMul * scl, color);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function draw(ctx: CanvasRenderingContext2D, view: StageView) {
    w = view.w;
    h = view.h;
    panX = view.panX;
    panY = view.panY;
    renderGrid(ctx, w, h, panX, panY, time, null);
  }

  // Repaint on any visual prop change; the per-cell raws are seed-cached, so
  // this is just a redraw, not a reshuffle.
  $: if (
    mounted &&
    (void [
      bg, seed, cols, gap, density, shapes, size, vary, rotate, round,
      colorMode, hue, hueSpread, sat, light, customColors, motion, speed, desync
    ],
    true)
  ) {
    stage?.paint();
  }

  export const recenter = () => stage?.recenter();
  export const snapshot = (bgFill: string, maxDim = 128) => stage?.snapshot(bgFill, maxDim) ?? null;
  export const saveImage = (filename = 'mosaic.png') => stage?.saveImage(filename);
  export const sampleLuminance = (stripFrac = 0.16) => stage?.sampleLuminance(bg, stripFrac) ?? null;

  // --- video capture ---------------------------------------------------------
  // The grid is a pure function of (time, props, camera), so capture just
  // re-renders at clip resolution with the pan scaled to match the on-screen
  // framing. The live rAF loop keeps running untouched.
  export const currentTime = () => time;
  export function captureFrame(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const k = w ? W / w : 1;
    renderGrid(ctx, W, H, panX * k, panY * k, t, null);
  }
  /** Snap the loop's clock advance so every cell's sinusoid closes exactly. */
  export function beginLoop(seconds: number) {
    loopBaseClock = time * (0.6 + speed * 3);
    // Guarantee at least ~a full base cycle so short/slow loops aren't static.
    loopAdv = Math.max(seconds * (0.6 + speed * 3), TAU);
  }
  export function captureLoopFrame(ctx: CanvasRenderingContext2D, W: number, H: number, u: number) {
    const k = w ? W / w : 1;
    renderGrid(ctx, W, H, panX * k, panY * k, 0, { u });
  }

  onMount(() => {
    mounted = true;
    mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = mql.matches;
    onMQ = () => {
      reduced = mql?.matches ?? false;
    };
    mql.addEventListener?.('change', onMQ);
    onVisibility = () => {
      lastNow = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    syncLoop();
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
