<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { moveInArray } from '$lib/playground/reorder';
  import Kaleidoscope, {
    KALE_SHAPES
  } from '$lib/components/playground/Kaleidoscope.svelte';
  import type {
    KaleColorMode,
    KaleMode,
    KaleShape,
    KaleItem
  } from '$lib/components/playground/Kaleidoscope.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { n36, p36, packHex, unpackHex } from '$lib/playground/token';
  import { rand, randInt, pick, round } from '$lib/playground/math';
  import { hslToHex } from '$lib/playground/color';
  import { paletteColor, randomHex } from '$lib/playground/palette';

  const presets = createPresetStore('kaleidoscope');

  // --- palette (drives item colors) ---------------------------------------
  const paletteHex = (t: number) => {
    const c = paletteColor(colorMode, { hue, hueSpread, sat, light, customColors }, t);
    return hslToHex(c.h, c.s, c.l);
  };
  // Even spread across the current item count, so a palette lays out cleanly.
  const spreadT = (i: number, total: number) => (total > 1 ? i / (total - 1) : 0.5);

  // --- item factory -------------------------------------------------------
  function makeItem(i: number, total: number): KaleItem {
    return {
      shape: pick(KALE_SHAPES),
      u: round(Math.random(), 3),
      v: round(Math.random(), 3),
      size: round(0.08 + Math.random() * 0.12, 3),
      color: paletteHex(spreadT(i, total)),
      rotate: randInt(0, 360),
      skew: rand(-0.6, 0.6),
      warp: rand(0, 0.6),
      twist: rand(-0.5, 0.5),
      seed: randInt(1, 46655), // 36^3 - 1 → a 3-char base36 seed; plenty of jitter variety
      open: false
    };
  }

  // A hand-tuned starting bouquet, so the default scene reads well immediately.
  const DEFAULT_ITEMS: KaleItem[] = [
    { shape: 'star', u: 0.15, v: 0.72, size: 0.14, color: '#c56bff', rotate: 18, skew: 0.12, warp: 0.18, twist: 0.1, seed: 101, open: false },
    { shape: 'circle', u: 0.5, v: 0.9, size: 0.1, color: '#ff5db1', rotate: 0, skew: 0, warp: 0.05, twist: 0, seed: 202, open: false },
    { shape: 'wave', u: 0.78, v: 0.6, size: 0.16, color: '#4fd6e6', rotate: 120, skew: 0.2, warp: 0.1, twist: -0.2, seed: 303, open: false },
    { shape: 'triangle', u: 0.3, v: 0.45, size: 0.12, color: '#6c8cff', rotate: 200, skew: -0.1, warp: 0.2, twist: 0.15, seed: 404, open: false },
    { shape: 'burst', u: 0.62, v: 0.3, size: 0.1, color: '#ffd23f', rotate: 40, skew: 0, warp: 0.15, twist: 0, seed: 505, open: false },
    { shape: 'hexagon', u: 0.45, v: 0.58, size: 0.09, color: '#3bceac', rotate: 15, skew: 0.15, warp: 0, twist: 0.1, seed: 606, open: false },
    { shape: 'diamond', u: 0.22, v: 0.25, size: 0.08, color: '#ff8a5c', rotate: 60, skew: 0.1, warp: 0.1, twist: -0.1, seed: 707, open: false }
  ];
  const cloneItems = (arr: KaleItem[]) => arr.map((it) => ({ ...it }));

  // --- defaults -----------------------------------------------------------
  const DEFAULTS = {
    bg: '#0a0a12',
    transparent: false,
    hue: 280,
    hueSpread: 160,
    sat: 74,
    light: 56,
    colorMode: 'spectrum' as KaleColorMode,
    customColors: ['#ff6b35', '#ffd23f', '#3bceac', '#0ead69', '#540d6e'],
    stroke: 0,
    outlineColor: '#000000',
    strokeMatch: true,
    mode: 'radial' as KaleMode,
    segments: 8,
    spin: 0.12, // a slow default drift so the scene reads as alive on load
    animate: 0,
    zoom: 1
  };

  // --- state --------------------------------------------------------------
  let bg = DEFAULTS.bg;
  let transparent = DEFAULTS.transparent;
  let hue = DEFAULTS.hue;
  let hueSpread = DEFAULTS.hueSpread;
  let sat = DEFAULTS.sat;
  let light = DEFAULTS.light;
  let colorMode: KaleColorMode = DEFAULTS.colorMode;
  let customColors = [...DEFAULTS.customColors];
  let stroke = DEFAULTS.stroke;
  let outlineColor = DEFAULTS.outlineColor;
  let strokeMatch = DEFAULTS.strokeMatch;
  let mode: KaleMode = DEFAULTS.mode;
  let segments = DEFAULTS.segments;
  let spin = DEFAULTS.spin;
  let animate = DEFAULTS.animate;
  let zoom = DEFAULTS.zoom;
  let items: KaleItem[] = cloneItems(DEFAULT_ITEMS);

  let renderer: Kaleidoscope;
  let savedScenes: SavedScenes;

  // Position sliders mean different things per mode; label them so.
  $: posULabel = mode === 'radial' ? 'Angle' : 'X';
  $: posVLabel = mode === 'radial' ? 'Radius' : 'Y';

  // --- item list edits ----------------------------------------------------
  function addItem() {
    items = [...items, { ...makeItem(items.length, items.length + 1), open: true }];
  }
  function removeItem(i: number) {
    items = items.filter((_, idx) => idx !== i);
  }

  // --- reorder (drag & drop, plus keyboard) -------------------------------
  // Order is draw order, so reordering restacks the shapes. Each item carries a
  // grip handle; the whole card is a drop target.
  let dragIndex: number | null = null;
  let overIndex: number | null = null;
  let handleEls: HTMLButtonElement[] = [];

  function onDragStart(e: DragEvent, i: number) {
    dragIndex = i;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
      const card = (e.currentTarget as HTMLElement).closest('.item');
      if (card) e.dataTransfer.setDragImage(card, 16, 16);
    }
  }
  function onDragOver(e: DragEvent, i: number) {
    if (dragIndex === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    overIndex = i;
  }
  function onDrop(i: number) {
    if (dragIndex !== null) items = moveInArray(items, dragIndex, i);
    dragIndex = null;
    overIndex = null;
  }
  function onDragEnd() {
    dragIndex = null;
    overIndex = null;
  }
  async function onHandleKey(e: KeyboardEvent, i: number) {
    const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : i;
    if (to === i || to < 0 || to >= items.length) return;
    e.preventDefault();
    items = moveInArray(items, i, to);
    await tick();
    handleEls[to]?.focus(); // keep focus on the moved item so it can move again
  }
  function duplicateItem(i: number) {
    const copy: KaleItem = {
      ...items[i],
      u: round(Math.min(1, items[i].u + 0.06), 3),
      v: round(Math.min(1, items[i].v + 0.06), 3),
      seed: randInt(1, 46655), // 36^3 - 1 → a 3-char base36 seed; plenty of jitter variety
      open: true
    };
    items = [...items.slice(0, i + 1), copy, ...items.slice(i + 1)];
  }
  function randomizeItems() {
    const n = randInt(4, 9);
    items = Array.from({ length: n }, (_, i) => makeItem(i, n));
  }
  function recolorItems() {
    const n = items.length;
    // Mutate in place so open item cards don't re-mount while a palette slider
    // is dragged; the reassignment just invalidates for a repaint.
    items.forEach((it, i) => (it.color = paletteHex(spreadT(i, n))));
    items = items;
  }

  // --- custom palette swatches --------------------------------------------
  function addColor() {
    customColors = [...customColors, '#ffffff'];
  }
  function removeColor(i: number) {
    customColors = customColors.filter((_, idx) => idx !== i);
  }
  function randomizeColors() {
    customColors = customColors.map(() => randomHex());
  }

  $: paletteHint =
    colorMode === 'spectrum'
      ? 'Spread determines how wide the spectrum is.'
      : colorMode === 'duo'
        ? 'Spread determines the second color via distance from the first.'
        : colorMode === 'mono'
          ? 'A single hue. Items vary only in lightness.'
          : 'Items are tinted from this set, in order.';

  // Recolor every item whenever a palette control moves — but never while
  // hydrating a shared scene (which carries its own per-item colors), and never
  // from a single item's own swatch edit (that leaves the palette key alone).
  let hydrated = false;
  const paletteKeyNow = () =>
    `${colorMode}|${hue}|${hueSpread}|${sat}|${light}|${customColors.join(',')}`;
  let _prevKey = paletteKeyNow();
  $: paletteKey = `${colorMode}|${hue}|${hueSpread}|${sat}|${light}|${customColors.join(',')}`;
  $: if (hydrated && paletteKey !== _prevKey) {
    _prevKey = paletteKey;
    recolorItems();
  }

  // --- shuffle / reset ----------------------------------------------------
  const PALETTES: KaleColorMode[] = ['spectrum', 'duo', 'mono', 'custom'];

  function shuffle() {
    colorMode = pick(PALETTES);
    hue = randInt(0, 360);
    hueSpread = randInt(0, 300);
    sat = randInt(45, 100);
    light = randInt(38, 66);
    if (colorMode === 'custom') randomizeColors();
    stroke = Math.random() < 0.5 ? 0 : rand(0.4, 2);
    strokeMatch = Math.random() < 0.6;
    outlineColor = randomHex();
    mode = pick(['radial', 'prism'] as const);
    segments = randInt(4, 16);
    // Motion: a slow drift in a random direction (magnitude squared → biased
    // slow), and a morph kept in a lively-but-not-frantic 0.25–0.75 band.
    spin = round((Math.random() < 0.5 ? -1 : 1) * Math.random() ** 2 * 0.5, 2);
    animate = round(0.25 + Math.random() * 0.5, 2);
    randomizeItems(); // colors itself from the palette just set
    _prevKey = paletteKeyNow(); // don't let the recolor watcher re-tint on top
  }

  function reset() {
    bg = DEFAULTS.bg;
    transparent = DEFAULTS.transparent;
    hue = DEFAULTS.hue;
    hueSpread = DEFAULTS.hueSpread;
    sat = DEFAULTS.sat;
    light = DEFAULTS.light;
    colorMode = DEFAULTS.colorMode;
    customColors = [...DEFAULTS.customColors];
    stroke = DEFAULTS.stroke;
    outlineColor = DEFAULTS.outlineColor;
    strokeMatch = DEFAULTS.strokeMatch;
    mode = DEFAULTS.mode;
    segments = DEFAULTS.segments;
    spin = DEFAULTS.spin;
    animate = DEFAULTS.animate;
    zoom = DEFAULTS.zoom;
    items = cloneItems(DEFAULT_ITEMS);
    _prevKey = paletteKeyNow(); // keep the default items' authored colors
    renderer?.resetMotion();
    renderer?.recenter();
  }

  // --- shareable scene code (compact base36 token) ------------------------
  function encodeState(): string {
    const g = [
      n36(mode === 'prism' ? 1 : 0),
      n36(Math.max(0, PALETTES.indexOf(colorMode))),
      n36(hue), n36(hueSpread), n36(sat), n36(light),
      n36(stroke, 10), n36(segments), n36(spin, 100), n36(animate, 100), n36(zoom, 100),
      n36(strokeMatch ? 1 : 0), n36(transparent ? 1 : 0),
      outlineColor.replace(/^#/, ''), bg.replace(/^#/, ''),
      packHex(customColors)
    ].join('.');
    const it = items
      .map((i) =>
        [
          n36(Math.max(0, KALE_SHAPES.indexOf(i.shape))),
          n36(i.u, 1000), n36(i.v, 1000), n36(i.size, 1000),
          i.color.replace(/^#/, ''),
          n36(i.rotate), n36(i.skew, 100), n36(i.warp, 100), n36(i.twist, 100),
          n36(i.seed)
        ].join('.')
      )
      .join('_');
    return `k1~${g}~${it}`;
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 'k1' || parts.length < 3) return;
      const g = parts[1].split('.');
      mode = p36(g[0]) === 1 ? 'prism' : 'radial';
      colorMode = PALETTES[p36(g[1])] ?? colorMode;
      hue = p36(g[2], 1, hue);
      hueSpread = p36(g[3], 1, hueSpread);
      sat = p36(g[4], 1, sat);
      light = p36(g[5], 1, light);
      stroke = p36(g[6], 10, stroke);
      segments = p36(g[7], 1, segments);
      spin = p36(g[8], 100, spin);
      animate = p36(g[9], 100, animate);
      zoom = p36(g[10], 100, zoom);
      strokeMatch = p36(g[11]) === 1;
      transparent = p36(g[12]) === 1;
      if (g[13]) outlineColor = `#${g[13]}`;
      if (g[14]) bg = `#${g[14]}`;
      if (g[15]) customColors = unpackHex(g[15]);
      const parsed = (parts[2] ? parts[2].split('_') : [])
        .map((s): KaleItem | null => {
          const f = s.split('.');
          if (f.length < 10) return null;
          return {
            shape: KALE_SHAPES[p36(f[0])] ?? 'triangle',
            u: p36(f[1], 1000, 0.5),
            v: p36(f[2], 1000, 0.5),
            size: p36(f[3], 1000, 0.14),
            color: `#${f[4] || 'ffffff'}`,
            rotate: p36(f[5], 1, 0),
            skew: p36(f[6], 100, 0),
            warp: p36(f[7], 100, 0),
            twist: p36(f[8], 100, 0),
            seed: p36(f[9], 1, 1) | 0,
            open: false
          };
        })
        .filter(Boolean) as KaleItem[];
      if (parsed.length) items = parsed;
    } catch {
      // Malformed token — keep the current scene.
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
    renderer?.saveImage(`kaleidoscope-${shortId(encodeState())}.png`);
  }

  // --- saved scenes -------------------------------------------------------
  function applyScene(token: string) {
    decodeState(token);
    _prevKey = paletteKeyNow(); // decoded scene carries its own item colors
    renderer?.resetMotion();
    renderer?.recenter();
  }
  const sceneSnapshot = () => renderer?.snapshot(transparent ? '#16161c' : bg) ?? null;
  $: sceneLabel = `${mode === 'prism' ? 'Tiled' : 'Radial'} · ${segments} seg`;

  // Flip the overlay chrome against the actual pixels under it. Coalesced to one
  // sample per frame so a drag / animation stays cheap.
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

  const SHAPE_LABELS: Record<KaleShape, string> = {
    triangle: 'Triangle',
    circle: 'Circle',
    star: 'Star',
    burst: 'Burst',
    hexagon: 'Hexagon',
    wave: 'Wave',
    diamond: 'Diamond',
    shard: 'Shard'
  };

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
    _prevKey = paletteKeyNow();
    hydrated = true;
  });
