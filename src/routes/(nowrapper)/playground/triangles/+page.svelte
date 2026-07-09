<script lang="ts">
  import { onMount } from 'svelte';
  import Triangles from '$lib/components/playground/Triangles.svelte';
  import type { TriColorMode, TriShape } from '$lib/components/playground/Triangles.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Section from '$lib/components/playground/Section.svelte';

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

  function hslToHex(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  function randomHex() {
    // Random hue with pleasant sat/light so palettes don't come out muddy.
    return hslToHex(Math.floor(Math.random() * 360), 55 + Math.random() * 35, 42 + Math.random() * 26);
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
  let fieldWarp = DEFAULTS.fieldWarp;
  let taper = DEFAULTS.taper;
  let fieldSkewX = DEFAULTS.fieldSkewX;
  let fieldSkewY = DEFAULTS.fieldSkewY;
  let zoom = DEFAULTS.zoom;

  let renderer: Triangles;
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  const WORDS = ['prism', 'shard', 'facet', 'quartz', 'glint', 'fracture', 'obsidian', 'kite', 'delta', 'origami'];
  function reseed() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    seed = `${w}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const rand = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
  const randInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

  // Shuffle the colors and per-triangle variables, plus the seed. Layout
  // (shape, warp, taper) and view/backdrop are left as-is.
  function shuffle() {
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
    explode = rand(0, 0.6);
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
  const b64urlEncode = (s: string) =>
    btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64urlDecode = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

  function encodeState(): string {
    const parts = [
      shape === 'square' ? 1 : 0,
      Math.max(0, PALETTES.indexOf(colorMode)),
      hue, hueSpread, sat, light, stroke, grid,
      jitter, explode, warp, rotate, skew, zoom, fieldWarp, taper,
      fieldSkewX, fieldSkewY,
      outlineColor.replace(/^#/, ''),
      strokeMatch ? 1 : 0,
      customColors.map((c) => c.replace(/^#/, '')).join(','),
      transparent ? 1 : 0,
      bg.replace(/^#/, '')
    ];
    return b64urlEncode(`${parts.join('~')}~${seed}`); // seed is the trailing remainder
  }

  function decodeState(token: string) {
    try {
      const b = b64urlDecode(token).split('~');
      if (b.length < 24) return;
      const num = (i: number, cur: number) => {
        const v = parseFloat(b[i]);
        return Number.isFinite(v) ? v : cur;
      };
      shape = b[0] === '1' ? 'square' : 'triangle';
      colorMode = PALETTES[+b[1]] ?? colorMode;
      hue = num(2, hue);
      hueSpread = num(3, hueSpread);
      sat = num(4, sat);
      light = num(5, light);
      stroke = num(6, stroke);
      grid = num(7, grid);
      jitter = num(8, jitter);
      explode = num(9, explode);
      warp = num(10, warp);
      rotate = num(11, rotate);
      skew = num(12, skew);
      zoom = num(13, zoom);
      fieldWarp = num(14, fieldWarp);
      taper = num(15, taper);
      fieldSkewX = num(16, fieldSkewX);
      fieldSkewY = num(17, fieldSkewY);
      if (b[18]) outlineColor = `#${b[18]}`;
      strokeMatch = b[19] === '1';
      if (b[20]) customColors = b[20].split(',').map((c) => `#${c}`);
      transparent = b[21] === '1';
      bg = `#${b[22] || '0a0a12'}`;
      seed = b.slice(23).join('~') || seed; // seed is the remainder (may hold '~')
    } catch {
      // Malformed token — keep defaults.
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeState()}`;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1600);
    } catch {
      // Clipboard unavailable.
    }
  }

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });
</script>

<svelte:head>
  <title>Triangle Wrangler | heffner.dev</title>
</svelte:head>

<PlaygroundShell
  title="Triangle Wrangler"
  subtitle="Generate a faceted, low-poly triangle scene. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
>
  <Section title="Layout">
    <p class="hint">These shape the whole canvas.</p>
    <div class="mode-row">
      <span class="lab">Shape</span>
      <div class="mode-btns">
        <button class="mode-btn" class:active={shape === 'triangle'} on:click={() => (shape = 'triangle')}>Triangle</button>
        <button class="mode-btn" class:active={shape === 'square'} on:click={() => (shape = 'square')}>Square</button>
      </div>
    </div>
    <Slider label="Warp" bind:value={fieldWarp} min={-1} max={1} step={0.01} />
    <Slider label="Taper" bind:value={taper} min={-1} max={1} step={0.01} />
    <Slider label="Skew X" bind:value={fieldSkewX} min={-1} max={1} step={0.01} />
    <Slider label="Skew Y" bind:value={fieldSkewY} min={-1} max={1} step={0.01} />
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
    <label class="toggle-row">
      <span class="lab">Transparent</span>
      <input type="checkbox" bind:checked={transparent} />
    </label>
    {#if !transparent}
      <label class="color-row">
        <span class="lab">Backdrop</span>
        <input type="color" bind:value={bg} />
        <span class="val">{bg}</span>
      </label>
    {/if}
  </Section>

  <Section title="Appearance">
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
    <Slider label="Density" bind:value={grid} min={2} max={48} step={1} />
    <Slider label="Jitter" bind:value={jitter} min={-1} max={1} step={0.01} />
    <Slider label="Explode" bind:value={explode} min={0} max={1} step={0.01} />
    <Slider label="Splay" bind:value={warp} min={0} max={1} step={0.01} />
    <Slider label="Rotate" bind:value={rotate} min={0} max={360} step={1} unit="°" />
    <Slider label="Skew" bind:value={skew} min={-1} max={1} step={0.01} />
  </Section>

  <div class="scene-actions">
    <button class="btn" on:click={shuffle}>Shuffle</button>
    <button class="btn" on:click={reset}>Reset</button>
  </div>

  <svelte:fragment slot="footer">
    <button class="btn accent block" on:click={savePng}>Save PNG</button>
    <button class="btn block" on:click={copyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
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
      {fieldWarp}
      {taper}
      {fieldSkewX}
      {fieldSkewY}
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
