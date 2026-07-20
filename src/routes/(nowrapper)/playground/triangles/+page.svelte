<script lang="ts">
  import { onMount } from 'svelte';
  import Triangles from '$lib/components/playground/Triangles.svelte';
  import type { TriColorMode, TriShape } from '$lib/components/playground/Triangles.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { createHistory } from '$lib/playground/history';
  import { n36, p36, packHex, unpackHex } from '$lib/playground/token';
  import { rand, randInt, pick } from '$lib/playground/math';
  import { randomHex } from '$lib/playground/palette';

  const presets = createPresetStore('triangles');

  // Single source of truth for defaults, shared by initial state and Reset.
  const DEFAULTS = {
    bg: '#0a0a12',
    transparent: false,
    hue: 341,
    hueSpread: 127,
    sat: 78,
    light: 50,
    colorMode: 'spectrum' as TriColorMode,
    customColors: ['#ff6b35', '#ffd23f', '#3bceac', '#0ead69', '#540d6e'],
    stroke: 0,
    outlineColor: '#000000',
    strokeMatch: true,
    shape: 'triangle' as TriShape,
    seed: 'shatter',
    grid: 14,
    jitter: 0,
    explode: 0,
    warp: 0,
    rotate: 0,
    skew: 0,
    fieldRotate: 0, // whole-sheet rotation (canvas Rotate)
    fieldWarp: 0,
    taper: 0,
    fieldSkewX: 0, // whole-sheet horizontal shear (Skew X)
    fieldSkewY: 0, // whole-sheet vertical shear (Skew Y)
    zoom: 1
  };

  // --- color --------------------------------------------------------------
  let bg = DEFAULTS.bg;
  let transparent = DEFAULTS.transparent;
  let hue = DEFAULTS.hue;
  let hueSpread = DEFAULTS.hueSpread;
  let sat = DEFAULTS.sat;
  let light = DEFAULTS.light;
  let colorMode: TriColorMode = DEFAULTS.colorMode;
  let customColors = [...DEFAULTS.customColors];
  let stroke = DEFAULTS.stroke;
  let outlineColor = DEFAULTS.outlineColor;
  let strokeMatch = DEFAULTS.strokeMatch;

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
          ? 'A single hue. Triangles vary only in lightness.'
          : 'Each triangle is filled with a random color from this set.';

  // --- arrangement --------------------------------------------------------
  let shape: TriShape = DEFAULTS.shape;
  let seed = DEFAULTS.seed;
  let grid = DEFAULTS.grid;
  let jitter = DEFAULTS.jitter;
  let explode = DEFAULTS.explode;
  let warp = DEFAULTS.warp;
  let rotate = DEFAULTS.rotate;
  let skew = DEFAULTS.skew;
  let fieldRotate = DEFAULTS.fieldRotate;
  let fieldWarp = DEFAULTS.fieldWarp;
  let taper = DEFAULTS.taper;
  let fieldSkewX = DEFAULTS.fieldSkewX;
  let fieldSkewY = DEFAULTS.fieldSkewY;
  let zoom = DEFAULTS.zoom;

  let renderer: Triangles;
  let savedScenes: SavedScenes;

  // Flip the overlay chrome against the actual pixels under it. The canvas can
  // be zoomed past its background, so sampling beats keying off `bg`. Coalesced
  // to one sample per frame so a drag (which repaints on every move) stays cheap.
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

  const WORDS = ['prism', 'shard', 'facet', 'quartz', 'glint', 'fracture', 'obsidian', 'kite', 'delta', 'origami'];
  function reseed() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    seed = `${w}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Shuffle the shape, colors, and per-triangle variables, plus the seed. Field
  // warp/taper and view/backdrop are left as-is.
  function shuffle() {
    shape = pick(['triangle', 'square'] as const);
    colorMode = pick(PALETTES);
    hue = randInt(0, 360);
    hueSpread = randInt(0, 300);
    sat = randInt(45, 100);
    light = randInt(35, 70);
    if (colorMode === 'custom') randomizeColors();
    stroke = Math.random() < 0.5 ? 0 : rand(0.4, 2);
    strokeMatch = Math.random() < 0.5;
    outlineColor = randomHex();
    grid = randInt(4, 28);
    jitter = rand(-1, 1);
    // The clean, un-exploded look is the best one, so bias hard toward it:
    // often exactly 0, otherwise a squared (low-weighted) amount.
    explode = Math.random() < 0.35 ? 0 : Math.round(Math.random() ** 2 * 0.6 * 100) / 100;
    warp = rand(0, 1);
    rotate = randInt(0, 360);
    skew = rand(-1, 1);
    reseed();
  }

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
    renderer?.saveImage(`shatter-${shortId(encodeState())}.png`);
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
    shape = DEFAULTS.shape;
    seed = DEFAULTS.seed;
    grid = DEFAULTS.grid;
    jitter = DEFAULTS.jitter;
    explode = DEFAULTS.explode;
    warp = DEFAULTS.warp;
    rotate = DEFAULTS.rotate;
    skew = DEFAULTS.skew;
    fieldRotate = DEFAULTS.fieldRotate;
    fieldWarp = DEFAULTS.fieldWarp;
    taper = DEFAULTS.taper;
    fieldSkewX = DEFAULTS.fieldSkewX;
    fieldSkewY = DEFAULTS.fieldSkewY;
    zoom = DEFAULTS.zoom;
    renderer?.recenter();
  }

  // --- shareable scene code -----------------------------------------------
  // The whole scene packs into one short token (?s=…). Nothing is written to
  // the URL as you tweak; the link is built only when you copy it.
  const PALETTES: TriColorMode[] = ['spectrum', 'duo', 'mono', 'custom'];

  function encodeState(): string {
    const g = [
      n36(shape === 'square' ? 1 : 0),
      n36(Math.max(0, PALETTES.indexOf(colorMode))),
      n36(hue), n36(hueSpread), n36(sat), n36(light), n36(stroke, 10), n36(grid),
      n36(jitter, 100), n36(explode, 100), n36(warp, 100), n36(rotate), n36(skew, 100),
      n36(zoom, 100), n36(fieldRotate), n36(fieldWarp, 100), n36(taper, 100),
      n36(fieldSkewX, 100), n36(fieldSkewY, 100),
      n36(strokeMatch ? 1 : 0), n36(transparent ? 1 : 0),
      outlineColor.replace(/^#/, ''), bg.replace(/^#/, ''),
      packHex(customColors)
    ].join('.');
    return `t1~${g}~${seed}`; // seed is a word — kept raw as the trailing section
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 't1' || parts.length < 3) return;
      const g = parts[1].split('.');
      shape = p36(g[0]) === 1 ? 'square' : 'triangle';
      colorMode = PALETTES[p36(g[1])] ?? colorMode;
      hue = p36(g[2], 1, hue);
      hueSpread = p36(g[3], 1, hueSpread);
      sat = p36(g[4], 1, sat);
      light = p36(g[5], 1, light);
      stroke = p36(g[6], 10, stroke);
      grid = p36(g[7], 1, grid);
      jitter = p36(g[8], 100, jitter);
      explode = p36(g[9], 100, explode);
      warp = p36(g[10], 100, warp);
      rotate = p36(g[11], 1, rotate);
      skew = p36(g[12], 100, skew);
      zoom = p36(g[13], 100, zoom);
      fieldRotate = p36(g[14], 1, fieldRotate);
      fieldWarp = p36(g[15], 100, fieldWarp);
      taper = p36(g[16], 100, taper);
      fieldSkewX = p36(g[17], 100, fieldSkewX);
      fieldSkewY = p36(g[18], 100, fieldSkewY);
      strokeMatch = p36(g[19]) === 1;
      transparent = p36(g[20]) === 1;
      if (g[21]) outlineColor = `#${g[21]}`;
      if (g[22]) bg = `#${g[22]}`;
      if (g[23]) customColors = unpackHex(g[23]);
      seed = parts.slice(2).join('~') || seed; // remainder, in case a seed word holds '~'
    } catch {
      // Malformed token — keep defaults.
    }
  }

  // --- saved scenes -------------------------------------------------------
  function applyScene(token: string) {
    decodeState(token);
    renderer?.recenter();
  }
  const sceneSnapshot = () => renderer?.snapshot(transparent ? '#232329' : bg) ?? null;
  $: sceneLabel = `${colorMode} · grid ${grid}`;

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });

  // Record scene edits (debounced) so Undo can step back — even across a refresh.
  const history = createHistory('triangles');
  $: (void [shape, colorMode, hue, hueSpread, sat, light, stroke, grid, jitter, explode, warp, rotate, skew, zoom, fieldRotate, fieldWarp, taper, fieldSkewX, fieldSkewY, strokeMatch, transparent, outlineColor, bg, customColors, seed], history.touch(encodeState));
  function undoScene() {
    const tok = history.undo(encodeState());
    if (tok) applyScene(tok);
  }