</script>

<svelte:head>
  <title>Kaleidoscope | heffner.dev</title>
</svelte:head>

<PlaygroundShell
  title="Kaleidoscope"
  subtitle="Mirror a segment of shapes into a symmetric bloom. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onSavePng={savePng}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Layout">
    <p class="hint">How the fundamental segment is mirrored.</p>
    <div class="mode-row">
      <span class="lab">Mode</span>
      <div class="mode-btns">
        <button class="mode-btn" class:active={mode === 'radial'} on:click={() => (mode = 'radial')}>Radial</button>
        <button class="mode-btn" class:active={mode === 'prism'} on:click={() => (mode = 'prism')}>Tiled</button>
      </div>
    </div>
    <p class="hint">
      {mode === 'radial'
        ? 'Wedges fan around a center point — a classic mandala. Segments sets how many.'
        : 'A mirrored tile repeats across the whole canvas. Segments sets the tile density.'}
    </p>
    <Slider label="Segments" bind:value={segments} min={3} max={24} step={1} />
    <Slider label="Spin" bind:value={spin} min={-0.5} max={0.5} step={0.01} />
    <p class="hint">{mode === 'radial' ? 'Speed and direction the whole field rotates — negative spins the other way.' : 'Speed and direction the tile sheet drifts.'}</p>
    <Slider label="Animate" bind:value={animate} min={0} max={1} step={0.01} />
    <p class="hint">Speed the segment shapes morph — skew, warp, twist and rotation drift over time.</p>
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
  </Section>

  <Section title="Appearance">
    <label class="toggle-row">
      <span class="lab">Transparent BG</span>
      <input type="checkbox" bind:checked={transparent} />
    </label>
    {#if !transparent}
      <label class="color-row">
        <span class="lab">Backdrop</span>
        <input type="color" bind:value={bg} />
        <span class="val">{bg}</span>
      </label>
    {/if}
    <div class="mode-row">
      <span class="lab">Palette</span>
      <div class="mode-btns">
        <button class="mode-btn" class:active={colorMode === 'spectrum'} on:click={() => (colorMode = 'spectrum')}>Spectrum</button>
        <button class="mode-btn" class:active={colorMode === 'duo'} on:click={() => (colorMode = 'duo')}>Duo</button>
        <button class="mode-btn" class:active={colorMode === 'mono'} on:click={() => (colorMode = 'mono')}>Mono</button>
        <button class="mode-btn" class:active={colorMode === 'custom'} on:click={() => (colorMode = 'custom')}>Custom</button>
      </div>
    </div>
    <p class="hint">{paletteHint} Retints every item; edit one below to override it.</p>
    {#if colorMode === 'custom'}
      <div class="swatches">
        {#each customColors as _, i (i)}
          <div class="swatch-item">
            <input type="color" bind:value={customColors[i]} aria-label="Color {i + 1}" />
            <button
              class="swatch-del"
              aria-label="Remove color {i + 1}"
              disabled={customColors.length <= 1}
              on:click={() => removeColor(i)}
            >×</button>
          </div>
        {/each}
        <button class="swatch-add" aria-label="Add color" on:click={addColor}>+</button>
      </div>
      <button class="btn block" on:click={randomizeColors}>Randomize colors</button>
    {:else}
      <div class="hue-row">
        <span class="hue-swatch" style="background: hsl({hue}, {sat}%, {light}%);"></span>
        <Slider label="Hue" bind:value={hue} min={0} max={360} step={1} />
      </div>
      {#if colorMode !== 'mono'}
        <Slider label="Spread" bind:value={hueSpread} min={0} max={360} step={1} />
      {/if}
      <Slider label="Sat" bind:value={sat} min={0} max={100} step={1} unit="%" />
      <Slider label="Light" bind:value={light} min={20} max={80} step={1} unit="%" />
    {/if}
    <Slider label="Stroke" bind:value={stroke} min={0} max={3} step={0.1} />
    {#if stroke > 0}
      <div class="mode-row">
        <span class="lab">Color</span>
        <div class="mode-btns">
          <button class="mode-btn" class:active={strokeMatch} on:click={() => (strokeMatch = true)}>Match</button>
          <button class="mode-btn" class:active={!strokeMatch} on:click={() => (strokeMatch = false)}>Custom</button>
        </div>
      </div>
      {#if !strokeMatch}
        <label class="color-row">
          <span class="lab"></span>
          <input type="color" bind:value={outlineColor} aria-label="Stroke color" />
          <span class="val">{outlineColor}</span>
        </label>
      {/if}
    {/if}
  </Section>

  <Section title={`Items (${items.length})`}>
    <div slot="actions" class="group-actions">
      <button class="btn" on:click|preventDefault|stopPropagation={addItem}>Add</button>
      <button class="btn" on:click|preventDefault|stopPropagation={randomizeItems}>Randomize</button>
    </div>
    <p class="hint">Each shape in the segment. It's mirrored across every seam, so tweaks ripple out symmetrically.</p>
    {#each items as item, i (item)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="item"
        class:dragging={dragIndex === i}
        class:drop-target={overIndex === i && dragIndex !== null && dragIndex !== i}
        on:dragover={(e) => onDragOver(e, i)}
        on:drop={() => onDrop(i)}
        on:dragend={onDragEnd}
      >
        <details bind:open={item.open}>
          <summary>
            <button
              class="drag-handle"
              bind:this={handleEls[i]}
              draggable="true"
              title="Drag to reorder (or ↑/↓)"
              aria-label="Reorder {SHAPE_LABELS[item.shape]}, item {i + 1} of {items.length}"
              on:click|preventDefault|stopPropagation
              on:dragstart={(e) => onDragStart(e, i)}
              on:keydown={(e) => onHandleKey(e, i)}
            >⠿</button>
            <span class="swatch" style="background: {item.color};"></span>
            <span class="item-name">{SHAPE_LABELS[item.shape]}</span>
            <span class="item-meta">{Math.round(item.size * 100) / 100}</span>
          </summary>
          <div class="item-body">
            <label class="mode-row">
              <span class="lab">Shape</span>
              <select class="shape-select" bind:value={item.shape}>
                {#each KALE_SHAPES as s}
                  <option value={s}>{SHAPE_LABELS[s]}</option>
                {/each}
              </select>
            </label>
            <label class="color-row">
              <span class="lab">Color</span>
              <input type="color" bind:value={item.color} aria-label="Item color" />
              <span class="val">{item.color}</span>
            </label>

            <h3>Place</h3>
            <Slider label={posULabel} bind:value={item.u} min={0} max={1} step={0.01} />
            <Slider label={posVLabel} bind:value={item.v} min={0} max={1} step={0.01} />
            <Slider label="Size" bind:value={item.size} min={0.02} max={0.25} step={0.005} />

            <h3>Deform</h3>
            <Slider label="Rotate" bind:value={item.rotate} min={0} max={360} step={1} unit="°" />
            <Slider label="Skew" bind:value={item.skew} min={-1} max={1} step={0.01} />
            <Slider label="Warp" bind:value={item.warp} min={0} max={1} step={0.01} />
            <Slider label="Twist" bind:value={item.twist} min={-1} max={1} step={0.01} />

            <div class="item-actions">
              <button class="btn" on:click={() => duplicateItem(i)}>Duplicate</button>
            </div>
          </div>
        </details>
        <button
          class="item-delete"
          title="Delete item {i + 1}"
          aria-label="Delete item {i + 1}"
          disabled={items.length <= 1}
          on:click|preventDefault|stopPropagation={() => removeItem(i)}
        >×</button>
      </div>
    {/each}
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

  <main slot="preview" class="preview" class:checker={transparent} style={transparent ? '' : `background: ${bg};`}>
    <Kaleidoscope
      bind:this={renderer}
      {bg}
      {transparent}
      {stroke}
      {outlineColor}
      {strokeMatch}
      {mode}
      {segments}
      {items}
      {spin}
      {animate}
      onRendered={onCanvasRendered}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Custom-palette swatches (Appearance). */
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .swatch-item {
    position: relative;
    width: 34px;
    height: 34px;
  }
  .swatch-item input[type='color'] {
    width: 100%;
    height: 100%;
    padding: 0;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    background: none;
    cursor: pointer;
  }
  .swatch-del {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    display: grid;
    place-items: center;
    font: inherit;
    font-size: 0.7rem;
    line-height: 1;
    color: var(--pg-text);
    background: var(--pg-panel);
    border: 1px solid var(--pg-line);
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
  }
  .swatch-del:hover:not(:disabled) {
    color: #e05555;
    border-color: #e05555;
  }
  .swatch-del:disabled {
    opacity: 0;
    pointer-events: none;
  }
  .swatch-add {
    width: 34px;
    height: 34px;
    font: inherit;
    font-size: 1rem;
    line-height: 1;
    color: var(--pg-dim);
    background: transparent;
    border: 1px dashed var(--pg-line);
    border-radius: 4px;
    cursor: pointer;
  }
  .swatch-add:hover {
    color: var(--pg-text);
    border-color: var(--pg-dim);
  }

  /* Item cards (mirrors Glowfield's layer list). */
  .item {
    position: relative;
    border: 1px solid var(--pg-line);
    border-radius: 6px;
    background: #14141a;
    transition: border-color 120ms ease, opacity 120ms ease;
  }
  .item.dragging {
    opacity: 0.4;
  }
  .item.drop-target {
    border-color: var(--pg-accent);
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
  .item summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.5rem 1.8rem 0.5rem 0.6rem;
    cursor: pointer;
    list-style: none;
    font-size: 0.72rem;
    user-select: none;
  }
  .item summary::-webkit-details-marker {
    display: none;
  }
  .item summary:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    flex: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  .item-name {
    font-weight: 600;
  }
  .item-meta {
    margin-left: auto;
    color: var(--pg-dim);
    font-size: 0.64rem;
    font-variant-numeric: tabular-nums;
  }
  .item-delete {
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
  .item-delete:hover:not(:disabled) {
    color: #e05555;
    border-color: #e05555;
  }
  .item-delete:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
  }
  .item-delete:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .item-body {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.2rem 0.6rem 0.7rem;
    border-top: 1px solid var(--pg-line);
  }
  .item-body h3 {
    margin: 0.5rem 0 0;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pg-dim);
  }
  .shape-select {
    font: inherit;
    font-size: 0.7rem;
    color: var(--pg-text);
    background: var(--pg-panel);
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    padding: 0.25rem 0.3rem;
    cursor: pointer;
  }
  .shape-select:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
  }
  .item-actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  .preview.checker {
    background-color: #2a2a31;
    background-image:
      linear-gradient(45deg, #1c1c22 25%, transparent 25%),
      linear-gradient(-45deg, #1c1c22 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #1c1c22 75%),
      linear-gradient(-45deg, transparent 75%, #1c1c22 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  }
</style>
