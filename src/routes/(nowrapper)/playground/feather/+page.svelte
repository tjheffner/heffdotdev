<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Feather from '$lib/components/playground/Feather.svelte';
  import type { PaperTexture, PenLayer } from '$lib/components/playground/Feather.svelte';
  import CurvePad from '$lib/components/playground/CurvePad.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { createHistory } from '$lib/playground/history';
  import { moveInArray, dropIndexAt } from '$lib/playground/reorder';
  import { hexRgb, hslToHex } from '$lib/playground/color';
  import { n36, p36 } from '$lib/playground/token';
  import { packPath, unpackPath } from '$lib/playground/path';
  import { rand, randInt, pick, round } from '$lib/playground/math';

  const presets = createPresetStore('feather');
  let savedScenes: SavedScenes;
  let renderer: Feather;

  const TAU = Math.PI * 2;
  const TEXTURES: PaperTexture[] = ['none', 'grain', 'weave'];
  const TEXTURE_LABELS: Record<PaperTexture, string> = {
    none: 'None',
    grain: 'Grain',
    weave: 'Weave'
  };

  // --- starter curves -------------------------------------------------------
  // Pens hold freeform pad drawings; defaults and Shuffle synthesize polylines
  // so the first paint (and every reroll) looks drawn-with-intent.
  function sampled(fn: (t: number) => [number, number], n = 72): number[] {
    const pts: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const [x, y] = fn(t);
      pts.push(round(x, 3), round(y, 3));
    }
    return pts;
  }
  // Simple open curves — the sweep does the work, so the strokes stay plain.
  // Weighted toward C/U arcs and hooks; full-width waves (sway/ess/ridge) are
  // the minority — deep partial curves sweep into more pleasing forms.
  function randomPath(): number[][] {
    const roll = Math.random();
    const kind =
      roll < 0.45 ? 'arc' : roll < 0.7 ? 'hook' : roll < 0.82 ? 'ess' : roll < 0.92 ? 'sway' : 'ridge';
    switch (kind) {
      case 'arc': {
        // A deep partial arc — reads as a C or U depending on orientation.
        const span = rand(1.6, 3.6);
        const a0 = rand(0, 6.28);
        const rr = rand(0.5, 0.9);
        return [
          sampled((t) => {
            const a = a0 + (t - 0.5) * span;
            return [rr * Math.cos(a), rr * Math.sin(a)];
          })
        ];
      }
      case 'sway': {
        const a1 = rand(0.12, 0.4);
        const f1 = rand(0.4, 1.6);
        const p1 = rand(0, 6.28);
        const a2 = rand(0, 0.15);
        const f2 = rand(1.5, 3.5);
        const p2 = rand(0, 6.28);
        return [
          sampled((t) => [2 * t - 1, a1 * Math.sin(TAU * f1 * t + p1) + a2 * Math.sin(TAU * f2 * t + p2)])
        ];
      }
      case 'ess': {
        const a = rand(0.3, 0.55);
        const k = rand(0.7, 1.1);
        return [sampled((t) => [2 * t - 1, a * Math.sin((2 * t - 1) * Math.PI * k)])];
      }
      case 'ridge': {
        // A mountain silhouette: a few soft bumps on a baseline.
        const bumps = Array.from({ length: randInt(2, 4) }, () => ({
          a: rand(0.15, 0.5),
          c: rand(0.15, 0.85),
          w: rand(0.07, 0.2)
        }));
        return [
          sampled((t) => {
            let y = 0.25;
            for (const b of bumps) y -= b.a * Math.exp(-(((t - b.c) / b.w) ** 2));
            return [2 * t - 1, y];
          })
        ];
      }
      case 'hook': {
        // An open hook: the radius eases in over a partial turn — not a spiral.
        const span = rand(2, 4);
        const a0 = rand(0, 6.28);
        const r1 = rand(0.25, 0.55);
        return [
          sampled((t) => {
            const a = a0 + t * span;
            const rr = 0.85 - (0.85 - r1) * t;
            return [rr * Math.cos(a), rr * Math.sin(a)];
          }, 84)
        ];
      }
    }
  }

  // Single source of truth for defaults, shared by initial state and Reset.
  // The paths are hand-drawn pad strokes, kept verbatim as point data.
  const INITIAL_LAYERS: PenLayer[] = [
    {
      reps: 29, size: 0.86, rot: -0.68, spin: 0, grow: 0.79, dx: -1.7, dy: 5.7, ox: 47, oy: -27, swell: 0.55, rip: 2.9, trav: -2.2, relax: 0.29, env: 0.22, press: 0.27, bleed: 0.13, nib: 81, jit: 0.37, wob: 0.03, color: '#64d8b7',
      path: [
        [-1, -0.147, -0.972, -0.185, -0.944, -0.219, -0.915, -0.253, -0.887, -0.283, -0.859, -0.314, -0.832, -0.342, -0.802, -0.367, -0.775, -0.392, -0.747, -0.412, -0.717, -0.43, -0.69, -0.446, -0.662, -0.458, -0.634, -0.469, -0.606, -0.475, -0.577, -0.48, -0.549, -0.48, -0.521, -0.478, -0.493, -0.473, -0.466, -0.464, -0.436, -0.453, -0.408, -0.439, -0.381, -0.422, -0.351, -0.402, -0.324, -0.381, -0.296, -0.356, -0.268, -0.33, -0.239, -0.3, -0.211, -0.269, -0.183, -0.239, -0.155, -0.205, -0.127, -0.168, -0.1, -0.132, -0.07, -0.095, -0.042, -0.056, -0.015, -0.019, 0.015, 0.019, 0.042, 0.056, 0.07, 0.095, 0.1, 0.132, 0.127, 0.168, 0.155, 0.205, 0.183, 0.239, 0.211, 0.269, 0.239, 0.3, 0.268, 0.33, 0.296, 0.356, 0.324, 0.381, 0.351, 0.402, 0.381, 0.422, 0.408, 0.439, 0.436, 0.453, 0.466, 0.464, 0.493, 0.473, 0.521, 0.478, 0.549, 0.48, 0.577, 0.48, 0.606, 0.475, 0.634, 0.469, 0.662, 0.458, 0.69, 0.446, 0.717, 0.43, 0.747, 0.412, 0.775, 0.392, 0.802, 0.367, 0.832, 0.342, 0.859, 0.314, 0.887, 0.283, 0.915, 0.253, 0.944, 0.219, 0.972, 0.185, 1, 0.147]
      ],
      open: true
    },
    {
      reps: 31, size: 0.8, rot: 0.53, spin: 0, grow: -0.76, dx: -0.9, dy: -2.1, ox: 19, oy: 75, swell: 0.35, rip: 5.9, trav: -10.4, relax: 0.1, env: 0.15, press: 0.18, bleed: 0.47, nib: 129.8, jit: 0.39, wob: 0.12, color: '#90e4be',
      path: [
        [-0.415, 0.742, -0.435, 0.725, -0.455, 0.707, -0.473, 0.69, -0.492, 0.671, -0.51, 0.651, -0.527, 0.632, -0.543, 0.612, -0.558, 0.591, -0.574, 0.571, -0.588, 0.549, -0.602, 0.527, -0.612, 0.506, -0.625, 0.484, -0.636, 0.463, -0.646, 0.439, -0.656, 0.418, -0.663, 0.395, -0.673, 0.371, -0.679, 0.348, -0.685, 0.325, -0.691, 0.3, -0.696, 0.279, -0.7, 0.256, -0.703, 0.232, -0.705, 0.209, -0.707, 0.185, -0.708, 0.161, -0.708, 0.14, -0.708, 0.117, -0.707, 0.093, -0.703, 0.072, -0.702, 0.05, -0.697, 0.029, -0.694, 0.005, -0.69, -0.015, -0.683, -0.036, -0.679, -0.056, -0.673, -0.078, -0.663, -0.098, -0.656, -0.117, -0.648, -0.137, -0.639, -0.157, -0.629, -0.174, -0.619, -0.192, -0.609, -0.209, -0.598, -0.226, -0.586, -0.243, -0.574, -0.26, -0.561, -0.276, -0.549, -0.29, -0.537, -0.305, -0.521, -0.319, -0.507, -0.333, -0.493, -0.347, -0.48, -0.358, -0.464, -0.37, -0.449, -0.381, -0.435, -0.392, -0.418, -0.402, -0.402, -0.412, -0.385, -0.419, -0.37, -0.429, -0.354, -0.436, -0.337, -0.442, -0.32, -0.45, -0.303, -0.456, -0.288, -0.461, -0.271, -0.466, -0.263, -0.47, -0.237, -0.473, -0.222, -0.476, -0.205, -0.48, -0.188, -0.48, -0.171, -0.483, -0.155, -0.483, -0.138, -0.483, -0.121, -0.483, -0.106, -0.481, -0.09, -0.48, -0.075, -0.478, -0.059, -0.475, -0.044, -0.473, -0.029, -0.469]
      ],
      open: false
    },
    {
      reps: 59, size: 0.82, rot: -1.36, spin: 0, grow: 0.15, dx: 0.3, dy: 2, ox: 37, oy: -107, swell: 0.28, rip: 4, trav: 29, relax: 0.69, env: 0.56, press: 0.46, bleed: 0.42, nib: 22.7, jit: 0.31, wob: 0.3, color: '#9df1ca',
      path: [],
      open: false
    },
    {
      reps: 46, size: 1.23, rot: 2.53, spin: -60, grow: 0.68, dx: 2.8, dy: 3.8, ox: -94, oy: -61, swell: 0.3, rip: 4.4, trav: -12.9, relax: 0.25, env: 0.08, press: 0.32, bleed: 0.17, nib: 50.7, jit: 0.58, wob: 0.06, color: '#6685f5',
      path: [
        [-1, 0.225, -0.972, 0.215, -0.944, 0.206, -0.915, 0.192, -0.887, 0.178, -0.859, 0.161, -0.832, 0.143, -0.802, 0.123, -0.775, 0.101, -0.747, 0.078, -0.717, 0.056, -0.69, 0.033, -0.662, 0.012, -0.634, -0.007, -0.606, -0.022, -0.577, -0.036, -0.549, -0.046, -0.521, -0.052, -0.493, -0.055, -0.466, -0.055, -0.436, -0.053, -0.408, -0.049, -0.381, -0.046, -0.351, -0.042, -0.324, -0.039, -0.296, -0.039, -0.268, -0.042, -0.239, -0.046, -0.211, -0.053, -0.183, -0.063, -0.155, -0.075, -0.127, -0.087, -0.1, -0.103, -0.07, -0.115, -0.042, -0.127, -0.015, -0.14, 0.015, -0.147, 0.042, -0.152, 0.07, -0.154, 0.1, -0.152, 0.127, -0.146, 0.155, -0.137, 0.183, -0.121, 0.211, -0.106, 0.239, -0.086, 0.268, -0.064, 0.296, -0.039, 0.324, -0.015, 0.351, 0.01, 0.381, -0.208, 0.408, -0.185, 0.436, -0.158, 0.466, -0.134, 0.493, -0.109, 0.521, -0.083, 0.549, -0.058, 0.577, -0.033, 0.606, -0.008, 0.634, 0.018, 0.662, 0.042, 0.69, 0.066, 0.717, 0.09, 0.747, 0.115, 0.775, 0.14, 0.802, 0.161, 0.832, 0.185, 0.859, 0.208, 0.887, 0.229, 0.915, 0.251, 0.944, 0.273, 0.972, 0.291, 1, 0.31]
      ],
      open: false
    }
  ];
  const DEFAULTS = {
    bg: '#2a2919',
    inkBlend: true,
    texture: 'grain' as PaperTexture,
    texAmount: 0.5,
    seed: 'sumi-wg0d',
    zoom: 1.65
  };

  const cloneLayers = (ls: PenLayer[]) =>
    ls.map((l) => ({ ...l, path: l.path.map((s) => s.slice()) }));

  // --- state --------------------------------------------------------------
  let layers: PenLayer[] = cloneLayers(INITIAL_LAYERS);
  let bg = DEFAULTS.bg;
  let inkBlend = DEFAULTS.inkBlend;
  let texture = DEFAULTS.texture;
  let texAmount = DEFAULTS.texAmount;
  let seed = DEFAULTS.seed;
  let zoom = DEFAULTS.zoom;

  // Flip the overlay chrome against the actual pixels under it (the default
  // paper is light, so this matters from the first paint). Coalesced to one
  // sample per frame so drags stay cheap.
  let chromeLight = false;
  let sampleQueued = false;
  function onCanvasRendered() {
    if (sampleQueued) return;
    sampleQueued = true;
    requestAnimationFrame(() => {
      sampleQueued = false;
      const l = renderer?.sampleLuminance();
      if (l != null) chromeLight = l > 0.6;
    });
  }

  // --- layer management ---------------------------------------------------
  // Perceived luminance, not HSL lightness — saturated mid-tones read dark.
  const paperIsLight = () => {
    const { r, g, b } = hexRgb(bg);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
  };

  // Dark inks on light paper; bright, saturated inks on dark paper.
  function inkColor(): string {
    return paperIsLight()
      ? hslToHex(randInt(0, 360), randInt(35, 75), randInt(16, 40))
      : hslToHex(randInt(0, 360), randInt(60, 95), randInt(60, 85));
  }

  function randomLayer(): PenLayer {
    const reps = randInt(16, 60);
    const dx = rand(-5, 5);
    const dy = Math.random() < 0.7 ? rand(2, 8) : rand(-8, -2);
    return {
      path: randomPath(),
      reps,
      size: rand(0.6, 1.3),
      rot: rand(-3, 3),
      grow: rand(-1.5, 1),
      dx,
      dy,
      // Center the whole sweep on the page so shuffles land composed.
      ox: Math.round(-dx * reps * 0.5) + randInt(-60, 60),
      oy: Math.round(-dy * reps * 0.5) + randInt(-60, 60),
      swell: rand(0.1, 0.6),
      rip: rand(1, 6),
      trav: rand(-30, 30),
      relax: rand(0, 0.7),
      env: rand(0, 0.8),
      spin: Math.random() < 0.4 ? 0 : rand(-90, 90),
      press: rand(0.15, 0.65),
      bleed: rand(0.1, 0.7),
      nib: randInt(0, 180),
      jit: rand(0.15, 0.6),
      wob: rand(0, 0.2),
      color: inkColor(),
      open: false
    };
  }

  function addLayer() {
    layers = [...layers, { ...randomLayer(), open: true }];
  }
  function duplicateLayer(i: number) {
    const src = layers[i];
    const copy = {
      ...src,
      path: src.path.map((s) => s.slice()),
      ox: src.ox + 30,
      oy: src.oy + 30,
      open: true
    };
    layers = [...layers.slice(0, i + 1), copy, ...layers.slice(i + 1)];
  }
  function removeLayer(i: number) {
    layers = layers.filter((_, idx) => idx !== i);
  }
  function randomizeAll() {
    const count = randInt(2, 5);
    layers = Array.from({ length: count }, () => randomLayer());
  }

  // Pad edits: each drag adds a stroke; these trim back.
  function undoStroke(i: number) {
    layers[i].path = layers[i].path.slice(0, -1);
  }
  function clearStrokes(i: number) {
    layers[i].path = [];
  }
  function rerollCurve(i: number) {
    layers[i].path = randomPath();
  }

  // --- reorder (drag & drop, plus keyboard) -------------------------------
  // Order is paint order (ink stacks), so restacking changes the overlap.
  let dragIndex: number | null = null;
  let overIndex: number | null = null;
  let handleEls: HTMLButtonElement[] = [];
  let layerEls: HTMLElement[] = [];

  function onDragStart(e: DragEvent, i: number) {
    dragIndex = i;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
      const card = (e.currentTarget as HTMLElement).closest('.layer');
      if (card) e.dataTransfer.setDragImage(card, 16, 16);
    }
  }
  function onListDragOver(e: DragEvent) {
    if (dragIndex === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    overIndex = dropIndexAt(layerEls.slice(0, layers.length), dragIndex, e.clientY);
  }
  function onListDrop() {
    if (dragIndex !== null && overIndex !== null)
      layers = moveInArray(layers, dragIndex, overIndex);
    dragIndex = null;
    overIndex = null;
  }
  function onDragEnd() {
    dragIndex = null;
    overIndex = null;
  }
  async function onHandleKey(e: KeyboardEvent, i: number) {
    const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : i;
    if (to === i || to < 0 || to >= layers.length) return;
    e.preventDefault();
    layers = moveInArray(layers, i, to);
    await tick();
    handleEls[to]?.focus();
  }

  // --- shuffle / reset ----------------------------------------------------
  const WORDS = ['nib', 'quill', 'stylus', 'india', 'sumi', 'vellum', 'bristol', 'gouache'];
  function reseed() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    seed = `${w}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Shuffle re-rolls the paper, the seed, and every pen; Reset restores defaults.
  function shuffle() {
    bg =
      Math.random() < 0.6
        ? hslToHex(randInt(30, 55), randInt(15, 45), randInt(88, 96)) // paper tones
        : hslToHex(randInt(0, 360), randInt(10, 30), randInt(5, 13)); // dark boards
    texture = pick(TEXTURES);
    texAmount = rand(0.2, 0.8);
    randomizeAll();
    reseed();
  }
  function reset() {
    layers = cloneLayers(INITIAL_LAYERS);
    bg = DEFAULTS.bg;
    inkBlend = DEFAULTS.inkBlend;
    texture = DEFAULTS.texture;
    texAmount = DEFAULTS.texAmount;
    seed = DEFAULTS.seed;
    zoom = DEFAULTS.zoom;
    renderer?.recenter();
  }

  // --- shareable scene code (compact base36 token) ------------------------
  function encodeState(): string {
    const g = [
      n36(inkBlend ? 1 : 0),
      n36(zoom, 100),
      n36(Math.max(0, TEXTURES.indexOf(texture))),
      n36(texAmount, 1000),
      bg.replace(/^#/, '')
    ].join('.');
    const ls = layers
      .map((l) =>
        [
          n36(l.reps), n36(l.size, 1000),
          n36(l.rot, 100), n36(l.spin, 10), n36(l.grow, 100),
          n36(l.dx, 10), n36(l.dy, 10), n36(l.ox), n36(l.oy),
          n36(l.swell, 1000), n36(l.rip, 10), n36(l.trav, 10), n36(l.relax, 1000), n36(l.env, 1000),
          n36(l.press, 1000), n36(l.bleed, 1000), n36(l.nib, 10), n36(l.wob, 1000), n36(l.jit, 1000),
          l.color.replace(/^#/, ''),
          packPath(l.path)
        ].join('.')
      )
      .join('_');
    return `p1~${g}~${ls}~${seed}`; // seed is a word — kept raw as the trailing section
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 'p1' || parts.length < 3) return;
      const g = parts[1].split('.');
      inkBlend = p36(g[0], 1, inkBlend ? 1 : 0) === 1;
      zoom = p36(g[1], 100, zoom);
      texture = TEXTURES[p36(g[2])] ?? texture;
      texAmount = p36(g[3], 1000, texAmount);
      if (g[4]) bg = `#${g[4]}`;
      const rows = (parts[2] ? parts[2].split('_') : [])
        .map((s) => s.split('.'))
        .filter((a) => a.length >= 21);
      if (rows.length) {
        layers = rows.map((a) => ({
          reps: p36(a[0], 1, 1),
          size: p36(a[1], 1000, 0.5),
          rot: p36(a[2], 100),
          spin: p36(a[3], 10),
          grow: p36(a[4], 100),
          dx: p36(a[5], 10),
          dy: p36(a[6], 10),
          ox: p36(a[7]),
          oy: p36(a[8]),
          swell: p36(a[9], 1000),
          rip: p36(a[10], 10, 3),
          trav: p36(a[11], 10),
          relax: p36(a[12], 1000),
          env: p36(a[13], 1000),
          press: p36(a[14], 1000, 0.4),
          bleed: p36(a[15], 1000, 0.35),
          nib: p36(a[16], 10, 40),
          wob: p36(a[17], 1000),
          jit: p36(a[18], 1000),
          color: a[19] ? `#${a[19]}` : '#1a1a1a',
          path: unpackPath(a[20] ?? ''),
          open: false
        }));
      }
      seed = parts.slice(3).join('~') || seed;
    } catch {
      // Malformed token — keep current scene.
    }
  }

  // --- export / saved scenes ----------------------------------------------
  // A short hash of the full scene, so the PNG filename changes with any edit.
  function shortId(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }
  function savePng() {
    renderer?.saveImage(`feather-${shortId(encodeState())}.png`);
  }
  function applyScene(token: string) {
    decodeState(token);
    renderer?.recenter();
  }
  const sceneSnapshot = () => renderer?.snapshot(bg) ?? null;
  $: sceneLabel = `${layers.length} pen${layers.length === 1 ? '' : 's'} · ${layers.reduce(
    (s, l) => s + Math.max(1, Math.round(l.reps)),
    0
  )} passes`;

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });

  // Record scene edits (debounced) so Undo can step back — even across a refresh.
  const history = createHistory('feather');
  $: (void [inkBlend, zoom, texture, texAmount, bg, layers, seed], history.touch(encodeState));
  function undoScene() {
    const tok = history.undo(encodeState());
    if (tok) applyScene(tok);
  }
