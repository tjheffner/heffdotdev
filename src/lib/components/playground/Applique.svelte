<script lang="ts" context="module">
  // shape = each stroke closes into a cut-out; ground = each stroke is a
  // skyline, run flat out to the sides and filled down past the bottom edge.
  export type CutMode = 'shape' | 'ground';
  export type CutLayer = {
    path: number[][]; // freeform strokes, flat [x0,y0,…] pairs in pad space ([-1,1])
    mode: CutMode;
    size: number; // scale, fraction of the frame
    width: number; // extra horizontal stretch, so a ridge can span a wide view
    ox: number; // offset, px
    oy: number;
    color: string;
    open?: boolean; // page-only UI state, ignored here
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { hexRgb } from '$lib/playground/color';
  import CanvasStage, { type StageView } from './CanvasStage.svelte';

  export let bg = '#2b1b4a';
  export let layers: CutLayer[] = [];
  export let shadowAngle = 135; // direction the shadow falls, degrees (0 = right, 90 = down)
  export let shadowDist = 10; // px at zoom 1
  export let shadowSoft = 0; // blur px; 0 = hard paper edge
  export let shadowColor = '#12061f';
  export let shadowAlpha = 0.6;

  export let zoom = 1;
  export let zoomMin = 0.25;
  export let zoomMax = 4;
  export let contained = true;
  export let interactive = false;
  export let onRendered: (() => void) | undefined = undefined;

  let stage: CanvasStage;
  let mounted = false;

  // Few layers, ~72 points each: cheap enough to rebuild every paint, so there
  // is no cached geometry to invalidate.
  function draw(ctx: CanvasRenderingContext2D, view: StageView) {
    const { w, h, panX, panY, dpr } = view;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const R = Math.min(w, h) * 0.45 * zoom;
    const far = (w + h) * 4; // well past any edge, at any pan
    const a = (shadowAngle * Math.PI) / 180;
    const { r, g, b } = hexRgb(shadowColor);
    // Canvas shadows ignore the transform, so they're in device pixels.
    ctx.shadowColor = `rgba(${r},${g},${b},${shadowAlpha})`;
    ctx.shadowOffsetX = Math.cos(a) * shadowDist * zoom * dpr;
    ctx.shadowOffsetY = Math.sin(a) * shadowDist * zoom * dpr;
    ctx.shadowBlur = shadowSoft * zoom * dpr;

    for (const l of layers) {
      const cx = w / 2 + panX + l.ox * zoom;
      const cy = h / 2 + panY + l.oy * zoom;
      const sx = R * l.size * l.width;
      const sy = R * l.size;
      const p = new Path2D();
      for (const s of l.path) {
        const n = s.length / 2;
        if (n < 2) continue;
        const X = (i: number) => cx + s[i * 2] * sx;
        const Y = (i: number) => cy + s[i * 2 + 1] * sy;
        if (l.mode === 'ground') {
          // Run the ends out flat in the direction they were drawn, then
          // drop below the frame, whichever way the stroke was drawn.
          const dir = X(n - 1) >= X(0) ? 1 : -1;
          p.moveTo(X(0) - dir * far, Y(0));
          for (let i = 0; i < n; i++) p.lineTo(X(i), Y(i));
          p.lineTo(X(n - 1) + dir * far, Y(n - 1));
          p.lineTo(X(n - 1) + dir * far, cy + far);
          p.lineTo(X(0) - dir * far, cy + far);
        } else {
          p.moveTo(X(0), Y(0));
          for (let i = 1; i < n; i++) p.lineTo(X(i), Y(i));
        }
        p.closePath();
      }
      // One fill per layer, so overlapping strokes cast one merged shadow.
      ctx.fillStyle = l.color;
      ctx.fill(p);
    }
    ctx.shadowColor = 'transparent';
  }

  $: if (
    mounted &&
    (void [bg, layers, shadowAngle, shadowDist, shadowSoft, shadowColor, shadowAlpha], true)
  ) {
    stage?.paint();
  }

  export const recenter = () => stage?.recenter();
  export const snapshot = (bgFill: string, maxDim = 128) => stage?.snapshot(bgFill, maxDim) ?? null;
  export const saveImage = (filename = 'applique.png') => stage?.saveImage(filename);
  export const sampleLuminance = (stripFrac = 0.16) => stage?.sampleLuminance(bg, stripFrac) ?? null;

  onMount(() => {
    mounted = true;
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
