<script lang="ts" context="module">
  // The camera + canvas metrics handed to a scene's draw() each paint.
  export type StageView = {
    w: number;
    h: number;
    dpr: number;
    panX: number;
    panY: number;
    zoom: number;
  };
</script>

<script lang="ts">
  // Owns the <canvas>, its sizing (dpr + ResizeObserver), and the interactive
  // camera (drag-to-pan, scroll-to-zoom, double-click-recenter). A scene just
  // provides a `draw(ctx, view)` and calls `paint()` when its data changes; the
  // stage repaints on camera/size changes itself.
  import { onMount } from 'svelte';
  import {
    snapshotCanvas,
    downloadCanvasPng,
    sampleLuminance as sampleCanvasLuminance,
    zoomAt
  } from '$lib/playground/canvas';

  export let draw: (ctx: CanvasRenderingContext2D, view: StageView) => void;
  export let zoom = 1; // bindable — the camera scale, shared with a page slider
  export let zoomMin = 0.25;
  export let zoomMax = 4;
  export let contained = true;
  export let interactive = false;
  export let onRendered: (() => void) | undefined = undefined; // fires after each paint

  let host: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let ro: ResizeObserver | undefined;

  let mounted = false;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;

  export function paint() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, { w, h, dpr, panX, panY, zoom });
    onRendered?.();
  }

  export function recenter() {
    panX = 0;
    panY = 0;
    paint();
  }

  // Export helpers over the owned canvas so the scene/page can reach them.
  export const snapshot = (bgFill: string, maxDim = 128) => snapshotCanvas(canvas, bgFill, maxDim);
  export const saveImage = (filename: string) => downloadCanvasPng(canvas, filename);
  export const sampleLuminance = (backdropHex: string, stripFrac = 0.16) =>
    sampleCanvasLuminance(canvas, backdropHex, stripFrac);

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
    paint();
  }

  // Repaint when the zoom changes from outside (e.g. a page slider). Pan changes
  // happen only in the handlers below, which paint directly.
  $: if (mounted) {
    void zoom;
    paint();
  }

  // --- drag-to-pan / scroll-to-zoom ---------------------------------------
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
    paint();
  }
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    host.releasePointerCapture?.(e.pointerId);
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
    zoom = cam.zoom; // triggers the reactive repaint above
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    mounted = true;
    resize();

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
  class="stage"
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
  .stage {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .stage.contained {
    position: absolute;
  }
  .stage.interactive {
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
  }
  .stage.interactive.dragging {
    cursor: grabbing;
  }
  canvas {
    display: block;
  }
</style>