</script>

<Metatags
  title="Feather"
  description="Layered ink sweeps from curves you draw yourself."
  ogMessage="Feather"
/>

<PlaygroundShell
  title="Feather"
  subtitle="Swept ink: draw a curve on each pen's pad and repeat it across the paper. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onUndo={undoScene}
  onSavePng={savePng}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Paper">
    <p class="hint">The sheet the pens draw on.</p>
    <label class="color-row">
      <span class="lab">Paper</span>
      <input type="color" bind:value={bg} />
      <span class="val">{bg}</span>
    </label>
    <div class="mode-row">
      <span class="lab">Texture</span>
      <div class="mode-btns">
        {#each TEXTURES as t}
          <button class="mode-btn" class:active={texture === t} on:click={() => (texture = t)}>
            {TEXTURE_LABELS[t]}
          </button>
        {/each}
      </div>
    </div>
    {#if texture !== 'none'}
      <Slider label="Amount" bind:value={texAmount} min={0} max={1} step={0.01} />
    {/if}
    <label class="toggle-row">
      <span class="lab">Ink blend</span>
      <input type="checkbox" bind:checked={inkBlend} />
    </label>
    <p class="hint">
      {inkBlend
        ? 'Overlapping ink deepens on light paper and glows on dark paper.'
        : 'Strokes stack plainly, with no ink mixing.'}
    </p>
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
  </Section>

  <Section title={`Pens (${layers.length})`}>
    <div slot="actions" class="group-actions">
      <button class="btn" on:click|preventDefault|stopPropagation={addLayer}>Add</button>
      <button class="btn" on:click|preventDefault|stopPropagation={randomizeAll}>Randomize</button>
    </div>
    <p class="hint">Each pen sweeps its drawn curve across the paper, morphing a little each pass.</p>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="reorder-list" on:dragover={onListDragOver} on:drop={onListDrop}>
      {#each layers as layer, i (layer)}
        <div
          class="layer"
          bind:this={layerEls[i]}
          class:dragging={dragIndex === i}
          class:drop-target={overIndex === i && dragIndex !== null && dragIndex !== i}
          on:dragend={onDragEnd}
        >
          <details bind:open={layer.open}>
            <summary>
              <button
                class="drag-handle"
                bind:this={handleEls[i]}
                draggable="true"
                title="Drag to reorder (or ↑/↓)"
                aria-label="Reorder pen {i + 1} of {layers.length}"
                on:click|preventDefault|stopPropagation
                on:dragstart={(e) => onDragStart(e, i)}
                on:keydown={(e) => onHandleKey(e, i)}
              >⠿</button>
              <span class="swatch" style="background: {layer.color};"></span>
              <span class="layer-name">Pen {i + 1}</span>
              <span class="layer-meta">
                {layer.path.length} stroke{layer.path.length === 1 ? '' : 's'} · ×{Math.round(layer.reps)}
              </span>
            </summary>

            <div class="layer-body">
              <h3>Curve</h3>
              <p class="hint">
                Draw on the pad — each drag adds a stroke. Simple open curves sweep best; the
                passes do the rest.
              </p>
              <CurvePad
                bind:path={layer.path}
                color={layer.color}
                paper={bg}
                label="Drawing pad for pen {i + 1}"
              />
              <div class="pad-actions">
                <button class="btn" disabled={!layer.path.length} on:click={() => undoStroke(i)}>Undo</button>
                <button class="btn" disabled={!layer.path.length} on:click={() => clearStrokes(i)}>Clear</button>
                <button class="btn" on:click={() => rerollCurve(i)}>Random curve</button>
              </div>
              <Slider label="Size" bind:value={layer.size} min={0.05} max={1.4} step={0.01} />

              <h3>Sweep</h3>
              <Slider label="Count" bind:value={layer.reps} min={1} max={80} step={1} />
              <Slider label="Sweep X" bind:value={layer.dx} min={-30} max={30} step={0.5} unit="px" />
              <Slider label="Sweep Y" bind:value={layer.dy} min={-30} max={30} step={0.5} unit="px" />
              <Slider label="Spin" bind:value={layer.spin} min={-180} max={180} step={1} unit="°" />
              <Slider label="Swell" bind:value={layer.swell} min={0} max={1} step={0.01} />
              <Slider label="Ripples" bind:value={layer.rip} min={0} max={12} step={0.1} />
              <Slider label="Travel" bind:value={layer.trav} min={-180} max={180} step={1} unit="°" />
              <Slider label="Envelope" bind:value={layer.env} min={0} max={1} step={0.01} />
              <Slider label="Relax" bind:value={layer.relax} min={0} max={1} step={0.01} />
              <Slider label="Rotate" bind:value={layer.rot} min={-5} max={5} step={0.1} unit="°" />
              <Slider label="Grow" bind:value={layer.grow} min={-5} max={5} step={0.1} unit="%" />
              <Slider label="Offset X" bind:value={layer.ox} min={-1600} max={1600} step={1} unit="px" />
              <Slider label="Offset Y" bind:value={layer.oy} min={-1600} max={1600} step={1} unit="px" />
              <p class="hint">
                Sweep slides each pass across the paper; Spin turns the whole swept layer as one
                piece. Swell ripples the line — Ripples sets the
                wave count, Travel rolls the wave from pass to pass, and Envelope makes the swell
                rise and die over the sweep. Relax settles the curve toward a straight line by the
                end of the sweep. Rotate and Grow twist each pass in place.
              </p>

              <h3>Pen</h3>
              <label class="color-row">
                <span class="lab">Ink</span>
                <input type="color" bind:value={layer.color} />
                <span class="val">{layer.color}</span>
              </label>
              <Slider label="Pressure" bind:value={layer.press} min={0.05} max={1} step={0.01} />
              <Slider label="Bleed" bind:value={layer.bleed} min={0} max={1} step={0.01} />
              <Slider label="Nib" bind:value={layer.nib} min={0} max={180} step={1} unit="°" />
              <Slider label="Jitter" bind:value={layer.jit} min={0} max={1} step={0.01} />
              <Slider label="Wobble" bind:value={layer.wob} min={0} max={1} step={0.01} />
              <p class="hint">
                Pressure sets line weight and ink density — a light pen runs dry across the passes
                and the nib starts skipping. Bleed soaks the ink outward so tight passes flow
                together. Nib is the pen's cut angle: strokes run thin along it, thick across it
                (light pressure sharpens the contrast). Jitter varies the pressure between and
                along strokes; Wobble shakes the hand.
              </p>

              <div class="layer-actions">
                <button class="btn" on:click={() => duplicateLayer(i)}>Duplicate</button>
              </div>
            </div>
          </details>
          <button
            class="layer-delete"
            title="Delete pen {i + 1}"
            aria-label="Delete pen {i + 1}"
            disabled={layers.length <= 1}
            on:click|preventDefault|stopPropagation={() => removeLayer(i)}
          >×</button>
        </div>
      {/each}
    </div>
  </Section>

  <SavedScenes
    bind:this={savedScenes}
    slot="saved"
    store={presets}
    encode={encodeState}
    apply={applyScene}
    snapshot={sceneSnapshot}
    {savePng}
    label={sceneLabel}
  />

  <svelte:fragment slot="footer">
    <button class="btn" on:click={shuffle}>Shuffle (F)</button>
    <button class="btn" on:click={reset}>Reset (R)</button>
  </svelte:fragment>

  <main slot="preview" class="preview" style="background: {bg};">
    <Feather
      bind:this={renderer}
      {bg}
      {inkBlend}
      {texture}
      {texAmount}
      {seed}
      {layers}
      onRendered={onCanvasRendered}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Feather-specific bits; shared sidebar styling lives in PlaygroundShell. */

  .pad-actions {
    display: flex;
    gap: 0.4rem;
  }

  /* The list is one drop target so drags snap to the nearest slot. */
  .reorder-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .layer {
    position: relative;
    border: 1px solid var(--pg-line);
    border-radius: 6px;
    background: #14141a;
    transition: border-color 120ms ease, opacity 120ms ease;
  }
  .layer.dragging {
    opacity: 0.4;
  }
  .layer.drop-target {
    border-color: var(--pg-accent, #ff6b35);
  }
  .drag-handle {
    flex: none;
    width: 16px;
    margin: -0.2rem 0 -0.2rem -0.2rem;
    padding: 0.2rem 0;
    font: inherit;
    font-size: 0.8rem;
    line-height: 1;
    color: var(--pg-dim);
    background: transparent;
    border: none;
    cursor: grab;
    touch-action: none;
  }
  .drag-handle:hover {
    color: var(--pg-text);
  }
  .drag-handle:active {
    cursor: grabbing;
  }
  .drag-handle:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
    border-radius: 3px;
  }
  .layer summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    /* right padding reserves room for the absolutely-positioned delete button */
    padding: 0.5rem 1.8rem 0.5rem 0.6rem;
    cursor: pointer;
    list-style: none;
    font-size: 0.72rem;
    user-select: none;
  }
  .layer summary::-webkit-details-marker {
    display: none;
  }
  .layer summary:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    flex: none;
  }
  .layer-name {
    font-weight: 600;
  }
  .layer-meta {
    margin-left: auto;
    color: var(--pg-dim);
    font-size: 0.64rem;
  }
  .layer-delete {
    position: absolute;
    top: 0.4rem;
    right: 0.6rem;
    flex: none;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    font: inherit;
    font-size: 0.85rem;
    line-height: 1;
    color: var(--pg-dim);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }
  .layer-delete:hover:not(:disabled) {
    color: #e05555;
    border-color: #e05555;
  }
  .layer-delete:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
  }
  .layer-delete:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .layer-body {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.2rem 0.6rem 0.7rem;
    border-top: 1px solid var(--pg-line);
  }
  .layer-body h3 {
    margin: 0.5rem 0 0;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pg-dim);
  }
  .layer-actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
</style>
