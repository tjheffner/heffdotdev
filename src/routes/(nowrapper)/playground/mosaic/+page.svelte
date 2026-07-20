<script lang="ts">
  import { onMount } from 'svelte';
  import Mosaic from '$lib/components/playground/Mosaic.svelte';
  import type {
    MosaicShape,
    MosaicMotion,
    MosaicColorMode
  } from '$lib/components/playground/Mosaic.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { recordViewportClip } from '$lib/playground/video';
  import { n36, p36, packHex, unpackHex } from '$lib/playground/token';
  import { rand, randInt, pick } from '$lib/playground/math';
  import { randomHex } from '$lib/playground/palette';
  import { hslToHex } from '$lib/playground/color';

  const presets = createPresetStore('mosaic');
  let savedScenes: SavedScenes;
  let renderer: Mosaic;

  const SHAPES: MosaicShape[] = ['square', 'circle', 'ring', 'triangle', 'diamond', 'arc', 'line'];
  const SHAPE_LABELS: Record<MosaicShape, string> = {
    square: 'Square',
    circle: 'Circle',
    ring: 'Ring',
    triangle: 'Triangle',
    diamond: 'Diamond',
    arc: 'Arc',
    line: 'Line'
  };
  const MOTIONS: MosaicMotion[] = ['none', 'pulse', 'spin', 'wave', 'fade'];
  const MOTION_LABELS: Record<MosaicMotion, string> = {
    none: 'None',
    pulse: 'Pulse',
    spin: 'Spin',
    wave: 'Wave',
    fade: 'Fade'
  };
  const PALETTES: MosaicColorMode[] = ['spectrum', 'duo', 'mono', 'custom'];

  // Single source of truth for defaults, shared by initial state and Reset.
  const DEFAULTS = {
    bg: '#101018',
    seed: 'mosaic',
    cols: 14,
    gap: 0.14,
    density: 0.92,
    shapes: ['square', 'circle', 'arc'] as MosaicShape[],
    size: 0.8,
    vary: 0.3,
    rotate: 0,
    round: 0.18,
    colorMode: 'spectrum' as MosaicColorMode,
    hue: 210,
    hueSpread: 140,
    sat: 70,
    light: 60,
    customColors: ['#ff6b35', '#ffd23f', '#3bceac', '#0ead69', '#540d6e'],
    motion: 'pulse' as MosaicMotion,
    speed: 0.25,
    desync: 0.35,
    zoom: 1
  };

  // --- state ----------------------------------------------------------------
  let bg = DEFAULTS.bg;
  let seed = DEFAULTS.seed;
  let cols = DEFAULTS.cols;
  let gap = DEFAULTS.gap;
  let density = DEFAULTS.density;
  let shapes = [...DEFAULTS.shapes];
  let size = DEFAULTS.size;
  let vary = DEFAULTS.vary;
  let rotate = DEFAULTS.rotate;
  let round = DEFAULTS.round;
  let colorMode = DEFAULTS.colorMode;
  let hue = DEFAULTS.hue;
  let hueSpread = DEFAULTS.hueSpread;
  let sat = DEFAULTS.sat;
  let light = DEFAULTS.light;
  let customColors = [...DEFAULTS.customColors];
  let motion = DEFAULTS.motion;
  let speed = DEFAULTS.speed;
  let desync = DEFAULTS.desync;
  let zoom = DEFAULTS.zoom;

  // Flip the overlay chrome against the actual pixels under it, coalesced to
  // one sample per frame (motion repaints constantly).
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

  // --- shapes ----------------------------------------------------------------
  function toggleShape(s: MosaicShape) {
    if (shapes.includes(s)) {
      if (shapes.length > 1) shapes = shapes.filter((x) => x !== s);
    } else {
      shapes = SHAPES.filter((x) => shapes.includes(x) || x === s); // canonical order
    }
  }

  // --- color -----------------------------------------------------------------
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
      ? 'Each cell lands somewhere in the spectrum. Spread sets how wide.'
      : colorMode === 'duo'
        ? 'Cells split between two hues; Spread sets the second via distance.'
        : colorMode === 'mono'
          ? 'A single hue. Cells vary only in lightness.'
          : 'Each cell picks a random color from this set.';

  $: motionHint =
    motion === 'none'
      ? 'A still grid.'
      : motion === 'pulse'
        ? 'Cells breathe in and out.'
        : motion === 'spin'
          ? 'Cells rotate, each with its own direction.'
          : motion === 'wave'
            ? 'Cells bob in a ripple across the grid.'
            : 'Cells fade in and out.';

  // --- shuffle / reset --------------------------------------------------------
  const WORDS = ['tessera', 'quilt', 'terrazzo', 'parquet', 'lattice', 'weft', 'pixel', 'motif'];
  function reseed() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    seed = `${w}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function randomShapes(): MosaicShape[] {
    const pool = [...SHAPES];
    const k = randInt(1, 4);
    const out: MosaicShape[] = [];
    for (let i = 0; i < k; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return SHAPES.filter((s) => out.includes(s));
  }

  function shuffle() {
    colorMode = pick(PALETTES);
    hue = randInt(0, 360);
    hueSpread = randInt(40, 300);
    sat = randInt(45, 100);
    light = randInt(40, 72);
    if (colorMode === 'custom') randomizeColors();
    bg =
      Math.random() < 0.65
        ? hslToHex(randInt(0, 360), randInt(8, 35), randInt(6, 16))
        : hslToHex(randInt(30, 55), randInt(10, 40), randInt(88, 96));
    shapes = randomShapes();
    cols = randInt(6, 28);
    gap = rand(0.05, 0.3);
    density = rand(0.55, 1);
    size = rand(0.5, 1.05);
    vary = rand(0, 0.8);
    rotate = Math.random() < 0.5 ? 0 : randInt(5, 90);
    round = rand(0, 0.6);
    motion = pick(MOTIONS);
    speed = rand(0.1, 0.55);
    desync = rand(0, 1);
    reseed();
  }
  function reset() {
    bg = DEFAULTS.bg;
    seed = DEFAULTS.seed;
    cols = DEFAULTS.cols;
    gap = DEFAULTS.gap;
    density = DEFAULTS.density;
    shapes = [...DEFAULTS.shapes];
    size = DEFAULTS.size;
    vary = DEFAULTS.vary;
    rotate = DEFAULTS.rotate;
    round = DEFAULTS.round;
    colorMode = DEFAULTS.colorMode;
    hue = DEFAULTS.hue;
    hueSpread = DEFAULTS.hueSpread;
    sat = DEFAULTS.sat;
    light = DEFAULTS.light;
    customColors = [...DEFAULTS.customColors];
    motion = DEFAULTS.motion;
    speed = DEFAULTS.speed;
    desync = DEFAULTS.desync;
    zoom = DEFAULTS.zoom;
    renderer?.recenter();
  }

  // --- shareable scene code (compact base36 token) ----------------------------
  function encodeState(): string {
    const mask = shapes.reduce((m, s) => m | (1 << SHAPES.indexOf(s)), 0);
    const g = [
      n36(cols), n36(gap, 1000), n36(density, 1000),
      n36(size, 1000), n36(vary, 1000), n36(rotate), n36(round, 1000),
      n36(mask),
      n36(Math.max(0, MOTIONS.indexOf(motion))), n36(speed, 1000), n36(desync, 1000),
      n36(Math.max(0, PALETTES.indexOf(colorMode))),
      n36(hue), n36(hueSpread), n36(sat), n36(light),
      n36(zoom, 100),
      bg.replace(/^#/, ''),
      packHex(customColors)
    ].join('.');
    return `m1~${g}~${seed}`;
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 'm1' || parts.length < 2) return;
      const g = parts[1].split('.');
      cols = p36(g[0], 1, cols);
      gap = p36(g[1], 1000, gap);
      density = p36(g[2], 1000, density);
      size = p36(g[3], 1000, size);
      vary = p36(g[4], 1000, vary);
      rotate = p36(g[5], 1, rotate);
      round = p36(g[6], 1000, round);
      const mask = p36(g[7]);
      const decoded = SHAPES.filter((_, i) => mask & (1 << i));
      if (decoded.length) shapes = decoded;
      motion = MOTIONS[p36(g[8])] ?? motion;
      speed = p36(g[9], 1000, speed);
      desync = p36(g[10], 1000, desync);
      colorMode = PALETTES[p36(g[11])] ?? colorMode;
      hue = p36(g[12], 1, hue);
      hueSpread = p36(g[13], 1, hueSpread);
      sat = p36(g[14], 1, sat);
      light = p36(g[15], 1, light);
      zoom = p36(g[16], 100, zoom);
      if (g[17]) bg = `#${g[17]}`;
      if (g[18]) customColors = unpackHex(g[18]);
      seed = parts.slice(2).join('~') || seed;
    } catch {
      // Malformed token — keep current scene.
    }
  }

  // --- export / saved scenes --------------------------------------------------
  function shortId(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }
  function savePng() {
    renderer?.saveImage(`mosaic-${shortId(encodeState())}.png`);
  }
  function applyScene(token: string) {
    decodeState(token);
    renderer?.recenter();
  }
  const sceneSnapshot = () => renderer?.snapshot(bg) ?? null;
  $: sceneLabel = `${colorMode} · ${cols} cols`;

  // --- video capture ----------------------------------------------------------
  const CLIP_FPS = 30;
  let videoSeconds = 6;
  let videoLoop = false;
  let recording = false;
  let recordPct = 0;
  let videoErr = false;

  async function saveVideo() {
    if (recording) return;
    recording = true;
    recordPct = 0;
    videoErr = false;
    try {
      // A seamless loop needs motion to close cycles over; otherwise record
      // the live clock from "now".
      const loop = videoLoop && motion !== 'none' && speed > 0;
      const t0 = renderer?.currentTime() ?? 0;
      if (loop) renderer?.beginLoop(videoSeconds);
      await recordViewportClip({
        seconds: videoSeconds,
        fps: CLIP_FPS,
        filename: `mosaic-${shortId(encodeState())}`,
        draw: (ctx, i, W, H, frames) =>
          loop
            ? renderer?.captureLoopFrame(ctx, W, H, frames ? i / frames : 0)
            : renderer?.captureFrame(ctx, W, H, t0 + i / CLIP_FPS),
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
  title="Mosaic"
  description="A seeded grid of shapes — every cell rolls its own."
  ogMessage="Mosaic"
/>

<PlaygroundShell
  title="Mosaic"
  subtitle="A seeded grid: your settings set the rules, every cell rolls its own shape, color and rhythm. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onSavePng={savePng}
  onSaveVideo={saveVideo}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Grid">
    <Slider label="Columns" bind:value={cols} min={2} max={48} step={1} />
    <Slider label="Gap" bind:value={gap} min={0} max={0.6} step={0.01} />
    <Slider label="Density" bind:value={density} min={0.05} max={1} step={0.01} />
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
    <p class="hint">Density is each cell’s chance of being filled at all.</p>
  </Section>

  <Section title="Shapes">
    <p class="hint">Each filled cell picks one of the enabled shapes.</p>
    <div class="shape-grid">
      {#each SHAPES as s}
        <button
          class="shape-chip"
          class:active={shapes.includes(s)}
          aria-pressed={shapes.includes(s)}
          on:click={() => toggleShape(s)}
        >
          {SHAPE_LABELS[s]}
        </button>
      {/each}
    </div>
    <Slider label="Size" bind:value={size} min={0.2} max={1.2} step={0.01} />
    <Slider label="Vary" bind:value={vary} min={0} max={1} step={0.01} />
    <Slider label="Rotate" bind:value={rotate} min={0} max={180} step={1} unit="°" />
    <Slider label="Round" bind:value={round} min={0} max={1} step={0.01} />
    <p class="hint">
      Vary randomizes size per cell; Rotate is each cell’s maximum random tilt; Round softens
      square corners. Arcs, lines and triangles also flip through quarter turns on their own.
    </p>
  </Section>

  <Section title="Color">
    <label class="color-row">
      <span class="lab">Backdrop</span>
      <input type="color" bind:value={bg} />
      <span class="val">{bg}</span>
    </label>
    <div class="mode-row">
      <span class="lab">Palette</span>
      <div class="mode-btns">
        {#each PALETTES as m}
          <button
            class="mode-btn"
            class:active={colorMode === m}
            on:click={() => (colorMode = m)}
          >{m[0].toUpperCase() + m.slice(1)}</button>
        {/each}
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
  </Section>

  <Section title="Motion">
    <div class="mode-row">
      <span class="lab">Tween</span>
      <div class="mode-btns">
        {#each MOTIONS as m}
          <button class="mode-btn" class:active={motion === m} on:click={() => (motion = m)}>
            {MOTION_LABELS[m]}
          </button>
        {/each}
      </div>
    </div>
    <p class="hint">{motionHint}</p>
    {#if motion !== 'none'}
      <Slider label="Speed" bind:value={speed} min={0} max={1} step={0.01} />
      <Slider label="Desync" bind:value={desync} min={0} max={1} step={0.01} />
      <p class="hint">
        Desync 0 moves the grid as one (a ripple sweeps diagonally); 1 puts every cell on its
        own clock.
      </p>
    {/if}
  </Section>

  <SavedScenes
    bind:this={savedScenes}
    slot="saved"
    store={presets}
    encode={encodeState}
    apply={applyScene}
    snapshot={sceneSnapshot}
    {savePng}
    {saveVideo}
    videoLabel={recording ? `Rec ${recordPct}%` : videoErr ? 'No video' : 'Video (V)'}
    videoBusy={recording}
    bind:videoSeconds
    showLoop={true}
    bind:videoLoop
    label={sceneLabel}
  />

  <svelte:fragment slot="footer">
    <button class="btn" on:click={shuffle}>Shuffle (F)</button>
    <button class="btn" on:click={reset}>Reset (R)</button>
  </svelte:fragment>

  <main slot="preview" class="preview" style="background: {bg};">
    <Mosaic
      bind:this={renderer}
      {bg}
      {seed}
      {cols}
      {gap}
      {density}
      {shapes}
      {size}
      {vary}
      {rotate}
      {round}
      {colorMode}
      {hue}
      {hueSpread}
      {sat}
      {light}
      {customColors}
      {motion}
      {speed}
      {desync}
      onRendered={onCanvasRendered}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Mosaic-specific bits; shared sidebar styling lives in PlaygroundShell. */

  /* Shape toggles: independent chips on a wrapping grid — the shared
     .mode-btns segmented pill can't hold seven labels legibly. */
  .shape-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 0.35rem;
  }
  .shape-chip {
    font: inherit;
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--pg-dim);
    background: transparent;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    padding: 0.35rem 0;
    cursor: pointer;
  }
  .shape-chip:hover {
    color: var(--pg-text);
    border-color: var(--pg-dim);
  }
  .shape-chip.active {
    background: var(--pg-line);
    color: var(--pg-text);
  }
  .shape-chip:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: -2px;
  }
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
</style>
