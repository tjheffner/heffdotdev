<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Applique from '$lib/components/playground/Applique.svelte';
  import type { CutLayer, CutMode } from '$lib/components/playground/Applique.svelte';
  import CurvePad from '$lib/components/playground/CurvePad.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { createHistory } from '$lib/playground/history';
  import { moveInArray, dropIndexAt } from '$lib/playground/reorder';
  import { hslToHex } from '$lib/playground/color';
  import { n36, p36 } from '$lib/playground/token';
  import { packPath, unpackPath } from '$lib/playground/path';
  import { rand, randInt, round } from '$lib/playground/math';

  const presets = createPresetStore('applique');
  let savedScenes: SavedScenes;
  let renderer: Applique;

  const TAU = Math.PI * 2;
  const MODES: CutMode[] = ['shape', 'ground'];
  const MODE_LABELS: Record<CutMode, string> = { shape: 'Shape', ground: 'Ground' };

  function sampled(fn: (t: number) => [number, number], n = 72): number[] {
    const pts: number[] = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = fn(i / (n - 1));
      pts.push(round(x, 3), round(y, 3));
    }
    return pts;
  }
  // A gently waving horizon: a sky band edge.
  const band = (y: number, amp = 0.03, freq = 1.2, ph = 0) =>
    sampled((t) => [2 * t - 1, y + amp * Math.sin(TAU * freq * t + ph)], 24);
  // A skyline of sharp peaks: tent-shaped bumps [center 0..1, height, width]
  // over a baseline, roughened with a little fixed ripple.
  const ridge = (base: number, peaks: number[][]) =>
    sampled((t) => {
      let y = base + 0.012 * Math.sin(t * 61) + 0.008 * Math.sin(t * 137);
      for (const [c, hgt, wd] of peaks) y -= hgt * Math.exp(-Math.abs(t - c) / wd);
      return [2 * t - 1, y];
    });
  const circle = (x: number, y: number, r: number) =>
    sampled((t) => [x + r * Math.cos(TAU * t), y + r * Math.sin(TAU * t)], 48);

  const cut = (mode: CutMode, color: string, path: number[][], width = 1): CutLayer => ({
    mode, color, path, width, size: 1, ox: 0, oy: 0, open: false
  });

  // Defaults, shared by initial state and Reset: sky bands, a low sun, then
  // ridges stepping darker toward the viewer.
  const INITIAL_LAYERS: CutLayer[] = [
    cut('ground', '#8a2f86', [band(-0.62, 0.03, 0.8, 1)], 2.4),
    cut('ground', '#d43c6c', [band(-0.38, 0.035, 1.1, 2.5)], 2.4),
    cut('ground', '#f36d3c', [band(-0.14, 0.03, 0.9, 4)], 2.4),
    cut('ground', '#ffad45', [band(0.08, 0.025, 1.3, 0.5)], 2.4),
    cut('shape', '#ffe6a3', [circle(-0.28, 0.1, 0.3)]),
    cut('ground', '#c0467f', [ridge(0.32, [[0.12, 0.42, 0.11], [0.43, 0.6, 0.09], [0.78, 0.38, 0.14]])], 2.4),
    cut('ground', '#83306f', [ridge(0.5, [[0.04, 0.34, 0.1], [0.3, 0.5, 0.07], [0.62, 0.3, 0.12], [0.92, 0.46, 0.09]])], 2.4),
    cut('ground', '#4d1f5b', [ridge(0.7, [[0.2, 0.36, 0.12], [0.55, 0.24, 0.15], [0.86, 0.4, 0.08]])], 2.4),
    cut('ground', '#230f36', [ridge(0.9, [[0.1, 0.16, 0.2], [0.7, 0.22, 0.17]])], 2.4)
  ];
  const DEFAULTS = {
    bg: '#3a1a5e',
    shadowAngle: 250,
    shadowDist: 12,
    shadowSoft: 0,
    shadowColor: '#12061f',
    shadowAlpha: 0.55,
    zoom: 1
  };

  const cloneLayers = (ls: CutLayer[]) =>
    ls.map((l) => ({ ...l, path: l.path.map((s) => s.slice()) }));

  let layers: CutLayer[] = cloneLayers(INITIAL_LAYERS);
  let bg = DEFAULTS.bg;
  let shadowAngle = DEFAULTS.shadowAngle;
  let shadowDist = DEFAULTS.shadowDist;
  let shadowSoft = DEFAULTS.shadowSoft;
  let shadowColor = DEFAULTS.shadowColor;
  let shadowAlpha = DEFAULTS.shadowAlpha;
  let zoom = DEFAULTS.zoom;

  // Flip the overlay chrome against the pixels under it, one sample per frame.
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

  function randomRidge(base: number) {
    return ridge(
      base,
      Array.from({ length: randInt(2, 5) }, () => [rand(0, 1), rand(0.12, 0.55), rand(0.05, 0.16)])
    );
  }
  const randomPath = (mode: CutMode) =>
    mode === 'ground' ? [randomRidge(rand(0.2, 0.8))] : [circle(rand(-0.5, 0.5), rand(-0.5, 0.3), rand(0.12, 0.35))];

  // Shuffle builds a fresh sunset: hues sweep from a cool zenith through
  // magenta to a warm horizon, then ridges darken toward the viewer.
  function randomScene() {
    const h0 = rand(220, 300);
    const span = (rand(20, 70) + 360 - h0) % 360;
    const hue = (t: number) => (h0 + span * t) % 360;
    bg = hslToHex(h0, randInt(45, 70), randInt(14, 24));
    const out: CutLayer[] = [];
    const bands = randInt(2, 5);
    for (let i = 0; i < bands; i++) {
      const t = (i + 1) / bands;
      const y = -0.7 + t * 0.75;
      out.push(cut('ground', hslToHex(hue(t), randInt(70, 92), 30 + t * 32), [band(y, rand(0, 0.05), rand(0.5, 1.6), rand(0, TAU))], 2.4));
    }
    out.push(cut('shape', hslToHex(hue(1), 95, randInt(76, 88)), [circle(rand(-0.5, 0.5), rand(-0.2, 0.15), rand(0.15, 0.35))]));
    const ridges = randInt(3, 5);
    for (let i = 0; i < ridges; i++) {
      const t = i / (ridges - 1);
      out.push(cut('ground', hslToHex(h0 + rand(-25, 40), randInt(35, 60), 46 - t * 36), [randomRidge(0.3 + t * 0.6)], 2.4));
    }
    layers = out;
    shadowAngle = randInt(220, 320);
    shadowDist = randInt(6, 18);
  }

  function addLayer() {
    layers = [...layers, { ...cut('shape', hslToHex(randInt(0, 360), 85, 60), randomPath('shape')), open: true }];
  }
  function duplicateLayer(i: number) {
    const src = layers[i];
    const copy = { ...src, path: src.path.map((s) => s.slice()), ox: src.ox + 30, oy: src.oy + 30, open: true };
    layers = [...layers.slice(0, i + 1), copy, ...layers.slice(i + 1)];
  }
  function removeLayer(i: number) {
    layers = layers.filter((_, idx) => idx !== i);
  }
  function undoStroke(i: number) {
    layers[i].path = layers[i].path.slice(0, -1);
  }
  function clearStrokes(i: number) {
    layers[i].path = [];
  }
  function rerollPath(i: number) {
    layers[i].path = randomPath(layers[i].mode);
  }

  // Order is paint order: later layers sit in front and shade the ones behind.
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
    if (dragIndex !== null && overIndex !== null) layers = moveInArray(layers, dragIndex, overIndex);
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

  function shuffle() {
    randomScene();
  }
  function reset() {
    layers = cloneLayers(INITIAL_LAYERS);
    bg = DEFAULTS.bg;
    shadowAngle = DEFAULTS.shadowAngle;
    shadowDist = DEFAULTS.shadowDist;
    shadowSoft = DEFAULTS.shadowSoft;
    shadowColor = DEFAULTS.shadowColor;
    shadowAlpha = DEFAULTS.shadowAlpha;
    zoom = DEFAULTS.zoom;
    renderer?.recenter();
  }

  function encodeState(): string {
    const g = [
      n36(zoom, 100),
      n36(shadowAngle),
      n36(shadowDist, 10),
      n36(shadowSoft, 10),
      n36(shadowAlpha, 1000),
      shadowColor.replace(/^#/, ''),
      bg.replace(/^#/, '')
    ].join('.');
    const ls = layers
      .map((l) =>
        [
          n36(MODES.indexOf(l.mode)), n36(l.size, 1000), n36(l.width, 100),
          n36(l.ox), n36(l.oy), l.color.replace(/^#/, ''), packPath(l.path)
        ].join('.')
      )
      .join('_');
    return `a1~${g}~${ls}`;
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 'a1' || parts.length < 3) return;
      const g = parts[1].split('.');
      zoom = p36(g[0], 100, zoom);
      shadowAngle = p36(g[1], 1, shadowAngle);
      shadowDist = p36(g[2], 10, shadowDist);
      shadowSoft = p36(g[3], 10, shadowSoft);
      shadowAlpha = p36(g[4], 1000, shadowAlpha);
      if (g[5]) shadowColor = `#${g[5]}`;
      if (g[6]) bg = `#${g[6]}`;
      const rows = (parts[2] ? parts[2].split('_') : []).map((s) => s.split('.')).filter((a) => a.length >= 7);
      if (rows.length) {
        layers = rows.map((a) => ({
          mode: MODES[p36(a[0])] ?? 'shape',
          size: p36(a[1], 1000, 1),
          width: p36(a[2], 100, 1),
          ox: p36(a[3]),
          oy: p36(a[4]),
          color: a[5] ? `#${a[5]}` : '#ffffff',
          path: unpackPath(a[6] ?? ''),
          open: false
        }));
      }
    } catch {
      // Malformed token, keep the current scene.
    }
  }

  function shortId(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }
  function savePng() {
    renderer?.saveImage(`applique-${shortId(encodeState())}.png`);
  }
  function applyScene(token: string) {
    decodeState(token);
    renderer?.recenter();
  }
  const sceneSnapshot = () => renderer?.snapshot(bg) ?? null;
  $: sceneLabel = `${layers.length} layer${layers.length === 1 ? '' : 's'}`;

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });

  const history = createHistory('applique');
  $: (void [zoom, shadowAngle, shadowDist, shadowSoft, shadowColor, shadowAlpha, bg, layers], history.touch(encodeState));
  function undoScene() {
    const tok = history.undo(encodeState());
    if (tok) applyScene(tok);
  }
