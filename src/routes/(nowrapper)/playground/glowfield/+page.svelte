<script lang="ts">
  import { dev } from '$app/environment';
  import { onMount, tick } from 'svelte';
  import { moveInArray, dropIndexAt } from '$lib/playground/reorder';
  import { hslToHex } from '$lib/playground/color';
  import Glowfield from '$lib/components/playground/Glowfield.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { recordViewportClip } from '$lib/playground/video';
  import { n36, p36, unpackHex } from '$lib/playground/token';

  const presets = createPresetStore('glowfield');
  let savedScenes: SavedScenes;

  type Layer = {
    sz: number; ox: number; oy: number; a: number;
    h: number; s: number; l: number;
    fx: number; fy: number; ax: number; ay: number; ph: number;
    open?: boolean;
  };

  type ColorMode = 'anchor' | 'rainbow' | 'mono';

  // --- defaults (shared by initial state and Reset) ---------------------
  const INITIAL_LAYERS: Layer[] = [
    { sz: 710, ox: -29,  oy: -227, a: 0.43, h: 9,   s: 86, l: 59, fx: 0.3,  fy: 0.18, ax: 104, ay: 91,  ph: 4.12, open: true },
    { sz: 710, ox: -139, oy: -165, a: 0.31, h: 38,  s: 86, l: 59, fx: 0.24, fy: 0.17, ax: 103, ay: 88,  ph: 2.02, open: false },
    { sz: 387, ox: -34,  oy: 181,  a: 0.4,  h: 220, s: 86, l: 57, fx: 0.35, fy: 0.38, ax: 114, ay: 99,  ph: 2.14, open: false },
    { sz: 501, ox: 34,   oy: -216, a: 0.49, h: 343, s: 86, l: 54, fx: 0.41, fy: 0.38, ax: 156, ay: 85,  ph: 2.98, open: false },
    { sz: 359, ox: 187,  oy: -122, a: 0.44, h: 276, s: 86, l: 61, fx: 0.41, fy: 0.22, ax: 126, ay: 86,  ph: 3.5,  open: false },
    { sz: 815, ox: 178,  oy: -24,  a: 0.44, h: 1,   s: 86, l: 67, fx: 0.17, fy: 0.27, ax: 101, ay: 126, ph: 3.21, open: false },
    { sz: 501, ox: -5,   oy: 3,    a: 0.5,  h: 64,  s: 86, l: 68, fx: 0.4,  fy: 0.15, ax: 133, ay: 90,  ph: 0.78, open: false },
    { sz: 397, ox: 265,  oy: -216, a: 0.35, h: 48,  s: 86, l: 58, fx: 0.25, fy: 0.25, ax: 136, ay: 98,  ph: 2.62, open: false }
  ];
  const INITIAL = {
    anchor: { x: 0.29, y: 0.46 },
    intensity: { header: 1.0, middle: 0.34, footer: 0.9 },
    depth: 0,
    bg: '#110d10',
    colorMode: 'rainbow' as ColorMode,
    anchorHue: 133,
    anchorSpread: 278,
    rainbowSat: 86
  };

  // --- state ------------------------------------------------------------

  let layers: Layer[] = INITIAL_LAYERS.map((l) => ({ ...l }));
  let anchor = { ...INITIAL.anchor };
  let intensity = { ...INITIAL.intensity };
  let depth = INITIAL.depth;
  let bg = INITIAL.bg;
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  let colorMode: ColorMode = INITIAL.colorMode;
  let anchorHue = INITIAL.anchorHue;
  let anchorSpread = INITIAL.anchorSpread;
  let rainbowSat = INITIAL.rainbowSat;
  let _prevHue = anchorHue;
  let _prevSpread = anchorSpread;
  let _prevRainbowSat = rainbowSat;

  // Per-mode sub-hint shown under the colour buttons.
  $: paletteHint =
    colorMode === 'anchor'
      ? 'Fans each layer’s hue around the anchor. Spread sets how wide.'
      : colorMode === 'rainbow'
        ? 'Gives each layer a random hue. Sat sets how vivid.'
        : 'A grayscale ramp from dark to light across the layers.';

  // --- color generation ---------------------------------------------------

  function generateColor(index: number, total: number): { h: number; s: number; l: number } {
    switch (colorMode) {
      case 'anchor': {
        // Deterministic fan around the anchor hue — smooth when the sliders move.
        const offset =
          total > 1 ? (index / (total - 1) - 0.5) * anchorSpread : 0;
        return {
          h: Math.round((anchorHue + offset + 360) % 360),
          s: Math.round(94 + (index % 3) * 2),
          l: Math.round(57 + (index % 3) * 4)
        };
      }
      case 'rainbow':
        return {
          h: Math.round(rnd(0, 360)),
          s: rainbowSat,
          l: Math.round(rnd(54, 68))
        };
      case 'mono':
        return {
          h: 0,
          s: 0,
          l: Math.round(52 + (index / Math.max(1, total - 1)) * 30)
        };
    }
  }

  function recolorLayers() {
    const count = layers.length;
    layers = layers.map((l, i) => {
      const c = generateColor(i, count);
      return { ...l, h: c.h, s: c.s, l: c.l };
    });
  }

  function applyColorMode(mode: ColorMode) {
    if (mode === colorMode) return;
    colorMode = mode;
    recolorLayers();
  }

  // In anchor mode, smoothly recolor as the hue / spread sliders move.
  $: if (
    colorMode === 'anchor' &&
    (anchorHue !== _prevHue || anchorSpread !== _prevSpread)
  ) {
    _prevHue = anchorHue;
    _prevSpread = anchorSpread;
    recolorLayers();
  }

  // In rainbow mode, the Sat slider retints every layer without re-rolling hues.
  $: if (colorMode === 'rainbow' && rainbowSat !== _prevRainbowSat) {
    _prevRainbowSat = rainbowSat;
    layers = layers.map((l) => ({ ...l, s: rainbowSat }));
  }

  // --- helpers ----------------------------------------------------------

  const rnd = (min: number, max: number) => min + Math.random() * (max - min);
  const round = (n: number, p = 3) => Math.round(n * 10 ** p) / 10 ** p;

  function randomLayer(index: number, total: number): Layer {
    const color = generateColor(index, total);
    return {
      sz: Math.round(rnd(320, 820)),
      ox: Math.round(rnd(-280, 280)),
      oy: Math.round(rnd(-240, 240)),
      a: round(rnd(0.25, 0.55), 2),
      ...color,
      fx: round(rnd(0.15, 0.45), 2),
      fy: round(rnd(0.15, 0.45), 2),
      ax: Math.round(rnd(80, 160)),
      ay: Math.round(rnd(80, 160)),
      ph: round(rnd(0, Math.PI * 2), 2),
      open: false
    };
  }

  function addLayer() {
    const total = layers.length + 1;
    layers = [...layers, { ...randomLayer(layers.length, total), open: true }];
  }

  function duplicateLayer(i: number) {
    const copy = {
      ...layers[i],
      ox: layers[i].ox + 40,
      oy: layers[i].oy + 40,
      ph: round(layers[i].ph + 1.1, 2),
      open: true
    };
    layers = [...layers.slice(0, i + 1), copy, ...layers.slice(i + 1)];
  }

  function removeLayer(i: number) {
    layers = layers.filter((_, idx) => idx !== i);
  }

  // --- reorder (drag & drop, plus keyboard) -------------------------------
  // Order is paint order (screen-blended), so restacking changes the mix. Each
  // layer has a grip handle; the whole card is a drop target.
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
  // The whole list is the drop target, so the cursor snaps to the nearest slot
  // even in the gaps between cards (dropping there used to cancel the move).
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

  function randomizeAll() {
    const count = Math.floor(rnd(3, 9)); // 3–8 blobs, like shuffle
    layers = Array.from({ length: count }, (_, i) => randomLayer(i, count));
  }

  // Shuffle re-rolls the color mode/hue, anchor, layer count, and every layer;
  // Reset restores the defaults.
  function shuffle() {
    const modes: ColorMode[] = ['anchor', 'rainbow', 'mono'];
    colorMode = modes[Math.floor(Math.random() * modes.length)];
    anchorHue = Math.round(rnd(0, 360));
    anchorSpread = Math.round(rnd(20, 160));
    rainbowSat = Math.round(rnd(70, 100));
    // keep the recolor watches from double-firing after this manual reroll
    _prevHue = anchorHue;
    _prevSpread = anchorSpread;
    _prevRainbowSat = rainbowSat;
    anchor = { x: round(rnd(0.2, 0.8), 2), y: round(rnd(0.15, 0.6), 2) };
    // A dark backdrop — the glow is screen-blended on top, so keep lightness very
    // low with only a subtle tint.
    bg = hslToHex(Math.round(rnd(0, 360)), Math.round(rnd(0, 40)), Math.round(rnd(4, 12)));
    const count = Math.floor(rnd(3, 9)); // 3–8 layers
    layers = Array.from({ length: count }, (_, i) => randomLayer(i, count));
  }
  function reset() {
    layers = INITIAL_LAYERS.map((l) => ({ ...l }));
    anchor = { ...INITIAL.anchor };
    intensity = { ...INITIAL.intensity };
    depth = INITIAL.depth;
    bg = INITIAL.bg;
    colorMode = INITIAL.colorMode;
    anchorHue = INITIAL.anchorHue;
    anchorSpread = INITIAL.anchorSpread;
    rainbowSat = INITIAL.rainbowSat;
    _prevHue = anchorHue;
    _prevSpread = anchorSpread;
    _prevRainbowSat = rainbowSat;
  }

  // --- intensity curve graph ---------------------------------------------
  // The curve function reads `intensity` from closure, but Svelte's compiler
  // only tracks top-level variable references inside $: blocks — it can't
  // see through function calls.  If `curveMax` doesn't change value (e.g.
  // header stays the max while you adjust middle), `curvePath` never
  // recomputes even though the curve shape changed.
  //
  // Fix: destructure `intensity` directly inside each reactive expression
  // so Svelte knows to invalidate them when any property moves.

  const smooth = (t: number) => t * t * (3 - 2 * t);

  $: curveMax = Math.max(1, intensity.header, intensity.middle, intensity.footer);

  $: curvePath = (() => {
    const { header: a, middle: m, footer: f } = intensity;
    const max = curveMax;
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const p = i / 60;
      const x = p * 100;
      const v = p < 0.5
        ? a + (m - a) * smooth(p / 0.5)
        : m + (f - m) * smooth((p - 0.5) / 0.5);
      const y = 36 - (v / max) * 32;
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  })();

  $: markerX = depth * 100;

  // Click (or drag) anywhere on the curve to scrub depth to that scroll position.
  function scrubDepth(e: PointerEvent) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    if (rect.width === 0) return;
    depth = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  }

  function onCurvePointerDown(e: PointerEvent) {
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    scrubDepth(e);
  }

  function onCurvePointerMove(e: PointerEvent) {
    if (e.buttons === 0) return;
    scrubDepth(e);
  }

  function onCurveKeyDown(e: KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.01;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') depth = Math.max(0, depth - step);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') depth = Math.min(1, depth + step);
    else if (e.key === 'Home') depth = 0;
    else if (e.key === 'End') depth = 1;
    else return;
    e.preventDefault();
  }

  $: markerY = (() => {
    const { header: a, middle: m, footer: f } = intensity;
    const v = depth < 0.5
      ? a + (m - a) * smooth(depth / 0.5)
      : m + (f - m) * smooth((depth - 0.5) / 0.5);
    return 36 - (v / curveMax) * 32;
  })();

  // --- config export ------------------------------------------------------

  function snippet() {
    const layerLines = layers
      .map(
        (l) =>
          `    { sz: ${round(l.sz)}, ox: ${round(l.ox)}, oy: ${round(l.oy)}, a: ${round(l.a)}, h: ${round(l.h)}, s: ${round(l.s)}, l: ${round(l.l)}, fx: ${round(l.fx)}, fy: ${round(l.fy)}, ax: ${round(l.ax)}, ay: ${round(l.ay)}, ph: ${round(l.ph)} }`
      )
      .join(',\n');
    return `<Glowfield
  layers={[
${layerLines}
  ]}
  anchor={{ x: ${round(anchor.x)}, y: ${round(anchor.y)} }}
  intensity={{ header: ${round(intensity.header)}, middle: ${round(intensity.middle)}, footer: ${round(intensity.footer)} }}
/>`;
  }

  $: configText = (void [layers, anchor, intensity], snippet());

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(configText);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1600);
    } catch {
      // Clipboard unavailable.
    }
  }

  // --- shareable scene code (compact base36 token) ------------------------
  const CM: ColorMode[] = ['anchor', 'rainbow', 'mono'];

  function encodeState(): string {
    const g = [
      n36(Math.max(0, CM.indexOf(colorMode))),
      n36(anchorHue), n36(anchorSpread), n36(rainbowSat),
      n36(anchor.x, 1000), n36(anchor.y, 1000),
      n36(intensity.header, 1000), n36(intensity.middle, 1000), n36(intensity.footer, 1000),
      n36(depth, 1000),
      bg.replace(/^#/, '')
    ].join('.');
    const ls = layers
      .map((l) =>
        [
          n36(l.sz), n36(l.ox), n36(l.oy), n36(l.a, 1000), n36(l.h), n36(l.s), n36(l.l),
          n36(l.fx, 1000), n36(l.fy, 1000), n36(l.ax), n36(l.ay), n36(l.ph, 1000)
        ].join('.')
      )
      .join('_');
    return `g1~${g}~${ls}`;
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 'g1' || parts.length < 3) return;
      const g = parts[1].split('.');
      colorMode = CM[p36(g[0])] ?? colorMode;
      anchorHue = p36(g[1], 1, anchorHue);
      anchorSpread = p36(g[2], 1, anchorSpread);
      rainbowSat = p36(g[3], 1, rainbowSat);
      anchor = { x: p36(g[4], 1000, anchor.x), y: p36(g[5], 1000, anchor.y) };
      intensity = {
        header: p36(g[6], 1000, intensity.header),
        middle: p36(g[7], 1000, intensity.middle),
        footer: p36(g[8], 1000, intensity.footer)
      };
      depth = p36(g[9], 1000, depth);
      if (g[10]) bg = `#${g[10]}`;
      const rows = (parts[2] ? parts[2].split('_') : [])
        .map((s) => s.split('.'))
        .filter((a) => a.length >= 12);
      if (rows.length) {
        layers = rows.map((a) => ({
          sz: p36(a[0]), ox: p36(a[1]), oy: p36(a[2]), a: p36(a[3], 1000),
          h: p36(a[4]), s: p36(a[5]), l: p36(a[6]),
          fx: p36(a[7], 1000), fy: p36(a[8], 1000), ax: p36(a[9]), ay: p36(a[10]), ph: p36(a[11], 1000),
          open: false
        }));
      }
      // Keep the recolor watchers from firing on the freshly loaded values.
      _prevHue = anchorHue;
      _prevSpread = anchorSpread;
      _prevRainbowSat = rainbowSat;
    } catch {
      // Malformed token — keep current scene.
    }
  }

  // --- saved scenes -------------------------------------------------------
  function applyScene(token: string) {
    decodeState(token);
  }
  $: sceneLabel = `${colorMode} · ${layers.length} layer${layers.length === 1 ? '' : 's'}`;

  const intensityAt = (p: number) =>
    p < 0.5
      ? intensity.header + (intensity.middle - intensity.header) * smooth(p / 0.5)
      : intensity.middle + (intensity.footer - intensity.middle) * smooth((p - 0.5) / 0.5);

  // Glowfield is DOM gradients (no canvas), so the thumbnail, PNG and video are
  // synthesized by painting the layers onto a canvas at the given size. `e` is
  // the elapsed seconds of drift (0 = the static rest layout used by the PNG);
  // the video passes an advancing `e` to reproduce the live wander (same formula
  // as the renderer's `place()`).
  function renderGlow(cx: CanvasRenderingContext2D, W: number, H: number, e = 0) {
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = bg;
    cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'screen';
    const v = Math.max(0, intensityAt(depth));
    for (const l of layers) {
      const r = Math.max(1, l.sz / 2);
      let dx = 0;
      let dy = 0;
      if (e) {
        dx = (Math.sin(e * l.fx + l.ph) + 0.6 * Math.sin(e * l.fx * 1.73 + l.ph * 1.3)) * l.ax;
        dy = (Math.cos(e * l.fy + l.ph) + 0.6 * Math.cos(e * l.fy * 1.91 + l.ph * 0.7)) * l.ay;
      }
      const px = anchor.x * W + l.ox + dx;
      const py = anchor.y * H + l.oy + dy;
      const g = cx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `hsla(${l.h}, ${l.s}%, ${l.l}%, ${(l.a * v).toFixed(3)})`);
      g.addColorStop(0.68, `hsla(${l.h}, ${l.s}%, ${l.l}%, 0)`);
      cx.fillStyle = g;
      cx.beginPath();
      cx.arc(px, py, r, 0, Math.PI * 2);
      cx.fill();
    }
  }
  function paintGlow(W: number, H: number): HTMLCanvasElement | null {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const cx = c.getContext('2d');
    if (!cx) return null;
    renderGlow(cx, W, H);
    return c;
  }
  const viewportSize = () => ({
    W: Math.max(1, Math.round(window.innerWidth)),
    H: Math.max(1, Math.round(window.innerHeight))
  });
  function glowThumb(): string | null {
    const { W, H } = viewportSize();
    const src = paintGlow(W, H);
    if (!src) return null;
    const maxDim = 160;
    const scale = Math.min(1, maxDim / Math.max(W, H));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(W * scale));
    c.height = Math.max(1, Math.round(H * scale));
    const cx = c.getContext('2d');
    if (!cx) return null;
    cx.drawImage(src, 0, 0, c.width, c.height);
    try {
      return c.toDataURL('image/jpeg', 0.72);
    } catch {
      return null;
    }
  }
  function savePng() {
    const { W, H } = viewportSize();
    const src = paintGlow(W, H);
    if (!src) return;
    src.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `glowfield-${String(Date.now()).slice(-6)}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // --- video capture ------------------------------------------------------
  const CLIP_FPS = 30;
  let videoSeconds = 6;
  let recording = false;
  let recordPct = 0;
  let videoErr = false;

  async function saveVideo() {
    if (recording) return;
    recording = true;
    recordPct = 0;
    videoErr = false;
    try {
      await recordViewportClip({
        seconds: videoSeconds,
        fps: CLIP_FPS,
        filename: `glowfield-${String(Date.now()).slice(-6)}`,
        draw: (ctx, i, W, H) => renderGlow(ctx, W, H, i / CLIP_FPS),
        onProgress: (f) => (recordPct = Math.round(f * 100))
      });
    } catch (e) {
      console.error('video export failed', e);
      videoErr = true;
      setTimeout(() => (videoErr = false), 2500);
    } finally {
      recording = false;
    }
  }

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });
</script>

<Metatags
  title="Glowfield"
  description="Background ambient light generator"
  ogMessage="Glowfield"
/>

<PlaygroundShell
  title="Glowfield"
  subtitle="Background ambient light generator"
  {bg}
  onShuffle={shuffle}
  onReset={reset}
  onSavePng={savePng}
  onSaveVideo={saveVideo}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Scene">
    <p class="hint">Where the field anchors and how the glow is initially colored.</p>
    <Slider label="Anchor X" bind:value={anchor.x} min={0} max={1} step={0.01} />
    <Slider label="Anchor Y" bind:value={anchor.y} min={0} max={1} step={0.01} />
    <label class="color-row">
      <span class="lab">Backdrop</span>
      <input type="color" bind:value={bg} />
      <span class="val">{bg}</span>
    </label>

    <div class="mode-row">
      <span class="lab">Color</span>
      <div class="mode-btns">
        <button class="mode-btn" class:active={colorMode === 'anchor'} on:click={() => applyColorMode('anchor')}>Anchor</button>
        <button class="mode-btn" class:active={colorMode === 'rainbow'} on:click={() => applyColorMode('rainbow')}>Rainbow</button>
        <button class="mode-btn" class:active={colorMode === 'mono'} on:click={() => applyColorMode('mono')}>B/W</button>
      </div>
    </div>
    <p class="hint">{paletteHint}</p>

    {#if colorMode === 'anchor'}
      <div class="hue-row">
        <span class="hue-swatch" style="background: hsl({anchorHue}, 100%, 60%);"></span>
        <Slider label="Hue" bind:value={anchorHue} min={0} max={360} step={1} />
      </div>
      <Slider label="Spread" bind:value={anchorSpread} min={0} max={360} step={1} unit="°" />
    {:else if colorMode === 'rainbow'}
      <Slider label="Sat" bind:value={rainbowSat} min={0} max={100} step={1} unit="%" />
    {/if}
    <p class="hint">Any layer can still be recolored in Layers.</p>
  </Section>

  <Section title={`Layers (${layers.length})`}>
    <div slot="actions" class="group-actions">
      <button class="btn" on:click|preventDefault|stopPropagation={addLayer}>Add</button>
      <button class="btn" on:click|preventDefault|stopPropagation={randomizeAll}>Randomize</button>
    </div>
    <p class="hint">Each layer is a soft blob of light. Stack and drift them for depth.</p>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="reorder-list" on:dragover={onListDragOver} on:drop={onListDrop}>
    {#each layers as layer, i (layer)}
      <!-- Delete sits outside <summary> to avoid nested-interactive; it's
        overlaid on the header row and stays visible when the layer collapses. -->
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
            aria-label="Reorder layer {i + 1} of {layers.length}"
            on:click|preventDefault|stopPropagation
            on:dragstart={(e) => onDragStart(e, i)}
            on:keydown={(e) => onHandleKey(e, i)}
          >⠿</button>
          <span
            class="swatch"
            style="background: radial-gradient(circle, hsl({layer.h}, {layer.s}%, {layer.l}%) 0%, transparent 72%);"
          ></span>
          <span class="layer-name">Layer {i + 1}</span>
          <span class="layer-meta">{layer.sz}px · h{Math.round(layer.h)}</span>
        </summary>

        <div class="layer-body">
          <h3>Shape</h3>
          <Slider label="Size" bind:value={layer.sz} min={100} max={1200} step={1} unit="px" />
          <Slider label="Offset X" bind:value={layer.ox} min={-600} max={600} step={1} unit="px" />
          <Slider label="Offset Y" bind:value={layer.oy} min={-600} max={600} step={1} unit="px" />
          <Slider label="Weight" bind:value={layer.a} min={0} max={1} step={0.01} />

          <h3>Color</h3>
          <Slider label="Hue" bind:value={layer.h} min={0} max={360} step={1} />
          <Slider label="Sat" bind:value={layer.s} min={0} max={100} step={1} unit="%" />
          <Slider label="Light" bind:value={layer.l} min={20} max={90} step={1} unit="%" />

          <h3>Drift</h3>
          <Slider label="Freq X" bind:value={layer.fx} min={0.05} max={1} step={0.01} />
          <Slider label="Freq Y" bind:value={layer.fy} min={0.05} max={1} step={0.01} />
          <Slider label="Amp X" bind:value={layer.ax} min={0} max={300} step={1} unit="px" />
          <Slider label="Amp Y" bind:value={layer.ay} min={0} max={300} step={1} unit="px" />
          <Slider label="Phase" bind:value={layer.ph} min={0} max={6.28} step={0.01} />

          <div class="layer-actions">
            <button class="btn" on:click={() => duplicateLayer(i)}>Duplicate</button>
          </div>
        </div>
      </details>
        <button
          class="layer-delete"
          title="Delete layer {i + 1}"
          aria-label="Delete layer {i + 1}"
          disabled={layers.length <= 1}
          on:click|preventDefault|stopPropagation={() => removeLayer(i)}
        >×</button>
      </div>
    {/each}
    </div>
  </Section>

  <Section title="Scroll intensity" open={false}>
    <p class="hint">Depth simulates page scroll: 0 is the header, 1 is the footer.</p>
    <p class="hint">Other sliders control opacity.</p>
    <svg
      class="curve"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="slider"
      tabindex="0"
      aria-label="Scroll depth"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={depth}
      on:pointerdown={onCurvePointerDown}
      on:pointermove={onCurvePointerMove}
      on:keydown={onCurveKeyDown}>
      <line x1="0" y1="36" x2="100" y2="36" class="axis" />
      <path d={curvePath} class="trace" />
      <line x1={markerX} y1="4" x2={markerX} y2="36" class="cursor" />
      <circle cx={markerX} cy={markerY} r="2.4" class="dot" />
    </svg>
    <Slider label="Depth" bind:value={depth} min={0} max={1} step={0.001} />
    <Slider label="Header" bind:value={intensity.header} min={0} max={1.2} step={0.01} />
    <Slider label="Middle" bind:value={intensity.middle} min={0} max={1.2} step={0.01} />
    <Slider label="Footer" bind:value={intensity.footer} min={0} max={1.2} step={0.01} />
  </Section>

  <SavedScenes
    bind:this={savedScenes}
    slot="saved"
    store={presets}
    encode={encodeState}
    apply={applyScene}
    snapshot={glowThumb}
    {savePng}
    {saveVideo}
    videoLabel={recording ? `Rec ${recordPct}%` : videoErr ? 'No video' : 'Video (V)'}
    videoBusy={recording}
    bind:videoSeconds
    label={sceneLabel}
  >
    {#if dev}
      <div class="code-block">
        <div class="code-head">
          <span class="hint">Code to reproduce this field</span>
          <button class="btn" on:click={copyConfig}>{copied ? 'Copied' : 'Copy code'}</button>
        </div>
        <pre class="config">{configText}</pre>
      </div>
    {/if}
  </SavedScenes>

  <svelte:fragment slot="footer">
    <button class="btn" on:click={shuffle}>Shuffle (F)</button>
    <button class="btn" on:click={reset}>Reset (R)</button>
  </svelte:fragment>

  <main slot="preview" class="preview" style="background: {bg};">
    <Glowfield
      {layers}
      {anchor}
      {intensity}
      contained={true}
      progressOverride={depth}
    />
    <div class="preview-frame">
      <span>depth {depth.toFixed(2)}</span>
    </div>
  </main>
</PlaygroundShell>

<style>
  /* Glowfield-specific bits; shared sidebar styling lives in PlaygroundShell. */

  /* --- intensity curve --------------------------------------------------- */

  .curve {
    width: 100%;
    height: 64px;
    display: block;
    background: #101016;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    cursor: pointer;
    touch-action: none;
  }
  .curve:focus-visible {
    outline: 2px solid var(--pg-accent, #6ea8fe);
    outline-offset: 2px;
  }
  .curve .axis {
    stroke: var(--pg-line);
    stroke-width: 0.6;
  }
  .curve .trace {
    fill: none;
    stroke: var(--pg-accent);
    stroke-width: 1.4;
    vector-effect: non-scaling-stroke;
  }
  .curve .cursor {
    stroke: var(--pg-dim);
    stroke-width: 0.5;
    stroke-dasharray: 2 2;
  }
  .curve .dot {
    fill: var(--pg-accent);
  }

  /* --- layers ------------------------------------------------------------ */

  /* The list is one drop target so drags snap to the nearest slot; it also
     owns the spacing the card-body flex gap used to provide. */
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
    width: 18px;
    height: 18px;
    border-radius: 50%;
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

  .config {
    margin: 0;
    padding: 0.6rem;
    font-size: 0.62rem;
    line-height: 1.55;
    color: var(--pg-dim);
    background: #101016;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre;
    max-height: 220px;
  }
  .code-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--pg-line);
  }
  .code-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
</style>
