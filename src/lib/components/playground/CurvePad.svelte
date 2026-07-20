<script lang="ts">
  // A small square canvas the user draws a pen curve on: click/touch and drag,
  // each drag adds one stroke to `path` (flat [x,y,…] pairs in the pad's
  // centered [-1,1] space). The page binds `path` and hands it to the renderer.
  import { onMount } from 'svelte';
  import { resampleStroke } from '$lib/playground/path';

  export let path: number[][] = [];
  export let color = '#1a1a1a';
  export let paper = '#f2ede3';
  export let label = 'Curve drawing pad';

  let host: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let ro: ResizeObserver | undefined;
  let mounted = false;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let drawing = false;
  let current: number[] = [];

  function resize() {
    if (!host || !canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = host.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    repaint();
  }

  const px = (nx: number) => ((nx + 1) / 2) * w;
  const py = (ny: number) => ((ny + 1) / 2) * h;

  function strokePolyline(pts: number[]) {
    if (!ctx || pts.length < 4) return;
    ctx.beginPath();
    ctx.moveTo(px(pts[0]), py(pts[1]));
    for (let i = 1; i * 2 < pts.length; i++) ctx.lineTo(px(pts[i * 2]), py(pts[i * 2 + 1]));
    ctx.stroke();
  }

  function repaint() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    // Faint center cross: repeats rotate/grow about this point.
    ctx.strokeStyle = 'rgba(127, 127, 127, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const s of path) strokePolyline(s);
    strokePolyline(current);
  }

  function point(e: PointerEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    return [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
  }

  function onDown(e: PointerEvent) {
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);
    drawing = true;
    const [x, y] = point(e);
    current = [x, y];
  }
  function onMove(e: PointerEvent) {
    if (!drawing) return;
    const [x, y] = point(e);
    const n = current.length;
    // Skip sub-jitter movements; resampleStroke smooths the rest on release.
    if (n >= 2 && Math.hypot(x - current[n - 2], y - current[n - 1]) < 0.015) return;
    current = [...current, x, y];
    repaint();
  }
  function onUp(e: PointerEvent) {
    if (!drawing) return;
    drawing = false;
    canvas.releasePointerCapture?.(e.pointerId);
    if (current.length >= 4) path = [...path, resampleStroke(current)];
    current = [];
    repaint();
  }

  $: if (mounted && (void [path, color, paper], true)) repaint();

  onMount(() => {
    ctx = canvas.getContext('2d');
    mounted = true;
    resize();
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => resize());
      ro.observe(host);
    }
    return () => ro?.disconnect();
  });
</script>

<!-- The pad is a pointer-driven drawing surface; role=application is the
     closest fit (there is no keyboard equivalent — the page offers Random
     curve / Undo / Clear buttons as alternatives). -->
<div
  class="pad"
  bind:this={host}
  role="application"
  aria-label={label}
  on:pointerdown={onDown}
  on:pointermove={onMove}
  on:pointerup={onUp}
  on:pointercancel={onUp}
>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .pad {
    width: 100%;
    aspect-ratio: 1 / 1;
    border: 1px solid var(--pg-line);
    border-radius: 6px;
    overflow: hidden;
  }
  canvas {
    display: block;
    cursor: crosshair;
    touch-action: none;
  }
</style>
