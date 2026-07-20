<script lang="ts" context="module">
  export type PaperTexture = 'none' | 'grain' | 'weave';
  export type PenLayer = {
    path: number[][]; // freeform strokes, flat [x0,y0,…] pairs in pad space ([-1,1])
    reps: number; // repeated passes of the curve
    size: number; // base scale, fraction of the frame
    rot: number; // rotation per pass, degrees (about the drawing's own centroid)
    spin: number; // rotation of the entire swept layer, degrees (about the sweep's center)
    grow: number; // size change per pass, percent
    dx: number; // sweep per pass, px
    dy: number;
    ox: number; // layer offset, px
    oy: number;
    swell: number; // traveling-wave amplitude 0..1, displacing along stroke normals
    rip: number; // waves along the stroke
    trav: number; // wave phase advance per pass, degrees — rolls the swell through the sweep
    relax: number; // 0..1 — how far the curve settles toward its chord by the end of the sweep
    env: number; // 0..1 — bells the swell over the sweep (0 = constant, 1 = rises then dies)
    press: number; // pen pressure 0..1 → line width, ink density, and how fast the ink runs dry
    bleed: number; // 0..1 — how far ink soaks past the stroke; high values merge neighboring passes
    nib: number; // nib cut angle in degrees (0-180) — strokes run thin along it, thick across it
    jit: number; // pressure jitter 0..1 — width/ink variation between and along passes
    wob: number; // hand wobble, 0..1
    color: string;
    open?: boolean; // page-only UI state; ignored here
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { makeRng, hashSeed } from '$lib/playground/rng';
  import { hexToHsl, hslToHex } from '$lib/playground/color';
  import CanvasStage, { type StageView } from './CanvasStage.svelte';

  export let bg = '#f2ede3';
  export let inkBlend = true; // multiply compositing, so overlapping ink darkens
  export let texture: PaperTexture = 'grain';
  export let texAmount = 0.4; // texture strength 0..1
  export let seed: string | number = 'plotter';
  export let layers: PenLayer[] = [];

  export let zoom = 1; // scales the scene about the canvas center (interactive camera)
  export let zoomMin = 0.25;
  export let zoomMax = 4;
  export let contained = true;
  export let interactive = false; // enable drag-to-pan and scroll-to-zoom
  export let onRendered: (() => void) | undefined = undefined; // fires after each paint

  let stage: CanvasStage;
  let mounted = false;

  const TAU = Math.PI * 2;
  // Pen widths are authored in px-ish slider units but baked into pad-space
  // ribbon geometry, so the nib scales with the sheet (like a real plot).
  const PXU = 1 / 450;

  // One fill of one pass: a variable-width ink ribbon (closed polygon in pad
  // space) plus its ink state. draw() only maps and fills, so camera events
  // stay cheap. Ribbons — not stroked polylines — are what make the lines read
  // as ink: tapered ends, wandering width, dry-brush gaps, bleed halos.
  type InkStroke = {
    poly: Float32Array;
    ox: number;
    oy: number;
    alpha: number;
    mode: 'fill' | 'rim'; // rim = stroked dried edge (coffee-ring) on wet passes
  };
  // Ink accumulates per pen into a density buffer, so overlapping passes
  // saturate toward solid ink (a pooling wash) instead of multiply-blackening;
  // the buffer is tinted the pen color and composited onto the paper once.
  type LayerInk = { color: string; strokes: InkStroke[] };
  let built: LayerInk[] = [];

  // Centerline + per-point half-widths → closed ribbon polygon (left side
  // forward, right side back). Zero-width spans pinch the ribbon shut, which is
  // exactly what a skipping nib looks like.
  function ribbon(cxA: Float32Array, cyA: Float32Array, hw: Float32Array): Float32Array {
    const n = cxA.length;
    const poly = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(n - 1, i + 1);
      const tx = cxA[i1] - cxA[i0];
      const ty = cyA[i1] - cyA[i0];
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      poly[i * 2] = cxA[i] + nx * hw[i];
      poly[i * 2 + 1] = cyA[i] + ny * hw[i];
      const j = n * 4 - 2 - i * 2;
      poly[j] = cxA[i] - nx * hw[i];
      poly[j + 1] = cyA[i] - ny * hw[i];
    }
    return poly;
  }

  function buildStrokes() {
    const out: LayerInk[] = [];
    layers.forEach((l, li) => {
      if (!l.path?.length) return;
      const ink: LayerInk = { color: l.color, strokes: [] };
      out.push(ink);
      const reps = Math.max(1, Math.round(l.reps));
      // Slightly wider base than a round pen would need — the directional nib
      // averages the width back down.
      const width = 0.35 + l.press * 3.2;
      const baseAlpha = 0.2 + l.press * 0.75;
      // Lighter pressure runs dry sooner: the ink fades across the passes.
      const dry = (1 - l.press) * 0.7;
      const jit = Math.max(0, Math.min(1, l.jit ?? 0));
      const bleed = Math.max(0, Math.min(1, l.bleed ?? 0.35));
      const relax = Math.max(0, Math.min(1, l.relax ?? 0));
      const swellAmp = (l.swell ?? 0) * 0.22;
      const env = Math.max(0, Math.min(1, l.env ?? 0));
      // Spin turns the whole swept layer as one piece. Rotation is linear, so
      // it splits cleanly: pad-space points get spin added to their per-pass
      // rotation (same centroid pivot), while the per-pass px offsets rotate
      // about the sweep's midpoint.
      const spinRad = ((l.spin ?? 0) * Math.PI) / 180;
      const sc = Math.cos(spinRad);
      const ss = Math.sin(spinRad);
      const offMidX = l.ox + (l.dx * (reps - 1)) / 2;
      const offMidY = l.oy + (l.dy * (reps - 1)) / 2;
      const travRad = ((l.trav ?? 0) * Math.PI) / 180;

      // The drawing's own centroid is the pivot for rotate/grow, so passes
      // twist and scale in place as they sweep instead of orbiting the pad
      // center (which reads as spirograph, not plotter).
      let cx0 = 0;
      let cy0 = 0;
      let cn = 0;
      for (const sp of l.path) {
        for (let i = 0; i * 2 < sp.length; i++) {
          cx0 += sp[i * 2];
          cy0 += sp[i * 2 + 1];
          cn++;
        }
      }
      if (cn) {
        cx0 /= cn;
        cy0 /= cn;
      }

      // Per-stroke geometry that's constant across passes: the chord (what
      // Relax settles toward) and point normals (what Swell displaces along).
      const geo = l.path
        .filter((sp) => sp.length >= 4)
        .map((sp) => {
          const n = sp.length / 2;
          const nx = new Float32Array(n);
          const ny = new Float32Array(n);
          const ta = new Float32Array(n); // tangent angle, for the directional nib
          for (let i = 0; i < n; i++) {
            const i0 = Math.max(0, i - 1);
            const i1 = Math.min(n - 1, i + 1);
            const tx = sp[i1 * 2] - sp[i0 * 2];
            const ty = sp[i1 * 2 + 1] - sp[i0 * 2 + 1];
            const len = Math.hypot(tx, ty) || 1;
            nx[i] = -ty / len;
            ny[i] = tx / len;
            ta[i] = Math.atan2(ty, tx);
          }
          return { sp, n, nx, ny, ta, sx: sp[0], sy: sp[1], ex: sp[n * 2 - 2], ey: sp[n * 2 - 1] };
        });

      // The nib is not a circle: it has a cut angle, and width follows the
      // angle between stroke direction and nib — the calligraphic thick/thin
      // that a dragged point can't produce. Heavy pressure flattens more of
      // the nib onto the paper, so the footprint gets rounder.
      const nibAng = ((l.nib ?? 40) * Math.PI) / 180;
      const nibRound = 0.22 + Math.min(1, l.press) * 0.45;

      for (let r = 0; r < reps; r++) {
        // Wobble is a smooth low-frequency displacement (two sines with seeded
        // random phases per pass), so lines look hand-drawn, not noisy.
        const rng = makeRng(hashSeed(`${seed}:${li}:${r}`));
        const wf1 = 2 + rng() * 3;
        const wf2 = 5 + rng() * 6;
        const wp1 = rng() * TAU;
        const wp2 = rng() * TAU;
        const wp3 = rng() * TAU;
        const wp4 = rng() * TAU;
        const wAmp = l.wob * 0.03;

        const s = Math.max(0.005, l.size * (1 + (l.grow / 100) * r));
        const ang = (l.rot * r * Math.PI) / 180 + spinRad;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const u = reps > 1 ? r / (reps - 1) : 0; // progress through the sweep
        const settle = relax * u;
        // Envelope bells the swell over the sweep: 0 keeps it constant, 1
        // makes the undulation rise out of nothing and die away again.
        const effSwell = swellAmp * (1 - env + env * Math.sin(Math.PI * u));
        const alpha = Math.max(0.02, baseAlpha * (1 - dry * u));
        // Pressure jitter, part 1: each pass lands a little heavier or lighter.
        const passW = width * (1 + (rng() - 0.5) * jit * 0.7);
        const passA = Math.min(1, alpha * (1 + (rng() - 0.5) * jit * 0.6));
        // Width character along the pass: a smooth wander (jitter) plus
        // dry-brush skips that open up as the ink runs out.
        const vf1 = 3 + rng() * 5;
        const vp1 = rng() * TAU;
        const vf2 = 8 + rng() * 7;
        const vp2 = rng() * TAU;
        const gf1 = 6 + rng() * 10;
        const gp1 = rng() * TAU;
        const gf2 = 2 + rng() * 4;
        const gp2 = rng() * TAU;
        const dryness = Math.min(1, dry * u + (1 - l.press) * 0.35);

        for (const g of geo) {
          const { sp, n, nx, ny, ta } = g;
          const cxA = new Float32Array(n);
          const cyA = new Float32Array(n);
          const hw = new Float32Array(n);
          const dep = new Float32Array(n); // local ink deposition

          // Dwells: where a real pen pauses or bears down, ink pools. Heavier
          // pens dwell more; each dwell balloons the width profile and — via
          // deposition — blots extra ink and bleed at that spot. Some land at
          // touch-down/lift, the classic start/stop dots.
          const dwells: { t: number; amp: number; w: number }[] = [];
          if (rng() < l.press * 0.75) {
            const count = 1 + Math.floor(rng() * 2);
            for (let k = 0; k < count; k++) {
              const edge = rng() < 0.3;
              dwells.push({
                t: edge ? (rng() < 0.5 ? 0.02 : 0.98) : 0.08 + rng() * 0.84,
                amp: (0.7 + rng() * 1.5) * l.press,
                w: 0.012 + rng() * 0.03
              });
            }
          }

          for (let i = 0; i < n; i++) {
            const t = n > 1 ? i / (n - 1) : 0; // arc position (strokes are evenly resampled)
            let x = sp[i * 2];
            let y = sp[i * 2 + 1];
            if (settle) {
              // Relax: the curve settles toward its own chord as the sweep runs.
              x += (g.sx + (g.ex - g.sx) * t - x) * settle;
              y += (g.sy + (g.ey - g.sy) * t - y) * settle;
            }
            if (effSwell) {
              // Swell: a wave traveling along the stroke, rolling forward one
              // Travel step per pass, pinned at the endpoints.
              const d = effSwell * Math.sin(Math.PI * t) * Math.sin(l.rip * t * TAU + travRad * r);
              x += nx[i] * d;
              y += ny[i] * d;
            }
            if (wAmp) {
              const uu = t * TAU;
              x += (Math.sin(wf1 * uu + wp1) + 0.6 * Math.sin(wf2 * uu + wp2)) * wAmp;
              y += (Math.sin(wf1 * uu + wp3) + 0.6 * Math.sin(wf2 * uu + wp4)) * wAmp;
            }
            // Rotate/grow about the drawing's centroid, in place.
            const px = (x - cx0) * s;
            const py = (y - cy0) * s;
            cxA[i] = cx0 + px * ca - py * sa;
            cyA[i] = cy0 + px * sa + py * ca;

            // Nib contact: taper at the ends (pen lift), the directional nib's
            // thick/thin against stroke direction, pressure wander, dry skips,
            // and dwell pooling. `dep` carries the same contact into how much
            // ink the chunked body fills actually deposit.
            const endT = Math.min(1, t / 0.08, (1 - t) / 0.08);
            const dir = nibRound + (1 - nibRound) * Math.abs(Math.sin(ta[i] + ang - nibAng));
            let wm =
              1 + jit * (0.35 * Math.sin(vf1 * t * TAU + vp1) + 0.2 * Math.sin(vf2 * t * TAU + vp2));
            if (dryness > 0.15) {
              const patch = Math.max(0, Math.sin(gf1 * t * TAU + gp1) * Math.sin(gf2 * t * TAU + gp2));
              wm *= 1 - Math.min(1, dryness * 1.15) * patch * patch;
            }
            for (const d of dwells) {
              const dt = (t - d.t) / d.w;
              wm += d.amp * Math.exp(-dt * dt);
            }
            const m = Math.max(0, wm) * dir;
            dep[i] = m;
            hw[i] = Math.max(0, 0.5 * passW * PXU * Math.pow(endT, 0.6) * m);
          }

          const dox = l.ox + l.dx * r - offMidX;
          const doy = l.oy + l.dy * r - offMidY;
          const ox = offMidX + dox * sc - doy * ss;
          const oy = offMidY + dox * ss + doy * sc;
          // How much ink this pass lays down overall — bleed follows it, so
          // heavy wet passes soak and light dry ones barely do.
          let depSum = 0;
          for (let i = 0; i < n; i++) depSum += dep[i];
          const depAvg = depSum / n;

          // Bleed: two feathered halo rings (a soft soak, not a hard outline).
          // The relative width term scales with the nib, the absolute term
          // spreads even thin lines so adjacent passes pool into one wash;
          // width follows hw, so dwells and heavy nib contact bleed locally.
          const halo = new Float32Array(n);
          const halo2 = new Float32Array(n);
          for (let i = 0; i < n; i++) {
            halo[i] = hw[i] === 0 ? 0 : hw[i] * (1.3 + bleed * 2.2) + bleed * 0.0035;
            halo2[i] = halo[i] * 1.5;
          }
          const haloA = Math.min(
            1,
            passA * (0.05 + bleed * 0.38) * Math.pow(Math.max(0.15, depAvg), 1.2)
          );
          ink.strokes.push({ poly: ribbon(cxA, cyA, halo2), ox, oy, alpha: haloA * 0.35, mode: 'fill' });
          ink.strokes.push({ poly: ribbon(cxA, cyA, halo), ox, oy, alpha: haloA * 0.55, mode: 'fill' });

          // Body in short chunks whose density follows the local nib contact —
          // pressure, jitter, nib direction and dwells all change how much ink
          // lands, not just how wide the line is.
          const CH = 10;
          for (let c0 = 0; c0 < n - 1; c0 += CH) {
            const c1 = Math.min(n - 1, c0 + CH);
            let dSum = 0;
            for (let i = c0; i <= c1; i++) dSum += dep[i];
            const dm = Math.pow(Math.min(1.8, Math.max(0.12, dSum / (c1 - c0 + 1))), 1.3);
            ink.strokes.push({
              poly: ribbon(cxA.slice(c0, c1 + 1), cyA.slice(c0, c1 + 1), hw.slice(c0, c1 + 1)),
              ox,
              oy,
              alpha: Math.min(1, passA * dm),
              mode: 'fill'
            });
          }
          // Wet passes dry with a denser edge; skipping dry passes don't.
          if (dryness <= 0.15) {
            ink.strokes.push({
              poly: ribbon(cxA, cyA, hw),
              ox,
              oy,
              alpha: Math.min(1, passA * 1.5),
              mode: 'rim'
            });
          }
        }
      }
    });
    built = out.filter((l) => l.strokes.length);
  }

  // --- paper texture -------------------------------------------------------
  // Deterministic (seeded) marks pre-rendered to an offscreen canvas and cached
  // by everything that shapes them, so camera repaints just blit it. The paper
  // itself doesn't pan/zoom — only the drawing does.
  let texCanvas: HTMLCanvasElement | null = null;
  let texKey = '';

  function textureFor(w: number, h: number, dpr: number): HTMLCanvasElement | null {
    if (texture === 'none' || texAmount <= 0) return null;
    const key = [texture, texAmount, bg, seed, w, h, dpr].join(':');
    if (texCanvas && texKey === key) return texCanvas;
    const wd = Math.max(1, Math.round(w * dpr));
    const hd = Math.max(1, Math.round(h * dpr));
    const c = document.createElement('canvas');
    c.width = wd;
    c.height = hd;
    const cx = c.getContext('2d');
    if (!cx) return null;
    const rng = makeRng(hashSeed(`${seed}:paper:${texture}`));
    const base = hexToHsl(bg);
    // Floors keep the pair visibly apart from the paper even at the extremes
    // (near-black or near-white sheets).
    const dark = hslToHex(base.h, Math.min(100, base.s), Math.max(0, base.l - 22));
    const light = hslToHex(base.h, Math.min(100, base.s), Math.min(100, Math.max(base.l + 16, 28)));
    const a = texAmount;

    // The texture composites against the paper itself: the offscreen canvas is
    // filled with the sheet color, dark marks multiply and light marks screen —
    // so the grain reads on ANY background color, not just near-neutral ones.
    cx.fillStyle = bg;
    cx.fillRect(0, 0, wd, hd);
    const inkMode = (isDark: boolean) => {
      cx.globalCompositeOperation = isDark ? 'multiply' : 'screen';
      return isDark ? dark : light;
    };

    // Large soft tonal blotches under every texture, so the sheet reads as
    // pulp with body rather than flat color.
    const blobs = Math.round((wd * hd) / 90000) + 6;
    for (let i = 0; i < blobs; i++) {
      const x = rng() * wd;
      const y = rng() * hd;
      const rr = (60 + rng() * 160) * dpr;
      const col = inkMode(rng() < 0.5);
      const grad = cx.createRadialGradient(x, y, 0, x, y, rr);
      grad.addColorStop(0, col);
      grad.addColorStop(1, `${col}00`);
      cx.globalAlpha = a * (0.08 + rng() * 0.1);
      cx.fillStyle = grad;
      cx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }

    if (texture === 'grain') {
      const count = Math.round(wd * hd * 0.02);
      for (let i = 0; i < count; i++) {
        cx.fillStyle = inkMode(rng() < 0.5);
        cx.globalAlpha = a * (0.15 + rng() * 0.3);
        cx.fillRect(rng() * wd, rng() * hd, dpr * (1 + rng()), dpr * (1 + rng()));
      }
    } else if (texture === 'weave') {
      const gap = 4 * dpr;
      cx.lineWidth = dpr;
      for (let y = gap / 2; y < hd; y += gap) {
        cx.strokeStyle = inkMode(true);
        cx.globalAlpha = a * (0.12 + rng() * 0.12);
        cx.beginPath();
        cx.moveTo(0, y + (rng() - 0.5) * dpr);
        cx.lineTo(wd, y + (rng() - 0.5) * dpr);
        cx.stroke();
      }
      for (let x = gap / 2; x < wd; x += gap) {
        cx.strokeStyle = inkMode(rng() < 0.5);
        cx.globalAlpha = a * (0.1 + rng() * 0.12);
        cx.beginPath();
        cx.moveTo(x + (rng() - 0.5) * dpr, 0);
        cx.lineTo(x + (rng() - 0.5) * dpr, hd);
        cx.stroke();
      }
    }
    cx.globalAlpha = 1;
    cx.globalCompositeOperation = 'source-over';
    texCanvas = c;
    texKey = key;
    return c;
  }

  // Per-pen density buffers, reused across paints.
  let inkBuffers: HTMLCanvasElement[] = [];
  function bufferFor(i: number, wd: number, hd: number): CanvasRenderingContext2D | null {
    let c = inkBuffers[i];
    if (!c) {
      c = document.createElement('canvas');
      inkBuffers[i] = c;
    }
    if (c.width !== wd || c.height !== hd) {
      c.width = wd;
      c.height = hd;
    }
    return c.getContext('2d');
  }

  const paperLum = () => {
    const m = /^#?([0-9a-f]{6})$/i.exec(bg);
    if (!m) return 1;
    const v = parseInt(m[1], 16);
    return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
  };

  // Renders the precomputed ribbons; runs on every camera event too. Each pen
  // accumulates as black density in its own buffer (overlaps saturate — ink
  // pooling, never multiply-blackening within one pen), wet bodies get a
  // denser rim (only a pool's outer edge survives saturation, like dried ink),
  // then the buffer is tinted and laid on the paper: multiply on light paper
  // (ink deepens), screen on dark paper (bright ink glows — multiply would
  // crush any pen color into black there).
  function draw(ctx: CanvasRenderingContext2D, view: StageView) {
    const { w, h, panX, panY, dpr } = view;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const tex = textureFor(w, h, dpr);
    if (tex) ctx.drawImage(tex, 0, 0, w, h);

    const R = Math.min(w, h) * 0.45 * zoom;
    const cx = w / 2 + panX;
    const cy = h / 2 + panY;
    const darkPaper = paperLum() < 0.5;
    const wd = Math.max(1, Math.round(w * dpr));
    const hd = Math.max(1, Math.round(h * dpr));

    built.forEach((layer, li) => {
      const b = bufferFor(li, wd, hd);
      if (!b) return;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.clearRect(0, 0, w, h);
      b.fillStyle = '#000';
      b.strokeStyle = '#000';
      b.lineJoin = 'round';
      b.lineWidth = 0.7;
      for (const st of layer.strokes) {
        const ox = cx + st.ox * zoom;
        const oy = cy + st.oy * zoom;
        const p = st.poly;
        b.beginPath();
        b.moveTo(ox + p[0] * R, oy + p[1] * R);
        for (let i = 1; i * 2 < p.length; i++) {
          b.lineTo(ox + p[i * 2] * R, oy + p[i * 2 + 1] * R);
        }
        b.closePath();
        b.globalAlpha = st.alpha;
        if (st.mode === 'rim') b.stroke();
        else b.fill();
      }
      // Tint the accumulated density with the pen color, then ink the paper.
      b.globalAlpha = 1;
      b.globalCompositeOperation = 'source-in';
      b.fillStyle = layer.color;
      b.fillRect(0, 0, w, h);
      b.globalCompositeOperation = 'source-over';
      ctx.globalCompositeOperation = inkBlend ? (darkPaper ? 'screen' : 'multiply') : 'source-over';
      ctx.drawImage(inkBuffers[li], 0, 0, w, h);
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function redraw() {
    buildStrokes();
    stage?.paint();
  }

  // Rebuild + repaint whenever anything scene-defining changes. `zoom` is left
  // out — the stage repaints on zoom without needing to rebuild the strokes.
  $: if (mounted && (void [layers, seed, bg, inkBlend, texture, texAmount], true)) {
    redraw();
  }

  // Camera + export helpers forward to the stage.
  export const recenter = () => stage?.recenter();
  export const snapshot = (bgFill: string, maxDim = 128) => stage?.snapshot(bgFill, maxDim) ?? null;
  export const saveImage = (filename = 'plotter.png') => stage?.saveImage(filename);
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
