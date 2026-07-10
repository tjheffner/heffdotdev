<script lang="ts" context="module">
  export type KaleColorMode = 'spectrum' | 'duo' | 'mono' | 'custom';
  export type KaleMode = 'radial' | 'prism';
  export type KaleShape =
    | 'triangle'
    | 'circle'
    | 'star'
    | 'burst'
    | 'hexagon'
    | 'wave'
    | 'diamond'
    | 'shard';

  export const KALE_SHAPES: KaleShape[] = [
    'triangle',
    'circle',
    'star',
    'burst',
    'hexagon',
    'wave',
    'diamond',
    'shard'
  ];

  // One editable item inside the fundamental segment. Every visual property is
  // explicit; `seed` only fixes the sub-shape geometry (shard verts, warp jitter)
  // so editing size/color/etc never reshuffles the shape. `open` is UI-only.
  export type KaleItem = {
    shape: KaleShape;
    u: number; // 0..1 — angle across the wedge (radial) / x in the tile (prism)
    v: number; // 0..1 — radius from center (radial) / y in the tile (prism)
    size: number; // radius as a fraction of the segment size
    color: string; // #rrggbb
    rotate: number; // degrees, 0..360
    skew: number; // -1..1
    warp: number; // 0..1
    twist: number; // -1..1
    seed: number;
    open?: boolean;
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { makeRng } from '$lib/playground/rng';
  import { hexToHsl } from '$lib/playground/color';
  import CanvasStage, { type StageView } from './CanvasStage.svelte';

  // --- appearance ----------------------------------------------------------
  export let bg = '#0a0a12';
  export let transparent = false; // skip the backdrop fill for transparent PNGs
  export let stroke = 0; // outline weight, 0 = none
  export let outlineColor = '#000000';
  export let strokeMatch = true; // derive stroke from each item's own color

  // --- arrangement ---------------------------------------------------------
  // radial: mirror wedges fan around a center point.
  // prism:  a mirrored tile is tessellated across the whole canvas.
  export let mode: KaleMode = 'radial';
  export let segments = 8; // radial: wedges around the center; prism: tiles across
  export let items: KaleItem[] = [];
  export let spin = 0; // field motion: -1..1, sign = direction, magnitude = speed
  export let animate = 0; // segment-morph speed: 0 = still, 1 = fast (skew/warp/…)

  export let zoom = 1; // scales the scene about the canvas center (interactive camera)
  export let zoomMin = 0.25;
  export let zoomMax = 4;

  export let contained = true;
  export let interactive = false; // enable drag-to-pan and scroll-to-zoom
  export let onRendered: (() => void) | undefined = undefined; // fires after each paint

  // Prism tiles are much smaller than the radial disc, so the same size fraction
  // reads as sparse. Scale item size up in prism so tiles fill and the seams knit.
  const PRISM_FILL = 2.6;

  // Camera/canvas live in CanvasStage; these mirror the current view so the
  // draw helpers below can read them unchanged.
  let stage: CanvasStage;
  let ctx: CanvasRenderingContext2D | null = null;
  let mounted = false;
  let w = 0;
  let h = 0;
  let panX = 0;
  let panY = 0;

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  // --- shape geometry ------------------------------------------------------
  function baseShape(kind: KaleShape, rng: () => number): number[][] {
    const poly = (n: number, phase = 0) => {
      const v: number[][] = [];
      for (let i = 0; i < n; i++) {
        const a = phase + (i / n) * TAU;
        v.push([Math.cos(a), Math.sin(a)]);
      }
      return v;
    };
    const star = (spikes: number, inner: number) => {
      const v: number[][] = [];
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? 1 : inner;
        const a = -Math.PI / 2 + (i / (spikes * 2)) * TAU;
        v.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return v;
    };
    switch (kind) {
      case 'triangle':
        return poly(3, -Math.PI / 2);
      case 'circle':
        return poly(20);
      case 'hexagon':
        return poly(6);
      case 'diamond':
        return poly(4, 0);
      case 'star':
        return star(5, 0.44);
      case 'burst':
        return star(8, 0.32);
      case 'wave': {
        // A sine-edged strip, closed into a band so it flows through the fill
        // pipeline — reads as an undulating line.
        const seg = 16;
        const amp = 0.42;
        const th = 0.16;
        const v: number[][] = [];
        for (let i = 0; i <= seg; i++) {
          const x = -1 + (2 * i) / seg;
          v.push([x, Math.sin(x * Math.PI * 1.6) * amp - th]);
        }
        for (let i = seg; i >= 0; i--) {
          const x = -1 + (2 * i) / seg;
          v.push([x, Math.sin(x * Math.PI * 1.6) * amp + th]);
        }
        return v;
      }
      case 'shard': {
        const v: number[][] = [];
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + (rng() - 0.5) * 0.7;
          const r = 0.6 + rng() * 0.6;
          v.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        return v;
      }
    }
  }

  // Precompute the per-item geometry so the render loop (which repeats items
  // across many tiles/wedges) never rebuilds shapes. Recomputed only when the
  // `items` array is invalidated (any edit).
  type Prepared = {
    it: KaleItem;
    verts: number[][];
    warpR: number[];
    shxDir: number;
    shyDir: number;
    hsl: { h: number; s: number; l: number };
    freqMul: number;
  };

  function prep(it: KaleItem): Prepared {
    const rng = makeRng((it.seed >>> 0) || 1);
    const warpR = [rng(), rng(), rng(), rng(), rng(), rng()];
    const shxDir = rng() - 0.5;
    const shyDir = rng() - 0.5;
    const verts = baseShape(it.shape, rng);
    return {
      it,
      verts,
      warpR,
      shxDir,
      shyDir,
      hsl: hexToHsl(it.color),
      // Vary each item's morph tempo (not its phase) so they desync over time
      // while all still sitting at the base value when the clock is 0.
      freqMul: 0.7 + (((it.seed >>> 0) % 1000) / 1000) * 0.6
    };
  }

  $: prepared = (items || []).map(prep);

  // --- animation state -----------------------------------------------------
  let spinClock = 0;
  let morphClock = 0;
  let rafId = 0;
  let lastTs = 0;

  // --- seamless-loop capture ----------------------------------------------
  // For a seamless loop every time-varying sinusoid must complete a whole number
  // of cycles over the clip. We can't pick one duration that closes them all
  // (spin/drift/morph run at incommensurate rates, and morph's rate is per-item),
  // so instead each sinusoid's total advance is *snapped* to an integer number of
  // cycles: `phase(u) = base + round(advance·rate / 2π)·2π·u`. The round() makes
  // the loop exactly seamless no matter what the advances are; the advances only
  // decide how much motion the loop shows.
  let looping = false;
  let loopU = 0;
  let spinClock0 = 0;
  let morphClock0 = 0;
  let spinAdvance = 0;
  let morphAdvance = 0;
  const spinPhase = (rate: number) =>
    looping
      ? spinClock0 * rate + Math.round((spinAdvance * rate) / TAU) * TAU * loopU
      : spinClock * rate;
  const morphPhase = (rate: number) =>
    looping
      ? morphClock0 * rate + Math.round((morphAdvance * rate) / TAU) * TAU * loopU
      : morphClock * rate;

  // Per-item effective deform for this frame: the item's own value plus a sine
  // of the morph clock. Every sine is 0 at clock 0, so a still scene (clock
  // frozen at 0) is exactly the base values; once running, the clock advances
  // and the pattern breathes, holding in place whenever the speed returns to 0.
  function morphed(p: Prepared) {
    const it = p.it;
    if (!looping && morphClock === 0)
      return { rot: it.rotate, skew: it.skew, warp: it.warp, twist: it.twist };
    const f = p.freqMul;
    return {
      rot: it.rotate + Math.sin(morphPhase(0.8 * f)) * 45,
      skew: it.skew + Math.sin(morphPhase(0.53 * f)) * 0.3,
      warp: it.warp + Math.sin(morphPhase(0.4 * f)) * 0.25,
      twist: it.twist + Math.sin(morphPhase(0.3 * f)) * 0.4
    };
  }

  // --- drawing -------------------------------------------------------------
  function drawItem(p: Prepared, cx: number, cy: number, size: number, ang: number, eSkew: number, eWarp: number) {
    if (!ctx) return;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const shx = p.shxDir * eSkew * 0.9;
    const shy = p.shyDir * eSkew * 0.9;
    ctx.beginPath();
    const nv = p.verts.length;
    for (let vi = 0; vi < nv; vi++) {
      let vx = p.verts[vi][0] * size;
      let vy = p.verts[vi][1] * size;
      if (eWarp !== 0) {
        const kk = 1 + (p.warpR[vi % p.warpR.length] - 0.5) * eWarp * 1.6;
        vx *= kk;
        vy *= kk;
      }
      if (eSkew !== 0) {
        const rx = vx;
        const ry = vy;
        vx = rx + shx * ry;
        vy = ry + shy * rx;
      }
      const rx = vx;
      const ry = vy;
      vx = rx * cos - ry * sin;
      vy = rx * sin + ry * cos;
      vi === 0 ? ctx.moveTo(cx + vx, cy + vy) : ctx.lineTo(cx + vx, cy + vy);
    }
    ctx.closePath();
    ctx.fillStyle = p.it.color;
    ctx.fill();
    if (stroke > 0) {
      ctx.strokeStyle = strokeMatch
        ? `hsla(${p.hsl.h.toFixed(0)}, ${p.hsl.s.toFixed(0)}%, ${(p.hsl.l * 0.3).toFixed(0)}%, 0.85)`
        : outlineColor;
      ctx.stroke();
    }
  }

  function clipWedge(R: number, a: number) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R, 0);
    ctx.arc(0, 0, R, 0, a);
    ctx.closePath();
    ctx.clip();
  }

  function drawWedgeItems(R: number, a: number) {
    for (const p of prepared) {
      const it = p.it;
      const phi = it.u * a;
      const rFrac = 0.1 + it.v * 0.85;
      const r = rFrac * R;
      const cx = r * Math.cos(phi);
      const cy = r * Math.sin(phi);
      const size = it.size * R;
      const m = morphed(p);
      const ang = phi + m.rot * DEG + m.twist * TAU * rFrac;
      drawItem(p, cx, cy, size, ang, m.skew, m.warp);
    }
  }

  function drawTileItems(T: number) {
    for (const p of prepared) {
      const it = p.it;
      const cx = it.u * T;
      const cy = it.v * T;
      const size = it.size * T * PRISM_FILL;
      const spiral = Math.hypot(it.u - 0.5, it.v - 0.5);
      const m = morphed(p);
      const ang = m.rot * DEG + m.twist * TAU * spiral;
      drawItem(p, cx, cy, size, ang, m.skew, m.warp);
    }
  }

  function renderRadial() {
    if (!ctx) return;
    const cx = w / 2 + panX;
    const cy = h / 2 + panY;
    const R = Math.min(w, h) * 0.46 * zoom;
    const slices = Math.max(2, Math.round(segments));
    const a = TAU / slices;
    // Clock is frozen at 0 while still, so this is 0 for a static scene and
    // simply holds its angle whenever spin returns to 0 — no snap at the seam.
    const fieldRot = spinPhase(0.7);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(fieldRot);
    for (let i = 0; i < slices; i++) {
      ctx.save();
      // Even slices rotate into place; odd slices are mirror images of their
      // neighbor (reflect across +x, then rotate up into the wedge) so adjacent
      // wedges meet seamlessly — the defining trick of a kaleidoscope.
      if (i % 2 === 0) {
        ctx.rotate(i * a);
      } else {
        ctx.rotate((i + 1) * a);
        ctx.scale(1, -1);
      }
      clipWedge(R, a);
      drawWedgeItems(R, a);
      ctx.restore();
    }
    ctx.restore();
  }

  function renderPrism() {
    if (!ctx) return;
    const slices = Math.max(2, Math.round(segments));
    const baseT = Math.min(w, h) / slices;
    let T = baseT * zoom;
    const budget = 2600;
    let cols = Math.ceil(w / T) + 3;
    let rows = Math.ceil(h / T) + 3;
    if (cols * rows > budget) {
      T *= Math.sqrt((cols * rows) / budget);
    }
    // Both sines are 0 at clock 0, so a still sheet is undrifted; different
    // frequencies make it wander in 2D. Holds in place when spin returns to 0.
    const driftX = Math.sin(spinPhase(0.2)) * Math.min(w, h) * 0.15;
    const driftY = Math.sin(spinPhase(0.17)) * Math.min(w, h) * 0.15;
    const originX = w / 2 + panX + driftX;
    const originY = h / 2 + panY + driftY;

    const gx0 = Math.floor((0 - originX) / T) - 1;
    const gx1 = Math.ceil((w - originX) / T) + 1;
    const gy0 = Math.floor((0 - originY) / T) - 1;
    const gy1 = Math.ceil((h - originY) / T) + 1;

    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const x0 = originX + gx * T;
        const y0 = originY + gy * T;
        // Mirror alternate tiles in each axis so content flows seamlessly across
        // every seam — a plane of mirror rosettes where four tiles meet.
        const fx = gx & 1 ? -1 : 1;
        const fy = gy & 1 ? -1 : 1;
        ctx.save();
        ctx.translate(x0, y0);
        ctx.translate(fx < 0 ? T : 0, fy < 0 ? T : 0);
        ctx.scale(fx, fy);
        // Overlap the clip by ~1px so anti-aliased tile edges don't leave a
        // hairline of backdrop between tiles. Neighboring tiles are exact mirror
        // images across each seam, so the overlap draws matching color — it reads
        // as a clean bleed, not a doubled edge.
        const bleed = 1;
        ctx.beginPath();
        ctx.rect(-bleed, -bleed, T + 2 * bleed, T + 2 * bleed);
        ctx.clip();
        drawTileItems(T);
        ctx.restore();
      }
    }
  }

  // Paint the scene into the stage's canvas. The stage clears + sets the dpr
  // transform first and passes the current camera; the render helpers below read
  // the mirrored w/h/panX/panY and the `zoom` prop (== view.zoom).
  function draw(context: CanvasRenderingContext2D, view: StageView) {
    ctx = context;
    w = view.w;
    h = view.h;
    panX = view.panX;
    panY = view.panY;
    if (!transparent) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke;
    if (mode === 'prism') renderPrism();
    else renderRadial();
  }

  // Repaint whenever anything scene-defining changes. `spin`/`animate` drive the
  // RAF loop, and `zoom` is repainted by the stage, so none appear here.
  $: if (
    mounted &&
    (void [prepared, mode, segments, bg, transparent, stroke, outlineColor, strokeMatch], true)
  ) {
    stage?.paint();
  }

  // --- animation loop ------------------------------------------------------
  const prefersReducedMotion = () =>
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tick(ts: number) {
    if (!mounted || (spin === 0 && animate <= 0)) {
      rafId = 0;
      return;
    }
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    spinClock += dt * spin * 1.3;
    // Morph ramps up faster than spin — a small boost plus a gentle curve so the
    // low end still reads while 1.0 feels genuinely lively.
    morphClock += dt * (animate * 1.6 + animate * animate * 2.2);
    stage?.paint();
    rafId = requestAnimationFrame(tick);
  }

  function syncAnimation(_a: number = animate, _s: number = spin) {
    if (capturing) return; // recording drives the clocks itself
    const active = (spin !== 0 || animate > 0) && !prefersReducedMotion();
    if (active && !rafId) {
      lastTs = 0;
      rafId = requestAnimationFrame(tick);
    } else if (!active && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      stage?.paint();
    }
  }
  $: if (mounted) syncAnimation(animate, spin);

  // Zero the motion clocks so the scene returns to its base (un-morphed,
  // un-rotated) state — used by the page's Reset.
  export function resetMotion() {
    spinClock = 0;
    morphClock = 0;
    stage?.paint();
  }

  // Camera + export helpers forward to the stage; luminance folds in the
  // effective backdrop this scene shows.
  export const recenter = () => stage?.recenter();
  export const snapshot = (bgFill: string, maxDim = 128) => stage?.snapshot(bgFill, maxDim) ?? null;
  export const saveImage = (filename = `kaleidoscope-${String(Date.now()).slice(-6)}.png`) =>
    stage?.saveImage(filename);
  export const sampleLuminance = (stripFrac = 0.16) =>
    stage?.sampleLuminance(transparent ? '#232329' : bg, stripFrac) ?? null;

  // --- video capture -------------------------------------------------------
  // draw() reads the shared motion clocks, so recording pauses the live loop and
  // steps the clocks by hand. `startCapture` snapshots the current clocks; each
  // `captureFrame(ctx, W, H, elapsed)` advances them at the live rate for a clip
  // that matches what's on screen, painting centered at W×H.
  let capturing = false;
  let capSpin0 = 0;
  let capMorph0 = 0;

  export function startCapture() {
    capturing = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    capSpin0 = spinClock;
    capMorph0 = morphClock;
  }
  export function endCapture() {
    capturing = false;
    spinClock = capSpin0;
    morphClock = capMorph0;
    syncAnimation();
    stage?.paint();
  }
  export function captureFrame(
    context: CanvasRenderingContext2D,
    W: number,
    H: number,
    elapsed: number
  ) {
    spinClock = capSpin0 + elapsed * spin * 1.3;
    morphClock = capMorph0 + elapsed * (animate * 1.6 + animate * animate * 2.2);
    context.fillStyle = bg; // opaque frame even when the scene is transparent
    context.fillRect(0, 0, W, H);
    draw(context, { w: W, h: H, dpr: 1, panX: 0, panY: 0, zoom });
  }

  // Seamless-loop variant: `u` runs 0→1 over the clip. The phase helpers snap
  // each sinusoid to whole cycles, so frame at u=1 equals frame at u=0.
  export function startLoopCapture(seconds: number) {
    capturing = true;
    looping = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    spinClock0 = spinClock;
    morphClock0 = morphClock;
    // Advances only decide how much motion the loop shows (round() guarantees the
    // seam). Give the field at least one full turn when spinning, and the morph at
    // least ~one cycle when animating, so short clips still read as moving.
    const spinTurns = spin === 0 ? 0 : Math.sign(spin) * Math.max(1, Math.round(Math.abs(spin) * seconds * 0.5));
    spinAdvance = spin === 0 ? 0 : (spinTurns * TAU) / 0.7; // fieldRot = spinTurns full turns
    const morphRate = animate * 1.6 + animate * animate * 2.2;
    morphAdvance = animate > 0 ? Math.max(morphRate * seconds, TAU / 0.8) : 0;
  }
  export function endLoopCapture() {
    capturing = false;
    looping = false;
    loopU = 0;
    syncAnimation();
    stage?.paint();
  }
  export function captureLoopFrame(context: CanvasRenderingContext2D, W: number, H: number, u: number) {
    loopU = u;
    context.fillStyle = bg;
    context.fillRect(0, 0, W, H);
    draw(context, { w: W, h: H, dpr: 1, panX: 0, panY: 0, zoom });
  }

  onMount(() => {
    mounted = true;
    syncAnimation();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
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