</script>

<Metatags
  title="Applique"
  description="Layered paper cut-outs from shapes you draw yourself."
  ogMessage="Applique"
/>

<PlaygroundShell
  title="Applique"
  subtitle="Cut-paper layers: draw a shape or a skyline on each layer's pad and stack them with hard shadows. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onUndo={undoScene}
  onSavePng={savePng}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Scene">
    <label class="color-row">
      <span class="lab">Backdrop</span>
      <input type="color" bind:value={bg} />
      <span class="val">{bg}</span>
    </label>
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
  </Section>

  <Section title="Shadow">
    <p class="hint">One light for every layer. Each cut-out shades the ones behind it.</p>
    <Slider label="Direction" bind:value={shadowAngle} min={0} max={360} step={1} unit="°" />
    <Slider label="Distance" bind:value={shadowDist} min={0} max={60} step={0.5} unit="px" />
    <Slider label="Softness" bind:value={shadowSoft} min={0} max={40} step={0.5} unit="px" />
    <Slider label="Opacity" bind:value={shadowAlpha} min={0} max={1} step={0.01} />
    <label class="color-row">
      <span class="lab">Color</span>
      <input type="color" bind:value={shadowColor} />
      <span class="val">{shadowColor}</span>
    </label>
  </Section>

  <Section title={`Layers (${layers.length})`}>
    <div slot="actions" class="group-actions">
      <button class="btn" on:click|preventDefault|stopPropagation={addLayer}>Add</button>
    </div>
    <p class="hint">Top of the list is furthest back. Drag to restack.</p>
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
                aria-label="Reorder layer {i + 1} of {layers.length}"
                on:click|preventDefault|stopPropagation
                on:dragstart={(e) => onDragStart(e, i)}
                on:keydown={(e) => onHandleKey(e, i)}
              >⠿</button>
              <span class="swatch" style="background: {layer.color};"></span>
              <span class="layer-name">Layer {i + 1}</span>
              <span class="layer-meta">{MODE_LABELS[layer.mode]}</span>
            </summary>

            <div class="layer-body">
              <div class="mode-row">
                <span class="lab">Fill</span>
                <div class="mode-btns">
                  {#each MODES as m}
                    <button class="mode-btn" class:active={layer.mode === m} on:click={() => (layer.mode = m)}>
                      {MODE_LABELS[m]}
                    </button>
                  {/each}
                </div>
              </div>
              <p class="hint">
                {layer.mode === 'ground'
                  ? 'Each stroke is a skyline: its ends run out flat and everything below fills in.'
                  : 'Each stroke closes into a cut-out shape.'}
              </p>
              <CurvePad bind:path={layer.path} color={layer.color} paper={bg} label="Drawing pad for layer {i + 1}" />
              <div class="pad-actions">
                <button class="btn" disabled={!layer.path.length} on:click={() => undoStroke(i)}>Undo</button>
                <button class="btn" disabled={!layer.path.length} on:click={() => clearStrokes(i)}>Clear</button>
                <button class="btn" on:click={() => rerollPath(i)}>Random</button>
              </div>
              <label class="color-row">
                <span class="lab">Color</span>
                <input type="color" bind:value={layer.color} />
                <span class="val">{layer.color}</span>
              </label>
              <Slider label="Size" bind:value={layer.size} min={0.1} max={2} step={0.01} />
              <Slider label="Width" bind:value={layer.width} min={0.25} max={4} step={0.01} unit="×" />
              <Slider label="Offset X" bind:value={layer.ox} min={-800} max={800} step={1} unit="px" />
              <Slider label="Offset Y" bind:value={layer.oy} min={-800} max={800} step={1} unit="px" />
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
    <Applique
      bind:this={renderer}
      {bg}
      {layers}
      {shadowAngle}
      {shadowDist}
      {shadowSoft}
      {shadowColor}
      {shadowAlpha}
      onRendered={onCanvasRendered}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Applique-specific bits; shared sidebar styling lives in PlaygroundShell. */

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
    border: 1px solid var(--hz-color-border);
    border-radius: 6px;
    background: #14141a;
    transition: border-color 120ms ease, opacity 120ms ease;
  }
  .layer.dragging {
    opacity: 0.4;
  }
  .layer.drop-target {
    border-color: var(--hz-intent-primary);
  }
  .drag-handle {
    flex: none;
    width: 16px;
    margin: -0.2rem 0 -0.2rem -0.2rem;
    padding: 0.2rem 0;
    font: inherit;
    font-size: 0.8rem;
    line-height: 1;
    color: var(--hz-color-text-muted);
    background: transparent;
    border: none;
    cursor: grab;
    touch-action: none;
  }
  .drag-handle:hover {
    color: var(--hz-color-text);
  }
  .drag-handle:active {
    cursor: grabbing;
  }
  .drag-handle:focus-visible {
    outline: 2px solid var(--hz-intent-primary);
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
    outline: 2px solid var(--hz-intent-primary);
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
    color: var(--hz-color-text-muted);
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
    color: var(--hz-color-text-muted);
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
    outline: 2px solid var(--hz-intent-primary);
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
    border-top: 1px solid var(--hz-color-border);
  }
  .layer-actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
</style>