</script>

<Metatags
  title="Shatter"
  description="Generate a faceted, low-poly triangle scene."
  ogMessage="Shatter"
/>

<PlaygroundShell
  title="Shatter"
  subtitle="Generate a faceted, low-poly triangle scene. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onUndo={undoScene}
  onSavePng={savePng}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Layout">
    <p class="hint">These control the containing canvas.</p>
    <div class="mode-row">
      <span class="lab">Shape</span>
      <div class="mode-btns">
        <button class="mode-btn" class:active={shape === 'triangle'} on:click={() => (shape = 'triangle')}>Triangle</button>
        <button class="mode-btn" class:active={shape === 'square'} on:click={() => (shape = 'square')}>Square</button>
      </div>
    </div>
    <Slider label="Density" bind:value={grid} min={2} max={48} step={1} />
    <Slider label="Rotate" bind:value={fieldRotate} min={0} max={360} step={1} unit="°" />
    <Slider label="Skew X" bind:value={fieldSkewX} min={-1} max={1} step={0.01} />
    <Slider label="Skew Y" bind:value={fieldSkewY} min={-1} max={1} step={0.01} />
    <Slider label="Taper" bind:value={taper} min={-1} max={1} step={0.01} />
    <Slider label="Warp" bind:value={fieldWarp} min={-1} max={1} step={0.01} />
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
    <p class="hint">{paletteHint}</p>
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
      <p class="hint">
        {strokeMatch
          ? 'Match tints each edge from its own triangle’s color, so it plays nicely with a transparent backdrop.'
          : 'Custom draws every edge in a single color.'}
      </p>
    {/if}
  </Section>

  <Section title="Triangles">
    <p class="hint">These control individual triangle properties.</p>
    <Slider label="Jitter" bind:value={jitter} min={-1} max={1} step={0.01} />
    <Slider label="Explode" bind:value={explode} min={0} max={1} step={0.01} />
    <Slider label="Splay" bind:value={warp} min={0} max={1} step={0.01} />
    <Slider label="Rotate" bind:value={rotate} min={0} max={360} step={1} unit="°" />
    <Slider label="Skew" bind:value={skew} min={-1} max={1} step={0.01} />
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
    <Triangles
      bind:this={renderer}
      {shape}
      {bg}
      {transparent}
      {hue}
      {hueSpread}
      {sat}
      {light}
      {colorMode}
      {customColors}
      {stroke}
      {outlineColor}
      {strokeMatch}
      {seed}
      {grid}
      {jitter}
      {explode}
      {warp}
      {rotate}
      {skew}
      {fieldRotate}
      {fieldWarp}
      {taper}
      {fieldSkewX}
      {fieldSkewY}
      onRendered={onCanvasRendered}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Triangle-specific bits; shared sidebar styling lives in PlaygroundShell. */
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
