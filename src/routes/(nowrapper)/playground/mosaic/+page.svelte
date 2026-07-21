<script lang="ts">
  import { onMount } from 'svelte';
  import Mosaic from '$lib/components/playground/Mosaic.svelte';
  import type {
    MosaicShape,
    MosaicMotion,
    MosaicMode,
    MosaicColorMode
  } from '$lib/components/playground/Mosaic.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { createHistory } from '$lib/playground/history';
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
  const MOTIONS: MosaicMotion[] = ['pulse', 'spin', 'wave', 'fade'];
  const MOTION_LABELS: Record<MosaicMotion, string> = {
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
    mode: 'simple' as MosaicMode,
    cols: 14,
    gap: 0.14,
    density: 0.92,
    stack: 3,
    shapes: ['square', 'circle', 'arc'] as MosaicShape[],
    size: 0.8,
    vary: 0.3,
    rotate: 0,
    round: 0.18,
    stroke: 0,
    strokeMatch: true,
    outlineColor: '#000000',
    colorMode: 'spectrum' as MosaicColorMode,
    hue: 210,
    hueSpread: 140,
    sat: 70,
    light: 60,
    customColors: ['#ff6b35', '#ffd23f', '#3bceac', '#0ead69', '#540d6e'],
    motions: ['pulse'] as MosaicMotion[],
    pulseSpeed: 0.25,
    spinSpeed: 0.25,
    waveSpeed: 0.25,
    fadeSpeed: 0.25,
    desync: 0.35,
    zoom: 1
  };

  // --- state ----------------------------------------------------------------
  let bg = DEFAULTS.bg;
  let seed = DEFAULTS.seed;
  let mode = DEFAULTS.mode;
  let cols = DEFAULTS.cols;
  let gap = DEFAULTS.gap;
  let density = DEFAULTS.density;
  let stack = DEFAULTS.stack;
  let shapes = [...DEFAULTS.shapes];
  let size = DEFAULTS.size;
  let vary = DEFAULTS.vary;
  let rotate = DEFAULTS.rotate;
  let round = DEFAULTS.round;
  let stroke = DEFAULTS.stroke;
  let strokeMatch = DEFAULTS.strokeMatch;
  let outlineColor = DEFAULTS.outlineColor;
  let colorMode = DEFAULTS.colorMode;
  let hue = DEFAULTS.hue;
  let hueSpread = DEFAULTS.hueSpread;
  let sat = DEFAULTS.sat;
  let light = DEFAULTS.light;
  let customColors = [...DEFAULTS.customColors];
  let motions = [...DEFAULTS.motions];
  let pulseSpeed = DEFAULTS.pulseSpeed;
  let spinSpeed = DEFAULTS.spinSpeed;
  let waveSpeed = DEFAULTS.waveSpeed;
  let fadeSpeed = DEFAULTS.fadeSpeed;
  let desync = DEFAULTS.desync;
  let zoom = DEFAULTS.zoom;

  const MOTION_SPEEDS = () =>
    ({ pulse: pulseSpeed, spin: spinSpeed, wave: waveSpeed, fade: fadeSpeed }) as Record<
      MosaicMotion,
      number
    >;

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

  // --- shapes / motions -------------------------------------------------------
  function toggleShape(s: MosaicShape) {
    if (shapes.includes(s)) {
      if (shapes.length > 1) shapes = shapes.filter((x) => x !== s);
    } else {
      shapes = SHAPES.filter((x) => shapes.includes(x) || x === s); // canonical order
    }
  }
  function toggleMotion(m: MosaicMotion) {
    motions = motions.includes(m)
      ? motions.filter((x) => x !== m)
      : MOTIONS.filter((x) => motions.includes(x) || x === m);
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
      ? 'Each item lands somewhere in the spectrum. Spread sets how wide.'
      : colorMode === 'duo'
        ? 'Items split between two hues; Spread sets the second via distance.'
        : colorMode === 'mono'
          ? 'A single hue. Items vary only in lightness.'
          : 'Each item picks a random color from this set.';

  // --- shuffle / reset --------------------------------------------------------
  const WORDS = ['tessera', 'quilt', 'terrazzo', 'parquet', 'lattice', 'weft', 'pixel', 'motif'];
  function reseed() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    seed = `${w}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function randomSubset<T>(pool: readonly T[], k: number): T[] {
    const rest = [...pool];
    const out: T[] = [];
    for (let i = 0; i < k && rest.length; i++)
      out.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
    return out;
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
    mode = Math.random() < 0.45 ? 'complex' : 'simple';
    stack = randInt(2, 5);
    const picked = randomSubset(SHAPES, randInt(1, 4));
    shapes = SHAPES.filter((s) => picked.includes(s));
    cols = randInt(6, 28);
    gap = rand(0.05, 0.3);
    density = rand(0.55, 1);
    size = rand(0.5, 1.05);
    vary = rand(0, 0.8);
    rotate = Math.random() < 0.5 ? 0 : randInt(5, 90);
    round = rand(0, 0.6);
    stroke = Math.random() < 0.5 ? 0 : rand(0.4, 2);
    strokeMatch = Math.random() < 0.5;
    outlineColor = randomHex();
    const mPicked = randomSubset(MOTIONS, pick([0, 1, 1, 2]));
    motions = MOTIONS.filter((m) => mPicked.includes(m));
    pulseSpeed = rand(0.1, 0.55);
    spinSpeed = rand(0.1, 0.55);
    waveSpeed = rand(0.1, 0.55);
    fadeSpeed = rand(0.1, 0.55);
    desync = rand(0, 1);
    reseed();
  }
  function reset() {
    bg = DEFAULTS.bg;
    seed = DEFAULTS.seed;
    mode = DEFAULTS.mode;
    cols = DEFAULTS.cols;
    gap = DEFAULTS.gap;
    density = DEFAULTS.density;
    stack = DEFAULTS.stack;
    shapes = [...DEFAULTS.shapes];
    size = DEFAULTS.size;
    vary = DEFAULTS.vary;
    rotate = DEFAULTS.rotate;
    round = DEFAULTS.round;
    stroke = DEFAULTS.stroke;
    strokeMatch = DEFAULTS.strokeMatch;
    outlineColor = DEFAULTS.outlineColor;
    colorMode = DEFAULTS.colorMode;
    hue = DEFAULTS.hue;
    hueSpread = DEFAULTS.hueSpread;
    sat = DEFAULTS.sat;
    light = DEFAULTS.light;
    customColors = [...DEFAULTS.customColors];
    motions = [...DEFAULTS.motions];
    pulseSpeed = DEFAULTS.pulseSpeed;
    spinSpeed = DEFAULTS.spinSpeed;
    waveSpeed = DEFAULTS.waveSpeed;
    fadeSpeed = DEFAULTS.fadeSpeed;
    desync = DEFAULTS.desync;
    zoom = DEFAULTS.zoom;
    renderer?.recenter();
  }

  // --- shareable scene code (compact base36 token) ----------------------------
  function encodeState(): string {
    const shapeMask = shapes.reduce((m, s) => m | (1 << SHAPES.indexOf(s)), 0);
    const motionMask = motions.reduce((m, s) => m | (1 << MOTIONS.indexOf(s)), 0);
    const g = [
      n36(mode === 'complex' ? 1 : 0),
      n36(cols), n36(gap, 1000), n36(density, 1000), n36(stack),
      n36(size, 1000), n36(vary, 1000), n36(rotate), n36(round, 1000),
      n36(stroke, 10), n36(strokeMatch ? 1 : 0),
      n36(shapeMask), n36(motionMask),
      n36(pulseSpeed, 1000), n36(spinSpeed, 1000), n36(waveSpeed, 1000), n36(fadeSpeed, 1000),
      n36(desync, 1000),
      n36(Math.max(0, PALETTES.indexOf(colorMode))),
      n36(hue), n36(hueSpread), n36(sat), n36(light),
      n36(zoom, 100),
      outlineColor.replace(/^#/, ''),
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
      mode = p36(g[0]) === 1 ? 'complex' : 'simple';
      cols = p36(g[1], 1, cols);
      gap = p36(g[2], 1000, gap);
      density = p36(g[3], 1000, density);
      stack = p36(g[4], 1, stack);
      size = p36(g[5], 1000, size);
      vary = p36(g[6], 1000, vary);
      rotate = p36(g[7], 1, rotate);
      round = p36(g[8], 1000, round);
      stroke = p36(g[9], 10, stroke);
      strokeMatch = p36(g[10]) === 1;
      const shapeMask = p36(g[11]);
      const decoded = SHAPES.filter((_, i) => shapeMask & (1 << i));
      if (decoded.length) shapes = decoded;
      const motionMask = p36(g[12]);
      motions = MOTIONS.filter((_, i) => motionMask & (1 << i));
      pulseSpeed = p36(g[13], 1000, pulseSpeed);
      spinSpeed = p36(g[14], 1000, spinSpeed);
      waveSpeed = p36(g[15], 1000, waveSpeed);
      fadeSpeed = p36(g[16], 1000, fadeSpeed);
      desync = p36(g[17], 1000, desync);
      colorMode = PALETTES[p36(g[18])] ?? colorMode;
      hue = p36(g[19], 1, hue);
      hueSpread = p36(g[20], 1, hueSpread);
      sat = p36(g[21], 1, sat);
      light = p36(g[22], 1, light);
      zoom = p36(g[23], 100, zoom);
      if (g[24]) outlineColor = `#${g[24]}`;
      if (g[25]) bg = `#${g[25]}`;
      if (g[26]) customColors = unpackHex(g[26]);
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
  $: sceneLabel = `${mode} · ${cols} cols`;

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
      const loop = videoLoop && motions.some((m) => MOTION_SPEEDS()[m] > 0);
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

  // Record scene edits (debounced) so Undo can step back — even across a refresh.
  const history = createHistory('mosaic');
  $: (void [mode, cols, gap, density, stack, size, vary, rotate, round, stroke, strokeMatch, shapes, motions, pulseSpeed, spinSpeed, waveSpeed, fadeSpeed, desync, colorMode, hue, hueSpread, sat, light, zoom, outlineColor, bg, customColors, seed], history.touch(encodeState));
  function undoScene() {
    const tok = history.undo(encodeState());
    if (tok) applyScene(tok);
  }
</script>

<Metatags
  title="Mosaic"
  description="A seeded grid of shapes — every cell rolls its own."
  ogMessage="Mosaic"
/>

<PlaygroundShell
  title="Mosaic"
  subtitle="A seeded grid: your settings set the rules, every cell rolls its own shapes, colors and rhythm. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onUndo={undoScene}
  onSavePng={savePng}
  onSaveVideo={saveVideo}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Grid">
    <div class="mode-row">
      <span class="lab">Mode</span>
      <div class="mode-btns">
        <button class="mode-btn" class:active={mode === 'simple'} on:click={() => (mode = 'simple')}>Simple</button>
        <button class="mode-btn" class:active={mode === 'complex'} on:click={() => (mode = 'complex')}>Complex</button>
      </div>
    </div>
    <p class="hint">
      {mode === 'simple'
        ? 'One shape per cell.'
        : 'Cells nest several shapes, each rolling its own color, size and rhythm.'}
    </p>
    {#if mode === 'complex'}
      <Slider label="Stack" bind:value={stack} min={2} max={6} step={1} />
    {/if}
    <Slider label="Columns" bind:value={cols} min={2} max={48} step={1} />
    <Slider label="Gap" bind:value={gap} min={0} max={0.6} step={0.01} />
    <Slider label="Density" bind:value={density} min={0.05} max={1} step={0.01} />
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
    <p class="hint">Density is each cell’s chance of being filled at all.</p>
  </Section>

  <Section title="Shapes">
    <p class="hint">Each item picks one of the enabled shapes.</p>
    <div class="chip-grid">
      {#each SHAPES as s}
        <button
          class="chip"
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
      Vary randomizes size per item; Rotate is each item’s maximum random tilt — a still pose
      scatter, with Spin animating on top. Round softens square corners. Arcs, lines and
      triangles flip through quarter turns on their own.
    </p>
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
          ? 'Match tints each outline from its own item’s color.'
          : 'Custom draws every outline in a single color.'}
      </p>
    {/if}
  </Section>

  <Section title="Color">
    <label class="color-row">
      <span class="lab">Backdrop</span>
      <input type="color" bind:value={bg} />
      <span class="val">{bg}</span>
    </label>
    <div class="chip-field">
      <span class="lab">Palette</span>
      <div class="chip-grid">
        {#each PALETTES as m}
          <button
            class="chip"
            class:active={colorMode === m}
            aria-pressed={colorMode === m}
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
    <div class="chip-grid">
      {#each MOTIONS as m}
        <button
          class="chip"
          class:active={motions.includes(m)}
          aria-pressed={motions.includes(m)}
          on:click={() => toggleMotion(m)}
        >
          {MOTION_LABELS[m]}
        </button>
      {/each}
    </div>
    <p class="hint">
      Enable any mix — stacked items run out of step, and each tween has its own speed. None
      enabled = a still grid.
    </p>
    {#if motions.includes('pulse')}
      <Slider label="Pulse" bind:value={pulseSpeed} min={0} max={1} step={0.01} />
    {/if}
    {#if motions.includes('spin')}
      <Slider label="Spin" bind:value={spinSpeed} min={0} max={1} step={0.01} />
    {/if}
    {#if motions.includes('wave')}
      <Slider label="Wave" bind:value={waveSpeed} min={0} max={1} step={0.01} />
    {/if}
    {#if motions.includes('fade')}
      <Slider label="Fade" bind:value={fadeSpeed} min={0} max={1} step={0.01} />
    {/if}
    {#if motions.length}
      <Slider label="Desync" bind:value={desync} min={0} max={1} step={0.01} />
      <p class="hint">
        Desync 0 moves the grid as one (a ripple sweeps diagonally); 1 puts every item on its
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
      {mode}
      {cols}
      {gap}
      {density}
      {stack}
      {shapes}
      {size}
      {vary}
      {rotate}
      {round}
      {stroke}
      {strokeMatch}
      {outlineColor}
      {colorMode}
      {hue}
      {hueSpread}
      {sat}
      {light}
      {customColors}
      {motions}
      {pulseSpeed}
      {spinSpeed}
      {waveSpeed}
      {fadeSpeed}
      {desync}
      onRendered={onCanvasRendered}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Mosaic-specific bits; shared sidebar styling lives in PlaygroundShell
     (including the .chip-grid/.chip kit the shapes, motions and palette
     selectors use). */

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
