<script lang="ts" context="module">
  export type PlotMode = 'turtle' | 'hatch' | 'flow';
  export type PlotSpawn = 'edge' | 'corner' | 'center' | 'scatter';
  export type PlotHop = 'near' | 'scatter';
  export type PlotHatchStyle = 'lines' | 'halves' | 'quarters';
  export type PlotGrid = 'none' | 'dots' | 'lines';
  export type PlotMotion = 'finished' | 'plot';

  // One rule = one pen program. Every rule carries the full field set (the
  // inactive mode's fields ride along inert) so the token rows stay
  // fixed-width and switching modes never loses tuning.
  export type PlotRule = {
    mode: PlotMode;
    // pen
    color: string;
    width: number; // stroke px
    ink: number; // 0..1 — semi-transparent ink pools where paths cross
    wob: number; // 0..1 servo wobble, baked into the path
    // turtle — a space-filling walker: pens prefer unvisited nodes and hop to
    // open ground when boxed in, so Fill 1 inks the whole grid
    angle45: boolean; // eight headings instead of four
    pens: number;
    spawn: PlotSpawn;
    straight: number; // 0..1 chance to hold the heading each step
    bias: number; // -1 all left turns .. 1 all right turns
    turnEvery: number; // force a turn every N steps, 0 = off
    fill: number; // 0..1 fraction of grid nodes this rule inks
    hop: PlotHop; // where the pen re-drops when boxed in
    // hatch — sheet-wide ruled lines, or per-cell triangle fills built from
    // many short strokes
    hatchStyle: PlotHatchStyle;
    hatchAngle: number; // deg
    spacing: number; // line gap, in cells (cell styles: fraction of the cell)
    cross: boolean; // second pass at +90°
    warp: number; // 0..1 displacement off the ruled line (lines style)
    warpDetail: number; // 0..1 how fine the warp noise is
    dash: number; // 0..1 — lines: pen-up runs; cells: fraction skipped
    // flow — streams seeded per grid cell, so density 1 starts one everywhere
    density: number; // 0..1 fraction of cells that seed a stream
    breadth: number; // 0..1 widens each stream into parallel passes
    press: number; // 0..1 area pressure: width swells + ink bleeds by region
    jit: number; // 0..1 fine width jitter per point and per pass
    flowDetail: number; // 0..1 how fine the direction field is
    swirl: number; // 0..1 how far cells stray from the base heading
    flowAngle: number; // deg, the field's base heading
    flowSteps: number;
    open: boolean; // UI accordion state, not rendered
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { makeRng, hashSeed } from '$lib/playground/rng';
  import { hexRgb } from '$lib/playground/color';
  import { clamp } from '$lib/playground/math';
  import CanvasStage, { type StageView } from './CanvasStage.svelte';

  export let bg = '#f3eedf';
  export let seed: string | number = 'plotter';
  export let cols = 26; // lattice columns; rows follow the viewport
  export let grid: PlotGrid = 'none';
  export let gridAmount = 0.35;
  export let rules: PlotRule[] = [];
  export let motion: PlotMotion = 'plot';
  export let speed = 1; // 0.25..4 ×-multiplier over the 40s baseline run

  export let zoom = 1;
  export let zoomMin = 0.25;
  export let zoomMax = 4;
  export let contained = true;
  export let interactive = false;
  export let onRendered: (() => void) | undefined = undefined;

  let stage: CanvasStage;
  let mounted = false;

  const TAU = Math.PI * 2;
  // Eight headings, index * 45°, clockwise from +x.
  const DIRS = [
    [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  // Keep pathological settings from freezing the tab — the sim stops adding
  // points past this, which simply truncates the plot.
  const POINT_BUDGET = 150_000;

  // --- deterministic value noise --------------------------------------------
  // Smooth 2D value noise from an integer-lattice hash; drives hatch warp/dash
  // and the flow field, so everything reproduces from the seed alone.
  function latticeHash(seedN: number, x: number, y: number): number {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) ^ seedN;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function noise2(seedN: number, x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf);
    const sy = yf * yf * (3 - 2 * yf);
    const a = latticeHash(seedN, xi, yi);
    const b = latticeHash(seedN, xi + 1, yi);
    const c = latticeHash(seedN, xi, yi + 1);
    const d = latticeHash(seedN, xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }

  // --- path building ---------------------------------------------------------
  // All rules compile to polylines up front; rendering (and the plot replay)
  // is a pure reveal over them. `start` is each path's offset into the global
  // drawn length, so the reveal runs rule by rule, pen by pen — like a real
  // single-carriage machine swapping pens.
  // wm/hm are per-point width and bleed-halo multipliers (flow pressure/jitter);
  // paths that carry them render as short chunked strokes instead of one pass.
  type BuiltPath = {
    pts: number[];
    start: number;
    total: number;
    rule: number;
    wm?: Float32Array;
    hm?: Float32Array;
  };
  type Built = {
    key: string;
    paths: BuiltPath[];
    total: number;
    cell: number;
    rowsN: number;
  };
  let built: Built | null = null;

  const ruleSeed = (ri: number, tag: string) => hashSeed(`${seed}:rule:${ri}:${tag}`);

  function simKey(w0: number, h0: number): string {
    return JSON.stringify([
      seed, cols, Math.round(w0), Math.round(h0),
      rules.map((r) => [
        r.mode, r.wob,
        r.angle45, r.pens, r.spawn, r.straight, r.bias, r.turnEvery, r.fill, r.hop,
        r.hatchStyle, r.hatchAngle, r.spacing, r.cross, r.warp, r.warpDetail, r.dash,
        r.density, r.breadth, r.press, r.jit, r.flowDetail, r.swirl, r.flowAngle, r.flowSteps,
        r.width
      ])
    ]);
  }

  function buildTurtle(
    r: PlotRule, ri: number, cell: number, colsN: number, rowsN: number,
    out: number[][], budget: { left: number }
  ) {
    // A space-filling walker: each step prefers an unvisited node (so the rule
    // can ink the whole grid), with Straight/Bias/Turn-every deciding which
    // free neighbor it reaches for first — that's what shapes the texture,
    // from 10-PRINT runs to tight zigzag mazes. Boxed in, the pen lifts and
    // hops to open ground.
    const rng = makeRng(ruleSeed(ri, 'walk'));
    const unit = r.angle45 ? 1 : 2;
    const leftP = 0.5 - clamp(r.bias, -1, 1) * 0.5;
    const nodeKey = (x: number, y: number) => y * (colsN + 1) + x;
    const inBounds = (x: number, y: number) => x >= 0 && x <= colsN && y >= 0 && y <= rowsN;
    const randomDir = () => (r.angle45 ? Math.floor(rng() * 8) : Math.floor(rng() * 4) * 2);

    const open = new Set<number>();
    for (let y = 0; y <= rowsN; y++) for (let x = 0; x <= colsN; x++) open.add(nodeKey(x, y));
    const nodeCount = open.size;
    const target = Math.round(nodeCount * clamp(r.fill, 0, 1));
    let inked = 0;

    const takeNode = (x: number, y: number) => {
      const k = nodeKey(x, y);
      if (open.has(k)) {
        open.delete(k);
        inked++;
      }
    };
    // Re-drop when boxed in: Near grows the region organically from where the
    // pen stopped; Scatter starts a fresh patch anywhere open.
    const hopTo = (x: number, y: number): [number, number] | null => {
      if (!open.size) return null;
      if (r.hop === 'scatter') {
        const skip = Math.floor(rng() * open.size);
        let i = 0;
        for (const k of open) {
          if (i++ === skip) return [k % (colsN + 1), Math.floor(k / (colsN + 1))];
        }
      }
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (const k of open) {
        const kx = k % (colsN + 1);
        const ky = Math.floor(k / (colsN + 1));
        const d = Math.abs(kx - x) + Math.abs(ky - y);
        if (d < bestD) {
          bestD = d;
          best = [kx, ky];
        }
      }
      return best;
    };

    const pens = Math.max(1, Math.round(r.pens));
    const share = Math.ceil(target / pens);

    for (let p = 0; p < pens && inked < target && budget.left > 0; p++) {
      let x = 0;
      let y = 0;
      let dir = 0;
      switch (r.spawn) {
        case 'edge': {
          const side = Math.floor(rng() * 4);
          if (side === 0) { x = Math.floor(rng() * (colsN + 1)); y = 0; dir = 2; }
          else if (side === 1) { x = colsN; y = Math.floor(rng() * (rowsN + 1)); dir = 4; }
          else if (side === 2) { x = Math.floor(rng() * (colsN + 1)); y = rowsN; dir = 6; }
          else { x = 0; y = Math.floor(rng() * (rowsN + 1)); dir = 0; }
          break;
        }
        case 'corner': {
          x = rng() < 0.5 ? 0 : colsN;
          y = rng() < 0.5 ? 0 : rowsN;
          if (r.angle45) dir = x === 0 ? (y === 0 ? 1 : 7) : y === 0 ? 3 : 5;
          else {
            const horiz = rng() < 0.5;
            dir = horiz ? (x === 0 ? 0 : 4) : y === 0 ? 2 : 6;
          }
          break;
        }
        case 'center': {
          x = Math.max(0, Math.min(colsN, Math.round(colsN / 2) + Math.floor(rng() * 5) - 2));
          y = Math.max(0, Math.min(rowsN, Math.round(rowsN / 2) + Math.floor(rng() * 5) - 2));
          dir = randomDir();
          break;
        }
        default: {
          x = Math.floor(rng() * (colsN + 1));
          y = Math.floor(rng() * (rowsN + 1));
          dir = randomDir();
        }
      }
      if (!open.has(nodeKey(x, y))) {
        const hopped = hopTo(x, y);
        if (!hopped) break;
        [x, y] = hopped;
        dir = randomDir();
      }

      takeNode(x, y);
      let pts: number[] = [x * cell, y * cell];
      const flush = () => {
        if (pts.length >= 4) out.push(pts);
        pts = [];
      };
      let penInked = 1;

      for (let s = 1; penInked < share && inked < target && budget.left > 0; s++) {
        // The heading it *wants*: hold course, or turn on the roll/cadence —
        // Bias splits which way the turns break.
        let want = dir;
        if (r.turnEvery > 0 && s % Math.round(r.turnEvery) === 0)
          want = (dir + (rng() < leftP ? -unit : unit) + 8) % 8;
        else if (rng() > r.straight) want = (dir + (rng() < leftP ? -unit : unit) + 8) % 8;

        // First free node sweeping outward from the wanted heading.
        let moved = false;
        const sgn = rng() < leftP ? -1 : 1;
        for (let k = 0; k * unit <= 4 && !moved; k++) {
          for (const off of k === 0 ? [0] : [sgn * k * unit, -sgn * k * unit]) {
            const cd = (want + off + 16) % 8;
            const cx = x + DIRS[cd][0];
            const cy = y + DIRS[cd][1];
            if (inBounds(cx, cy) && open.has(nodeKey(cx, cy))) {
              dir = cd;
              x = cx;
              y = cy;
              moved = true;
              break;
            }
          }
        }

        if (!moved) {
          // Boxed in — lift the pen and re-drop.
          flush();
          const hopped = hopTo(x, y);
          if (!hopped) break;
          [x, y] = hopped;
          dir = randomDir();
          takeNode(x, y);
          pts = [x * cell, y * cell];
          penInked++;
          continue;
        }

        takeNode(x, y);
        pts.push(x * cell, y * cell);
        penInked++;
        budget.left--;
      }
      flush();
    }
  }

  // Fill a convex polygon with parallel strokes: intersect each ruled line
  // (offset along the normal) with the edges and keep the chord. Segments
  // alternate direction so the pen sweeps back and forth.
  function hatchPoly(
    verts: number[], angleDeg: number, gap: number,
    out: number[][], budget: { left: number }
  ) {
    const a = (angleDeg * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const vx = -uy;
    const vy = ux;
    let vmin = Infinity;
    let vmax = -Infinity;
    for (let i = 0; i < verts.length; i += 2) {
      const d = verts[i] * vx + verts[i + 1] * vy;
      vmin = Math.min(vmin, d);
      vmax = Math.max(vmax, d);
    }
    let flip = false;
    for (let off = vmin + gap / 2; off < vmax && budget.left > 0; off += gap) {
      let t0 = Infinity;
      let t1 = -Infinity;
      let hits = 0;
      for (let i = 0; i < verts.length; i += 2) {
        const j = (i + 2) % verts.length;
        const d1 = verts[i] * vx + verts[i + 1] * vy - off;
        const d2 = verts[j] * vx + verts[j + 1] * vy - off;
        if (d1 === d2 || d1 * d2 > 0) continue;
        const f = d1 / (d1 - d2);
        const x = verts[i] + (verts[j] - verts[i]) * f;
        const y = verts[i + 1] + (verts[j + 1] - verts[i + 1]) * f;
        const t = x * ux + y * uy;
        t0 = Math.min(t0, t);
        t1 = Math.max(t1, t);
        hits++;
      }
      if (hits < 2 || t1 - t0 < 0.5) continue;
      const p0x = ux * t0 + vx * off;
      const p0y = uy * t0 + vy * off;
      const p1x = ux * t1 + vx * off;
      const p1y = uy * t1 + vy * off;
      out.push(flip ? [p1x, p1y, p0x, p0y] : [p0x, p0y, p1x, p1y]);
      budget.left -= 2;
      flip = !flip;
    }
  }

  function buildHatch(
    r: PlotRule, ri: number, cell: number, w0: number, h0: number,
    out: number[][], budget: { left: number }
  ) {
    const warpSeed = ruleSeed(ri, 'warp');
    const dashSeed = ruleSeed(ri, 'dash');
    const warpDet = 0.06 + clamp(r.warpDetail, 0, 1) * 0.55;
    const passes = r.cross ? [r.hatchAngle, r.hatchAngle + 90] : [r.hatchAngle];

    if (r.hatchStyle !== 'lines') {
      // Per-cell triangle fills: each cell rolls a seeded half or quarter of
      // itself and shades it with short parallel strokes — Skip (dash) leaves
      // a share of cells empty. Cells run boustrophedon so the pen sweeps.
      const colsN = Math.max(1, Math.round(w0 / cell));
      const rowsN = Math.max(1, Math.ceil(h0 / cell));
      const orientSeed = ruleSeed(ri, 'orient');
      const gap = Math.max(1.5, r.spacing * cell * 0.15);
      for (let row = 0; row < rowsN; row++) {
        for (let i = 0; i < colsN; i++) {
          if (budget.left <= 0) return;
          const col = row % 2 ? colsN - 1 - i : i;
          if (latticeHash(dashSeed, col, row) < clamp(r.dash, 0, 0.95)) continue;
          const o = Math.floor(latticeHash(orientSeed, col, row) * 4);
          const x0 = col * cell;
          const y0 = row * cell;
          const x1 = x0 + cell;
          const y1 = y0 + cell;
          const mx = x0 + cell / 2;
          const my = y0 + cell / 2;
          const tri =
            r.hatchStyle === 'halves'
              ? [
                  [x0, y0, x1, y0, x1, y1],
                  [x0, y0, x1, y1, x0, y1],
                  [x0, y0, x1, y0, x0, y1],
                  [x1, y0, x1, y1, x0, y1]
                ][o]
              : [
                  [x0, y0, x1, y0, mx, my],
                  [x1, y0, x1, y1, mx, my],
                  [x1, y1, x0, y1, mx, my],
                  [x0, y1, x0, y0, mx, my]
                ][o];
          for (const ang of passes) hatchPoly(tri, ang, gap, out, budget);
        }
      }
      return;
    }

    for (let pi = 0; pi < passes.length; pi++) {
      const a = (passes[pi] * Math.PI) / 180;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const vx = -uy;
      const vy = ux;
      const cx = w0 / 2;
      const cy = h0 / 2;
      const diag = Math.hypot(w0, h0);
      const gapPx = Math.max(cell * 0.35, r.spacing * cell);
      const half = Math.ceil(diag / 2 / gapPx);
      const st = Math.max(4, cell * 0.5);

      for (let k = -half; k <= half; k++) {
        if (budget.left <= 0) return;
        const linePaths: number[][] = [];
        let cur: number[] = [];
        const flush = () => {
          if (cur.length >= 4) linePaths.push(cur);
          cur = [];
        };
        for (let t = -diag / 2; t <= diag / 2; t += st) {
          let px = cx + ux * t + vx * k * gapPx;
          let py = cy + uy * t + vy * k * gapPx;
          // Warp displaces along the line normal, sampled in cell space so the
          // waves scale with the grid.
          if (r.warp > 0) {
            const n =
              noise2(warpSeed, (px / cell) * warpDet + pi * 37.7, (py / cell) * warpDet) - 0.5;
            px += vx * n * 2 * r.warp * cell * 1.4;
            py += vy * n * 2 * r.warp * cell * 1.4;
          }
          const inSheet = px >= 0 && px <= w0 && py >= 0 && py <= h0;
          // Coherent dashes: a noise threshold lifts the pen in runs, not
          // single samples.
          const down =
            r.dash <= 0 ||
            noise2(dashSeed, t / (cell * 2.2), k * 13.37 + pi * 51.1) > r.dash * 0.92;
          if (inSheet && down && budget.left > 0) {
            cur.push(px, py);
            budget.left--;
          } else flush();
        }
        flush();
        // Boustrophedon: alternate line direction so the replay sweeps back
        // and forth like a real raster pass.
        if (k % 2) {
          linePaths.reverse();
          for (const p of linePaths) {
            const rev: number[] = [];
            for (let i = p.length - 2; i >= 0; i -= 2) rev.push(p[i], p[i + 1]);
            out.push(rev);
          }
        } else out.push(...linePaths);
      }
    }
  }

  function buildFlow(
    r: PlotRule, ri: number, cell: number, w0: number, h0: number,
    out: number[][], budget: { left: number }
  ) {
    // Streams are seeded per grid cell (Seeds is the fraction of cells that
    // get one), walked in a boustrophedon cell order so the replay sweeps the
    // sheet — density 1 touches every cell, filling the page with flow.
    const rng = makeRng(ruleSeed(ri, 'drop'));
    const fieldSeed = ruleSeed(ri, 'field');
    const detail = 0.05 + clamp(r.flowDetail, 0, 1) * 0.4;
    const base = (r.flowAngle * Math.PI) / 180;
    const stray = clamp(r.swirl, 0, 1) * Math.PI * 1.35;
    const stepLen = cell * 0.5;
    const density = clamp(r.density, 0, 1);
    const colsN = Math.max(1, Math.round(w0 / cell));
    const rowsN = Math.max(1, Math.ceil(h0 / cell));

    for (let row = 0; row < rowsN; row++) {
      for (let i = 0; i < colsN; i++) {
        if (budget.left <= 0) return;
        const col = row % 2 ? colsN - 1 - i : i;
        // One rng draw per cell in fixed order, so Seeds sweeps streams in and
        // out without reshuffling which cells hold one.
        const roll = rng();
        const jx = rng();
        const jy = rng();
        if (roll >= density) continue;

        let x = (col + 0.3 + jx * 0.4) * cell;
        let y = (row + 0.3 + jy * 0.4) * cell;
        const pts: number[] = [x, y];
        for (let s = 0; s < Math.round(r.flowSteps) && budget.left > 0; s++) {
          // The field is sampled per grid cell (quantized), so the grid's
          // resolution shapes the flow.
          const cxq = Math.floor(x / cell);
          const cyq = Math.floor(y / cell);
          const ang = base + (noise2(fieldSeed, cxq * detail, cyq * detail) - 0.5) * 2 * stray;
          x += Math.cos(ang) * stepLen;
          y += Math.sin(ang) * stepLen;
          if (x < 0 || x > w0 || y < 0 || y > h0) break;
          pts.push(x, y);
          budget.left--;
        }
        if (pts.length < 4) continue;

        // Breadth widens the stream into parallel offset passes — a flat
        // brush built the way a plotter fills area, adjacent passes nearly
        // touching at the pen's width. Passes run boustrophedon.
        const half = (clamp(r.breadth, 0, 1) * cell * 1.7) / 2;
        const passGap = Math.max(2, r.width * 1.3);
        const nSide = Math.floor(half / passGap);
        if (nSide <= 0) {
          out.push(pts);
          continue;
        }
        const n = pts.length / 2;
        const nx: number[] = new Array(n);
        const ny: number[] = new Array(n);
        for (let k = 0; k < n; k++) {
          const ax = pts[Math.max(0, k - 1) * 2];
          const ay = pts[Math.max(0, k - 1) * 2 + 1];
          const bx = pts[Math.min(n - 1, k + 1) * 2];
          const by = pts[Math.min(n - 1, k + 1) * 2 + 1];
          const len = Math.hypot(bx - ax, by - ay) || 1;
          nx[k] = -(by - ay) / len;
          ny[k] = (bx - ax) / len;
        }
        let flip = false;
        for (let o = -nSide; o <= nSide && budget.left > 0; o++) {
          const off = o * passGap;
          const pass: number[] = [];
          for (let k = 0; k < n; k++) {
            const idx = flip ? n - 1 - k : k;
            pass.push(pts[idx * 2] + nx[idx] * off, pts[idx * 2 + 1] + ny[idx] * off);
            budget.left--;
          }
          out.push(pass);
          flip = !flip;
        }
      }
    }
  }

  function buildAll(w0: number, h0: number, key: string): Built {
    const colsN = Math.max(4, Math.round(cols));
    const cell = w0 / colsN;
    const rowsN = Math.max(1, Math.ceil(h0 / cell));
    const budget = { left: POINT_BUDGET };
    const paths: BuiltPath[] = [];
    let running = 0;

    rules.forEach((r, ri) => {
      const polys: number[][] = [];
      if (r.mode === 'turtle') buildTurtle(r, ri, cell, colsN, rowsN, polys, budget);
      else if (r.mode === 'hatch') buildHatch(r, ri, cell, w0, h0, polys, budget);
      else buildFlow(r, ri, cell, w0, h0, polys, budget);

      // Servo wobble is baked into the geometry so the reveal, the finished
      // sheet and the export all agree.
      const wobSeed = ruleSeed(ri, 'wob');
      const wobAmp = clamp(r.wob, 0, 1) * cell * 0.3;
      // Flow pressure/jitter bake per-point width + bleed multipliers: a
      // coarse spatial field (so whole regions press harder and soak
      // together, across adjacent passes) plus fine per-point/per-pass noise.
      const dynamic = r.mode === 'flow' && (r.press > 0 || r.jit > 0);
      const pressSeed = ruleSeed(ri, 'press');
      const jitSeed = ruleSeed(ri, 'jit');
      let passIdx = 0;
      for (const pts of polys) {
        if (wobAmp > 0) {
          for (let i = 0; i < pts.length; i += 2) {
            pts[i] += (noise2(wobSeed, i * 0.21, 3.1) - 0.5) * 2 * wobAmp;
            pts[i + 1] += (noise2(wobSeed, i * 0.21, 17.9) - 0.5) * 2 * wobAmp;
          }
        }
        let total = 0;
        for (let i = 2; i < pts.length; i += 2)
          total += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
        if (total <= 0) continue;
        const path: BuiltPath = { pts, start: running, total, rule: ri };
        if (dynamic) {
          const n = pts.length / 2;
          const wm = new Float32Array(n);
          const hm = new Float32Array(n);
          for (let k = 0; k < n; k++) {
            const field = noise2(pressSeed, pts[k * 2] / (cell * 2.6), pts[k * 2 + 1] / (cell * 2.6));
            const jn = noise2(jitSeed, k * 0.7, passIdx * 13.7) - 0.5;
            wm[k] = clamp(1 + r.press * (field - 0.5) * 2.2 + r.jit * jn * 1.5, 0.12, 3);
            hm[k] = clamp(r.press * (field - 0.35) * 1.7, 0, 1);
          }
          path.wm = wm;
          path.hm = hm;
        }
        paths.push(path);
        running += total;
        passIdx++;
      }
    });

    return { key, paths, total: running, cell, rowsN };
  }

  function ensureBuilt(w0: number, h0: number) {
    const key = simKey(w0, h0);
    if (built?.key === key) return;
    const wasDone = built ? headway >= built.total : false;
    built = buildAll(w0, h0, key);
    if (motion === 'finished' || wasDone || reduced) headway = built.total;
    else {
      headway = Math.min(headway, built.total);
      syncLoop();
    }
  }

  // --- plot replay ------------------------------------------------------------
  // `headway` is the drawn length in px; the pen travels at a constant pace,
  // so a scene with more ink genuinely takes longer to plot.
  let headway = 0;
  let rafId = 0;
  let lastNow = 0;
  let reduced = false;

  const BASE_PEN_SPEED = 2000; // px/s at 1×
  const pxPerSec = () => BASE_PEN_SPEED * clamp(speed, 0.25, 4);

  function tick(now: number) {
    const dt = Math.min((now - lastNow) / 1000, 1 / 30);
    lastNow = now;
    if (!document.hidden && built) {
      headway = Math.min(built.total, headway + dt * pxPerSec());
      stage?.paint();
      if (headway >= built.total) {
        rafId = 0;
        return; // done — hold the finished sheet
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function syncLoop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (!mounted || reduced || motion !== 'plot') return;
    if (built && headway >= built.total) return;
    lastNow = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  export function replay() {
    headway = 0;
    stage?.paint();
    syncLoop();
  }

  let prevMotion = motion;
  $: if (mounted && motion !== prevMotion) {
    prevMotion = motion;
    if (motion === 'plot') replay();
    else {
      headway = built?.total ?? 0;
      syncLoop();
      stage?.paint();
    }
  }

  // --- rendering --------------------------------------------------------------
  const paperIsLight = () => {
    const { r, g, b } = hexRgb(bg);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
  };

  function drawGrid(ctx: CanvasRenderingContext2D, cell: number, colsN: number, rowsN: number) {
    if (grid === 'none' || gridAmount <= 0) return;
    const a = clamp(gridAmount, 0, 1);
    const color = paperIsLight()
      ? `rgba(70, 90, 140, ${a * 0.35})`
      : `rgba(170, 190, 230, ${a * 0.3})`;
    if (grid === 'lines') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= colsN; x++) {
        ctx.moveTo(x * cell, 0);
        ctx.lineTo(x * cell, rowsN * cell);
      }
      for (let y = 0; y <= rowsN; y++) {
        ctx.moveTo(0, y * cell);
        ctx.lineTo(colsN * cell, y * cell);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      const s = Math.max(1.2, cell * 0.05);
      for (let y = 0; y <= rowsN; y++)
        for (let x = 0; x <= colsN; x++)
          ctx.fillRect(x * cell - s / 2, y * cell - s / 2, s, s);
    }
  }

  function strokePts(ctx: CanvasRenderingContext2D, xs: number[]) {
    ctx.beginPath();
    ctx.moveTo(xs[0], xs[1]);
    for (let i = 2; i < xs.length; i += 2) ctx.lineTo(xs[i], xs[i + 1]);
    ctx.stroke();
  }

  // Draw a pressure/jitter path as short chunks so width and bleed can vary
  // along it: each chunk gets its baked width multiplier, plus a wide faint
  // halo under-stroke where the local pressure soaks the paper. Honors the
  // reveal limit; returns the pen tip when the limit lands inside the path.
  const CHUNK = 3; // segments per chunk
  function drawChunked(
    ctx: CanvasRenderingContext2D, p: BuiltPath, r: PlotRule, limit: number
  ): [number, number] | null {
    const pts = p.pts;
    const wm = p.wm!;
    const hm = p.hm!;
    const n = pts.length / 2;
    const baseA = clamp(r.ink, 0.05, 1);
    let acc = 0;
    for (let i = 0; i < n - 1; i += CHUNK) {
      const j = Math.min(n - 1, i + CHUNK);
      const xs: number[] = [pts[i * 2], pts[i * 2 + 1]];
      let ended = false;
      for (let k = i; k < j; k++) {
        const ax = pts[k * 2];
        const ay = pts[k * 2 + 1];
        const bx = pts[k * 2 + 2];
        const by = pts[k * 2 + 3];
        const seg = Math.hypot(bx - ax, by - ay);
        if (acc + seg > limit) {
          const f = seg > 0 ? (limit - acc) / seg : 0;
          xs.push(ax + (bx - ax) * f, ay + (by - ay) * f);
          ended = true;
          break;
        }
        acc += seg;
        xs.push(bx, by);
      }
      if (xs.length < 4 && !ended) continue;
      const mid = Math.min(n - 1, (i + j) >> 1);
      const w = Math.max(0.25, r.width * wm[mid]);
      if (hm[mid] > 0.02) {
        ctx.globalAlpha = baseA * 0.28 * hm[mid];
        ctx.lineWidth = w * 2.4;
        strokePts(ctx, xs);
      }
      ctx.globalAlpha = baseA;
      ctx.lineWidth = w;
      if (xs.length >= 4) strokePts(ctx, xs);
      if (ended) return [xs[xs.length - 2], xs[xs.length - 1]];
    }
    return null;
  }

  function strokePartial(ctx: CanvasRenderingContext2D, p: BuiltPath, len: number): [number, number] {
    // Walk the polyline out to `len` drawn px and return the pen tip.
    ctx.beginPath();
    ctx.moveTo(p.pts[0], p.pts[1]);
    let acc = 0;
    let tx = p.pts[0];
    let ty = p.pts[1];
    for (let i = 2; i < p.pts.length; i += 2) {
      const seg = Math.hypot(p.pts[i] - p.pts[i - 2], p.pts[i + 1] - p.pts[i - 1]);
      if (acc + seg >= len) {
        const f = seg > 0 ? (len - acc) / seg : 0;
        tx = p.pts[i - 2] + (p.pts[i] - p.pts[i - 2]) * f;
        ty = p.pts[i - 1] + (p.pts[i + 1] - p.pts[i - 1]) * f;
        ctx.lineTo(tx, ty);
        break;
      }
      acc += seg;
      tx = p.pts[i];
      ty = p.pts[i + 1];
      ctx.lineTo(tx, ty);
    }
    ctx.stroke();
    return [tx, ty];
  }

  function renderScene(
    ctx: CanvasRenderingContext2D,
    w0: number,
    h0: number,
    px: number,
    py: number,
    reveal: number | null // drawn length in px, null = finished sheet
  ) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w0, h0);
    if (!built) return;

    ctx.save();
    ctx.translate(w0 / 2 + px, h0 / 2 + py);
    ctx.scale(zoom, zoom);
    ctx.translate(-w0 / 2, -h0 / 2);

    const colsN = Math.max(4, Math.round(cols));
    drawGrid(ctx, built.cell, colsN, built.rowsN);

    // Semi-transparent ink over multiply (light paper) / screen (dark paper)
    // pools where passes cross — multiply on a dark sheet would crush to black.
    const blend: GlobalCompositeOperation = paperIsLight() ? 'multiply' : 'screen';
    let tip: [number, number] | null = null;
    let tipRule = -1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = blend;

    for (const p of built.paths) {
      if (reveal !== null && p.start > reveal) break;
      const r = rules[p.rule];
      if (!r) continue;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(0.3, r.width);
      ctx.globalAlpha = clamp(r.ink, 0.05, 1);
      const partial = reveal !== null && p.start + p.total > reveal;
      if (p.wm) {
        const t = drawChunked(ctx, p, r, partial ? reveal! - p.start : Infinity);
        if (partial) {
          tip = t;
          tipRule = p.rule;
          break;
        }
        continue;
      }
      if (partial) {
        tip = strokePartial(ctx, p, reveal! - p.start);
        tipRule = p.rule;
        break;
      }
      ctx.beginPath();
      ctx.moveTo(p.pts[0], p.pts[1]);
      for (let i = 2; i < p.pts.length; i += 2) ctx.lineTo(p.pts[i], p.pts[i + 1]);
      ctx.stroke();
    }

    // The carriage: a pen-colored head riding the active tip.
    if (tip && tipRule >= 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const r0 = (3 + rules[tipRule].width * 1.1) / zoom;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], r0, 0, TAU);
      ctx.fillStyle = rules[tipRule].color;
      ctx.fill();
      ctx.lineWidth = Math.max(1 / zoom, r0 * 0.3);
      ctx.strokeStyle = paperIsLight() ? 'rgba(25, 25, 35, 0.75)' : 'rgba(255, 255, 255, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // Mirrored camera so the video exporter can reproduce the on-screen framing
  // at clip resolution.
  let w = 0;
  let h = 0;
  let panX = 0;
  let panY = 0;

  function draw(ctx: CanvasRenderingContext2D, view: StageView) {
    w = view.w;
    h = view.h;
    panX = view.panX;
    panY = view.panY;
    ensureBuilt(w, h);
    renderScene(ctx, w, h, panX, panY, motion === 'plot' ? headway : null);
  }

  // Repaint on any visual prop change; ensureBuilt decides whether the sim
  // actually needs a rebuild (colors/widths/ink don't).
  $: if (
    mounted &&
    (void [bg, seed, cols, grid, gridAmount, rules, motion, speed], true)
  ) {
    stage?.paint();
  }

  export const recenter = () => stage?.recenter();
  export const saveImage = (filename = 'plotter.png') => stage?.saveImage(filename);
  export const sampleLuminance = (stripFrac = 0.16) => stage?.sampleLuminance(bg, stripFrac) ?? null;

  // Thumbnails always show the finished plot, even mid-replay.
  export const snapshot = (bgFill: string, maxDim = 128) => {
    if (!stage) return null;
    const held = headway;
    if (built) headway = built.total;
    stage.paint();
    const shot = stage.snapshot(bgFill, maxDim);
    headway = held;
    stage.paint();
    return shot;
  };

  // --- video capture ----------------------------------------------------------
  // A clip is one plot run: `u` sweeps the reveal, with the tail held on the
  // finished sheet. Rendered by scaling the live framing to clip resolution.
  export function captureFrame(ctx: CanvasRenderingContext2D, W: number, H: number, u: number) {
    if (!built || !w) return;
    const k = W / w;
    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.scale(k, k);
    renderScene(ctx, w, h, panX, panY, Math.min(1, u / 0.86) * built.total);
    ctx.restore();
  }

  onMount(() => {
    mounted = true;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = mql.matches;
    const onMQ = () => {
      reduced = mql.matches;
      if (reduced && built) headway = built.total;
      syncLoop();
      stage?.paint();
    };
    mql.addEventListener?.('change', onMQ);
    const onVisibility = () => {
      lastNow = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    syncLoop();
    return () => {
      cancelAnimationFrame(rafId);
      mql.removeEventListener?.('change', onMQ);
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
