<script lang="ts" context="module">
  export type TriColorMode = 'spectrum' | 'duo' | 'mono' | 'custom';
  export type TriShape = 'triangle' | 'square';
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { makeRng, hashSeed } from '$lib/playground/rng';
  import { hslString as hsl } from '$lib/playground/color';
  import { paletteColor as palette } from '$lib/playground/palette';
  import {
    snapshotCanvas,
    downloadCanvasPng,
    sampleLuminance as sampleCanvasLuminance,
    zoomAt
  } from '$lib/playground/canvas';

  // --- color ---------------------------------------------------------------
  export let bg = '#0a0a12';
  export let transparent = false; // skip the backdrop fill for transparent PNGs
  export let hue = 210;
  export let hueSpread = 140;
  export let sat = 72;
  export let light = 56;
  export let colorMode: TriColorMode = 'spectrum';
  export let customColors: string[] = ['#ff6b35', '#ffd23f', '#3bceac', '#0ead69', '#540d6e'];
  export let stroke = 0; // outline weight, 0 = none
  export let outlineColor = '#000000';
  export let strokeMatch = false; // derive stroke from each triangle's own color

  // --- arrangement ---------------------------------------------------------
  export let shape: TriShape = 'triangle';
  export let seed: string | number = 'shatter';
  export let grid = 7; // cells per axis (density)
  export let jitter = 0.55; // point displacement, 0..1
  export let explode = 0.25; // outward shard displacement from impact
  export let warp = 0; // per-triangle vertex stretch, 0..1
  export let rotate = 0; // per-triangle rotation, max degrees 0..360
  export let skew = 0; // per-triangle shear (perspective shift), 0..1
  export let fieldRotate = 0; // whole-sheet rotation about the center, 0..360 degrees
  export let fieldWarp = 0; // whole-sheet sine bow, -1..1
  export let taper = 0; // whole-sheet horizontal keystone, -1..1
  export let fieldSkewX = 0; // whole-sheet horizontal shear (x shifts with y), -1..1
  export let fieldSkewY = 0; // whole-sheet vertical shear (y shifts with x), -1..1
  export let zoom = 1; // scales the scene about the canvas center (interactive camera)
  export let zoomMin = 0.25;
  export let zoomMax = 4;

  export let contained = true;
  export let interactive = false; // enable drag-to-pan and scroll-to-zoom
  export let onRendered: (() => void) | undefined = undefined; // fires after each paint

  let host: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let ro: ResizeObserver | undefined;

  let mounted = false;
  let w = 0;
  let h = 0;
  let dpr = 1;

  // Pan offset (px), applied on top of the centered layout. Drag to move.
  let panX = 0;
  let panY = 0;
  let dragging = false;

  const TAU = Math.PI * 2;

  // `t` is a random value per shard, so the palette controls the *range* of
  // colors while each triangle lands somewhere random within it.
  const paletteColor = (t: number) =>
    palette(colorMode, { hue, hueSpread, sat, light, customColors }, t);

  // --- scene ---------------------------------------------------------------
  type Shard = { p: number[]; c: { h: number; s: number; l: number } };
  let shards: Shard[] = [];

  // Whole-field distortion applied to every grid vertex (edges included), so
  // the entire sheet bends/skews coherently and shards stay joined.
  function applyField(x: number, y: number): [number, number] {
    let px = x;
    let py = y;
    if (fieldWarp !== 0) {
      const amp = fieldWarp * 0.14;
      px += Math.sin(py * TAU * 1.5) * amp;
      py += Math.sin(px * TAU * 1.2 + 1.7) * amp;
    }
    if (taper !== 0) {
      px = 0.5 + (px - 0.5) * (1 + taper * (py - 0.5));
    }
    // Whole-sheet shear about the center: the two skew angles taper (a keystone)
    // doesn't cover. Skew X slants columns sideways with height; Skew Y slants
    // rows vertically with width. Together they tilt the sheet into a parallelogram.
    if (fieldSkewX !== 0 || fieldSkewY !== 0) {
      const cx = px - 0.5;
      const cy = py - 0.5;
      px = 0.5 + cx + fieldSkewX * cy;
      py = 0.5 + cy + fieldSkewY * cx;
    }
    // Whole-sheet spin about the center. The scene is drawn square, so a plain
    // rotation stays rigid (no aspect distortion).
    if (fieldRotate !== 0) {
      const a = fieldRotate * (Math.PI / 180);
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const cx = px - 0.5;
      const cy = py - 0.5;
      px = 0.5 + cx * ca - cy * sa;
      py = 0.5 + cx * sa + cy * ca;
    }
    return [px, py];
  }

  // Tessellate a square into two triangles per cell. Interior grid vertices
  // are jittered; the outer edge stays put so the silhouette is clean.
  function squareTris(rng: () => number, n: number): number[][][] {
    const pts: number[][] = [];
    for (let y = 0; y <= n; y++) {
      const row: number[] = [];
      for (let x = 0; x <= n; x++) {
        const edge = x === 0 || y === 0 || x === n || y === n;
        const jx = x / n + (edge ? 0 : (rng() - 0.5) * jitter / n);
        const jy = y / n + (edge ? 0 : (rng() - 0.5) * jitter / n);
        const [px, py] = applyField(jx, jy);
        row.push(px, py);
      }
      pts.push(row);
    }
    const tris: number[][][] = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const a = [pts[y][x * 2], pts[y][x * 2 + 1]];
        const b = [pts[y][(x + 1) * 2], pts[y][(x + 1) * 2 + 1]];
        const c = [pts[y + 1][x * 2], pts[y + 1][x * 2 + 1]];
        const d = [pts[y + 1][(x + 1) * 2], pts[y + 1][(x + 1) * 2 + 1]];
        if (rng() > 0.5) tris.push([a, b, c], [b, d, c]);
        else tris.push([a, b, d], [a, d, c]);
      }
    }
    return tris;
  }

  // Subdivide an equilateral-ish triangle (apex top, base bottom) into n^2
  // small triangles. Row j holds j+1 points spanning that row's width.
  function triangleTris(rng: () => number, n: number): number[][][] {
    const rows: number[][][] = [];
    for (let j = 0; j <= n; j++) {
      const yy = j / n;
      const xl = 0.5 * (1 - yy); // left edge at this height
      const xr = 0.5 + 0.5 * yy; // right edge at this height
      const row: number[][] = [];
      for (let i = 0; i <= j; i++) {
        let x = j === 0 ? 0.5 : xl + (xr - xl) * (i / j);
        let y = yy;
        const interior = j > 0 && j < n && i > 0 && i < j;
        if (interior) {
          x += (rng() - 0.5) * jitter / n;
          y += (rng() - 0.5) * jitter / n;
        }
        row.push(applyField(x, y));
      }
      rows.push(row);
    }
    const tris: number[][][] = [];
    for (let j = 0; j < n; j++) {
      for (let i = 0; i <= j; i++) {
        tris.push([rows[j][i], rows[j + 1][i], rows[j + 1][i + 1]]); // upward
      }
      for (let i = 0; i < j; i++) {
        tris.push([rows[j][i], rows[j][i + 1], rows[j + 1][i + 1]]); // downward
      }
    }
    return tris;
  }

  function buildShards() {
    const rng = makeRng(hashSeed(String(seed)));
    const n = Math.max(2, Math.round(grid));
    const raw = shape === 'square' ? squareTris(rng, n) : triangleTris(rng, n);
    // Explode radiates from the shape's centroid (a triangle's is lower).
    const originX = 0.5;
    const originY = shape === 'square' ? 0.5 : 2 / 3;

    const out: Shard[] = [];
    for (const tri of raw) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
      const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;

      // Explode: push each shard outward from the origin along its radial.
      let mx = 0;
      let my = 0;
      if (explode !== 0) {
        const dx = cx - originX;
        const dy = cy - originY;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const off = explode * dist;
        mx = (dx / dist) * off;
        my = (dy / dist) * off;
      }

      // Draw a fixed set of per-shard randoms up front — unconditionally — so
      // toggling rotate/skew/warp never shifts the RNG stream the colors are
      // drawn from. A zero slider just makes its transform a no-op; only
      // density (the shard count) changes which colors land where.
      const angR = rng();
      const shxR = rng();
      const shyR = rng();
      const warpR = [rng(), rng(), rng()];

      // Per-shard deformations about the triangle's own centroid, so each
      // triangle changes independently (like jitter, but shape not mesh).
      // Rotate: random spin. Skew: random shear. Warp: random vertex stretch.
      const ang = angR * rotate * (Math.PI / 180);
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      const shx = (shxR - 0.5) * skew * 0.8;
      const shy = (shyR - 0.5) * skew * 0.8;
      const gx = cx + mx; // shard centroid in final space
      const gy = cy + my;

      const p: number[] = [];
      for (let v = 0; v < 3; v++) {
        let vx = tri[v][0] + mx;
        let vy = tri[v][1] + my;
        // Warp: scale the spoke from centroid to vertex by a random factor.
        if (warp !== 0) {
          const k = 1 + (warpR[v] - 0.5) * warp * 1.6;
          vx = gx + (vx - gx) * k;
          vy = gy + (vy - gy) * k;
        }
        // Skew: shear the vertex about the centroid for a perspective slant.
        if (skew !== 0) {
          const rx = vx - gx;
          const ry = vy - gy;
          vx = gx + rx + shx * ry;
          vy = gy + ry + shy * rx;
        }
        // Rotate: spin the vertex around the centroid.
        if (ang !== 0) {
          const rx = vx - gx;
          const ry = vy - gy;
          vx = gx + rx * cos - ry * sin;
          vy = gy + rx * sin + ry * cos;
        }
        p.push(vx, vy);
      }

      const base = paletteColor(rng());
      out.push({ p, c: { ...base, l: base.l + (rng() - 0.5) * 14 } });
    }
    shards = out;
  }

  // --- drawing -------------------------------------------------------------
  function render() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!transparent) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke;

    const size = Math.min(w, h) * 0.9 * zoom;
    const ox = (w - size) / 2 + panX;
    const oy = (h - size) / 2 + panY;

    for (const sh of shards) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const x = ox + sh.p[i * 2] * size;
        const y = oy + sh.p[i * 2 + 1] * size;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = hsl(sh.c);
      ctx.fill();
      if (stroke > 0) {
        ctx.strokeStyle = strokeMatch
          ? `hsla(${sh.c.h.toFixed(0)}, ${sh.c.s.toFixed(0)}%, ${(sh.c.l * 0.3).toFixed(0)}%, 0.85)`
          : outlineColor;
        ctx.stroke();
      }
    }
    onRendered?.();
  }

  // --- luminance sampling --------------------------------------------------
  // Perceived brightness of the canvas's top strip, so overlaid chrome can flip
  // light/dark against whatever is under it. Transparent scenes composite over
  // the checker color the preview shows.
  export const sampleLuminance = (stripFrac = 0.16) =>
    sampleCanvasLuminance(canvas, transparent ? '#232329' : bg, stripFrac);

  function redraw() {
    buildShards();
    render();
  }

  // Rebuild + repaint whenever anything scene-defining changes. Deps are
  // referenced explicitly so Svelte re-runs this block; the call itself is
  // opaque to the compiler.
  $: if (
    mounted &&
    (void [shape, seed, grid, jitter, explode, warp, rotate, skew, fieldRotate, fieldWarp, taper, fieldSkewX, fieldSkewY, zoom, hue, hueSpread, sat, light, colorMode, customColors, bg, transparent, stroke, outlineColor, strokeMatch], true)
  ) {
    redraw();
  }

  function resize() {
    if (!canvas || !host) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = contained
      ? host.getBoundingClientRect()
      : { width: window.innerWidth, height: window.innerHeight };
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    render();
  }

  // --- drag-to-pan ---------------------------------------------------------
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  function onPointerDown(e: PointerEvent) {
    if (!interactive) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    host.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    panX = panStartX + (e.clientX - dragStartX);
    panY = panStartY + (e.clientY - dragStartY);
    render();
  }
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    host.releasePointerCapture?.(e.pointerId);
  }
  export function recenter() {
    panX = 0;
    panY = 0;
    render();
  }
  function onWheel(e: WheelEvent) {
    if (!interactive) return;
    e.preventDefault();
    const rect = host.getBoundingClientRect();
    const cam = zoomAt(
      { panX, panY, zoom },
      e.clientX - rect.left,
      e.clientY - rect.top,
      e.deltaY,
      w,
      h,
      zoomMin,
      zoomMax
    );
    panX = cam.panX;
    panY = cam.panY;
    zoom = cam.zoom;
    render();
  }

  // Downscaled JPEG for the saved-scenes library; PNG download for export.
  export const snapshot = (bgFill: string, maxDim = 128) => snapshotCanvas(canvas, bgFill, maxDim);
  export const saveImage = (
    filename = `shatter-${String(seed).replace(/[^a-z0-9-_]+/gi, '-') || 'scene'}.png`
  ) => downloadCanvasPng(canvas, filename);

  onMount(() => {
    ctx = canvas.getContext('2d');
    mounted = true;
    resize();
    buildShards();
    render();

    window.addEventListener('resize', resize);
    if (contained && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => resize());
      ro.observe(host);
    }

    return () => {
      window.removeEventListener('resize', resize);
      ro?.disconnect();
    };
  });
</script>

<div
  class="tri-field"
  class:contained
  class:interactive
  class:dragging
  bind:this={host}
  aria-hidden="true"
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointercancel={onPointerUp}
  on:dblclick={recenter}
  on:wheel={onWheel}
>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .tri-field {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .tri-field.contained {
    position: absolute;
  }
  .tri-field.interactive {
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
  }
  .tri-field.interactive.dragging {
    cursor: grabbing;
  }
  canvas {
    display: block;
  }
</style>
