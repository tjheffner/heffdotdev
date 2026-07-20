<script lang="ts" context="module">
  export type MosaicShape = 'square' | 'circle' | 'ring' | 'triangle' | 'diamond' | 'arc' | 'line';
  export type MosaicMotion = 'pulse' | 'spin' | 'wave' | 'fade';
  export type MosaicMode = 'simple' | 'complex';
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
  export let mode: MosaicMode = 'simple'; // complex stacks several shapes per cell
  export let cols = 14; // cells across; rows follow from the viewport
  export let gap = 0.14; // padding inside each cell, fraction of the cell
  export let density = 0.92; // chance a cell is filled at all
  export let stack = 3; // complex mode: max shapes nested in one cell

  // --- shapes ---------------------------------------------------------------
  export let shapes: MosaicShape[] = ['square', 'circle', 'arc'];
  export let size = 0.8; // base shape size, fraction of the cell
  export let vary = 0.3; // per-item size variation, 0..1
  export let rotate = 0; // max random rotation per item, degrees
  export let round = 0.18; // corner rounding for squares, 0..1
  export let stroke = 0; // outline weight for filled shapes, 0 = none
  export let strokeMatch = true; // derive the outline from each item's own color
  export let outlineColor = '#000000';

  // --- color ----------------------------------------------------------------
  export let colorMode: MosaicColorMode = 'spectrum';
  export let hue = 210;
  export let hueSpread = 140;
  export let sat = 70;
  export let light = 60;
  export let customColors: string[] = ['#ff6b35', '#ffd23f', '#3bceac', '#0ead69', '#540d6e'];

  // --- motion ---------------------------------------------------------------
  // Any combination of tweens; every item carries its own phase/rate, so
  // stacked shapes in one cell scale, swing and fade out of step. Each tween
  // runs on its own tunable clock (0 = that tween is still). Desync blends
  // between a coherent grid ripple and fully independent clocks.
  export let motions: MosaicMotion[] = ['pulse'];
  export let pulseSpeed = 0.25;
  export let spinSpeed = 0.25;
  export let waveSpeed = 0.25;
  export let fadeSpeed = 0.25;
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
  // Only raw rng draws are cached (they depend on the seed alone, in a fixed
  // order); everything visible derives from them plus the current settings
  // each frame. Tweaking a slider reshapes cells in place — never reshuffles —
  // and cells keep their identity as the grid grows. Each cell carries slots
  // for MAX_ITEMS stacked items so switching simple/complex or resizing the
  // stack never shifts which random lands where.
  const CELL_F = 2; // skip, count
  const ITEM_F = 9;
  const MAX_ITEMS = 6;
  const R_SKIP = 0;
  const R_COUNT = 1;
  const I_SHAPE = 0;
  const I_COLOR = 1;
  const I_LIGHT = 2;
  const I_SIZE = 3;
  const I_ROT = 4;
  const I_ORIENT = 5;
  const I_PHASE = 6;
  const I_RATE = 7;
  const I_DIR = 8;
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
      raw = new Float64Array(CELL_F + ITEM_F * MAX_ITEMS);
      for (let i = 0; i < raw.length; i++) raw[i] = rng();
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

  const speedOf = (m: MosaicMotion) =>
    m === 'pulse' ? pulseSpeed : m === 'spin' ? spinSpeed : m === 'wave' ? waveSpeed : fadeSpeed;
  $: animating =
    motions.length > 0 &&
    (void [pulseSpeed, spinSpeed, waveSpeed, fadeSpeed], motions.some((m) => speedOf(m) > 0)) &&
    !reduced;

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
    color: string,
    edge: string | null // outline color for filled shapes, null = none
  ) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    const outline = () => {
      if (!edge) return;
      ctx.strokeStyle = edge;
      ctx.lineWidth = stroke;
      ctx.stroke();
    };
    switch (kind) {
      case 'square': {
        const r = Math.min(1, Math.max(0, round)) * e;
        ctx.beginPath();
        ctx.roundRect(-e, -e, e * 2, e * 2, r);
        ctx.fill();
        outline();
        break;
      }
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, e, 0, TAU);
        ctx.fill();
        outline();
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
        outline();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -e);
        ctx.lineTo(e, 0);
        ctx.lineTo(0, e);
        ctx.lineTo(-e, 0);
        ctx.closePath();
        ctx.fill();
        outline();
        break;
      case 'arc':
        // Truchet quarter-pipes: two arcs joining edge midpoints. Orientation
        // comes from the item's quarter-turn rotation.
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
  // number of cycles over the clip — snapped per item AND per tween clock via
  // round().
  let loopT0 = 0;
  let loopSeconds = 0;

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
    const stackN = Math.min(MAX_ITEMS, Math.max(1, Math.round(stack)));
    const hasPulse = motions.includes('pulse') && pulseSpeed > 0;
    const hasSpin = motions.includes('spin') && spinSpeed > 0;
    const hasWave = motions.includes('wave') && waveSpeed > 0;
    const hasFade = motions.includes('fade') && fadeSpeed > 0;
    const live = hasPulse || hasSpin || hasWave || hasFade;
    // Time angle for a tween running at speed `ms`, at frequency multiple `k`:
    // the tween's live clock, or the loop-snapped equivalent (base +
    // whole-cycles · u). Each tween loops on its own clock.
    const mAng = (ms: number, k: number) => {
      const rate = 0.6 + ms * 3;
      if (!loop) return tSec * rate * k;
      const adv = Math.max(loopSeconds * rate, TAU);
      return loopT0 * rate * k + Math.round((adv * k) / TAU) * TAU * loop.u;
    };

    ctx.save();
    ctx.translate(w0 / 2 + px, h0 / 2 + py);
    ctx.scale(zoom, zoom);
    ctx.translate(-w0 / 2, -h0 / 2);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < n; col++) {
        const raw = cellRaw(col, row);
        if (raw[R_SKIP] > density) continue;

        const count = mode === 'complex' ? 1 + Math.floor(raw[R_COUNT] * stackN * 0.999) : 1;
        // Largest first, so stacked items nest visibly.
        for (let j = 0; j < count; j++) {
          const b = CELL_F + j * ITEM_F;
          const kind = enabled[Math.floor(raw[b + I_SHAPE] * enabled.length) % enabled.length];
          const c = palette(
            colorMode,
            { hue, hueSpread, sat, light, customColors },
            raw[b + I_COLOR]
          );
          const fill = hsl({ ...c, l: c.l + (raw[b + I_LIGHT] - 0.5) * 14 });
          const edge =
            stroke > 0
              ? strokeMatch
                ? `hsla(${c.h.toFixed(0)}, ${c.s.toFixed(0)}%, ${(c.l * 0.3).toFixed(0)}%, 0.85)`
                : outlineColor
              : null;

          // Nested items step down in size; vary jitters each rung.
          const rung = (count - j) / count;
          const sizeMul = Math.max(0.05, size * rung * (1 + (raw[b + I_SIZE] - 0.5) * vary));
          const orient =
            kind === 'arc' || kind === 'line' || kind === 'triangle'
              ? Math.floor(raw[b + I_ORIENT] * 4) * QUARTER
              : 0;
          let rot = orient + (raw[b + I_ROT] - 0.5) * 2 * rotMax;
          let scl = 1;
          let dy = 0;
          let alpha = 1;

          if (live) {
            // Shared tweens, phased per item: a diagonal grid ripple blended
            // toward each item's own random phase/rate by Desync. Items in one
            // cell carry different phases, so stacks animate out of step.
            const phase =
              (col + row) * 0.7 * (1 - desync) + raw[b + I_PHASE] * TAU * desync;
            const rate = 1 + (raw[b + I_RATE] - 0.5) * (0.2 + desync * 0.8);
            if (hasPulse) scl = 1 + 0.22 * Math.sin(mAng(pulseSpeed, rate * 1.7) + phase);
            if (hasSpin) rot += (raw[b + I_DIR] < 0.5 ? -1 : 1) * mAng(spinSpeed, rate * 1.2);
            if (hasWave) dy = Math.sin(mAng(waveSpeed, rate * 1.5) + phase) * cell * 0.18;
            if (hasFade) alpha = 0.55 + 0.45 * Math.sin(mAng(fadeSpeed, rate * 1.6) + phase);
          }

          ctx.save();
          ctx.translate((col + 0.5) * cell, (row + 0.5) * cell + dy);
          if (rot) ctx.rotate(rot);
          ctx.globalAlpha = Math.max(0.05, alpha);
          drawShape(ctx, kind, inner * sizeMul * scl, fill, edge);
          ctx.restore();
        }
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
      bg, seed, mode, cols, gap, density, stack, shapes, size, vary, rotate, round,
      stroke, strokeMatch, outlineColor,
      colorMode, hue, hueSpread, sat, light, customColors,
      motions, pulseSpeed, spinSpeed, waveSpeed, fadeSpeed, desync
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
  /** Anchor the loop; each tween clock snaps its own whole-cycle advance. */
  export function beginLoop(seconds: number) {
    loopT0 = time;
    loopSeconds = seconds;
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
