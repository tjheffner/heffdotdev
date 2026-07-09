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
  export let spin = 0; // field motion speed: 0 = still, 1 = fast (rotate / drift)
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

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

  // --- seeded rng (mulberry32) --------------------------------------------
  function makeRng(s: number) {
    let a = (s >>> 0) || 1;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return { h: 0, s: 0, l: 60 };
    const int = parseInt(m[1], 16);
    const r = (int >> 16) / 255;
    const g = ((int >> 8) & 255) / 255;
    const b = (int & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let hh = 0;
    let s = 0;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) hh = ((g - b) / d) % 6;
      else if (max === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
      hh *= 60;
      if (hh < 0) hh += 360;
    }
    return { h: hh, s: s * 100, l: l * 100 };
  }

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

  // Per-item effective deform for this frame: the item's own value plus a sine
  // of the morph clock. Every sine is 0 at clock 0, so a still scene (clock
  // frozen at 0) is exactly the base values; once running, the clock advances
  // and the pattern breathes, holding in place whenever the speed returns to 0.
  function morphed(p: Prepared) {
    const it = p.it;
    if (morphClock === 0) return { rot: it.rotate, skew: it.skew, warp: it.warp, twist: it.twist };
    const f = p.freqMul;
    return {
      rot: it.rotate + Math.sin(morphClock * 0.8 * f) * 45,
      skew: it.skew + Math.sin(morphClock * 0.53 * f) * 0.3,
      warp: it.warp + Math.sin(morphClock * 0.4 * f) * 0.25,
      twist: it.twist + Math.sin(morphClock * 0.3 * f) * 0.4
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
    const fieldRot = spinClock * 0.7;

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
    const driftX = Math.sin(spinClock * 0.2) * Math.min(w, h) * 0.15;
    const driftY = Math.sin(spinClock * 0.17) * Math.min(w, h) * 0.15;
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

    if (mode === 'prism') renderPrism();
    else renderRadial();

    onRendered?.();
  }

  // --- luminance sampling --------------------------------------------------
  let scratch: HTMLCanvasElement | undefined;
  let sctx: CanvasRenderingContext2D | null = null;

  function hexRgb(hex: string): { r: number; g: number; b: number } {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return { r: 20, g: 20, b: 26 };
    const int = parseInt(m[1], 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  export function sampleLuminance(stripFrac = 0.16): number | null {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
    if (!scratch) {
      scratch = document.createElement('canvas');
      scratch.width = 48;
      scratch.height = 8;
      sctx = scratch.getContext('2d', { willReadFrequently: true });
    }
    if (!sctx) return null;
    const bd = transparent ? { r: 0x23, g: 0x23, b: 0x29 } : hexRgb(bg);
    sctx.clearRect(0, 0, 48, 8);
    sctx.fillStyle = `rgb(${bd.r}, ${bd.g}, ${bd.b})`;
    sctx.fillRect(0, 0, 48, 8);
    const sh = Math.max(1, Math.round(canvas.height * stripFrac));
    sctx.drawImage(canvas, 0, 0, canvas.width, sh, 0, 0, 48, 8);
    let data: Uint8ClampedArray;
    try {
      data = sctx.getImageData(0, 0, 48, 8).data;
    } catch {
      return null;
    }
    let sum = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      n++;
    }
    return n ? sum / n / 255 : null;
  }

  // Rebuild + repaint whenever anything scene-defining changes. `spin`/`animate`
  // drive the RAF loop, not a static repaint, so they're absent here.
  $: if (
    mounted &&
    (void [prepared, mode, segments, zoom, bg, transparent, stroke, outlineColor, strokeMatch], true)
  ) {
    render();
  }

  // --- animation loop ------------------------------------------------------
  const prefersReducedMotion = () =>
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tick(ts: number) {
    if (!mounted || (spin <= 0 && animate <= 0)) {
      rafId = 0;
      return;
    }
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    spinClock += dt * spin * 1.3;
    // Morph ramps up faster than spin — a small boost plus a gentle curve so the
    // low end still reads while 1.0 feels genuinely lively.
    morphClock += dt * (animate * 1.6 + animate * animate * 2.2);
    render();
    rafId = requestAnimationFrame(tick);
  }

  function syncAnimation(_a: number = animate, _s: number = spin) {
    const active = (spin > 0 || animate > 0) && !prefersReducedMotion();
    if (active && !rafId) {
      lastTs = 0;
      rafId = requestAnimationFrame(tick);
    } else if (!active && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      render();
    }
  }
  $: if (mounted) syncAnimation(animate, spin);

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
  // Zero the motion clocks so the scene returns to its base (un-morphed,
  // un-rotated) state — used by the page's Reset.
  export function resetMotion() {
    spinClock = 0;
    morphClock = 0;
    render();
  }
  function onWheel(e: WheelEvent) {
    if (!interactive) return;
    e.preventDefault();
    const rect = host.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const relx = (mx - (w / 2 + panX)) / zoom;
    const rely = (my - (h / 2 + panY)) / zoom;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const nz = clamp(zoom * factor, zoomMin, zoomMax);
    panX = mx - w / 2 - relx * nz;
    panY = my - h / 2 - rely * nz;
    zoom = nz;
    render();
  }

  export function saveImage(
    filename = `kaleidoscope-${String(Date.now()).slice(-6)}.png`
  ) {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    mounted = true;
    resize();
    render();
    syncAnimation();

    window.addEventListener('resize', resize);
    if (contained && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => resize());
      ro.observe(host);
    }

    return () => {
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  });
</script>

<div
  class="kale-field"
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
  .kale-field {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .kale-field.contained {
    position: absolute;
  }
  .kale-field.interactive {
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
  }
  .kale-field.interactive.dragging {
    cursor: grabbing;
  }
  canvas {
    display: block;
  }
</style>
