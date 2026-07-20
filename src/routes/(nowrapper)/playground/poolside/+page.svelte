<script lang="ts">
  import { onMount } from 'svelte';
  import Poolside from '$lib/components/playground/Poolside.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { createHistory } from '$lib/playground/history';
  import { recordViewportClip } from '$lib/playground/video';
  import { n36, p36, packHex, unpackHex } from '$lib/playground/token';
  import { hexRgb, hexToHsl, hslToHex } from '$lib/playground/color';
  import { rand, randInt, pick, clamp, round } from '$lib/playground/math';

  const presets = createPresetStore('poolside');

  // Single source of truth for defaults, shared by initial state and Reset.
  const DEFAULTS = {
    deepColor: '#0d3464',
    shallowColor: '#2ca3bd',
    causticColor: '#e4fefc',
    speed: 0.18,
    scale: 2,
    intensity: 1,
    sharpness: 6.5,
    turbulence: 0.56,
    iterations: 7,
    angle: 197,
    swirl: 1.42,
    grain: 0.82,
    weave: 5.96,
    detail: 256,
    phase: 57,
    zoom: 3.36
  };

  // --- color ---------------------------------------------------------------
  let deepColor = DEFAULTS.deepColor;
  let shallowColor = DEFAULTS.shallowColor;
  let causticColor = DEFAULTS.causticColor;

  // --- pattern -------------------------------------------------------------
  let speed = DEFAULTS.speed;
  let scale = DEFAULTS.scale;
  let intensity = DEFAULTS.intensity;
  let sharpness = DEFAULTS.sharpness;
  let turbulence = DEFAULTS.turbulence;
  let iterations = DEFAULTS.iterations;
  let angle = DEFAULTS.angle;
  let swirl = DEFAULTS.swirl;
  let grain = DEFAULTS.grain;
  let weave = DEFAULTS.weave;
  let detail = DEFAULTS.detail;
  let phase = DEFAULTS.phase;
  let zoom = DEFAULTS.zoom;

  // Hand-tuned presets [deep, shallow, caustic] — click one to set all three
  // color stops at once. Also the source shuffle draws from (fully-random trios
  // come out muddy). A mix of pool-water blues/greens and non-liquid heat/neon.
  type Palette = { name: string; colors: [string, string, string] };
  const PALETTES: Palette[] = [
    { name: 'Lagoon', colors: ['#062b47', '#1f8fb5', '#e3fbff'] },
    { name: 'Tropical', colors: ['#0a4d68', '#2ec4b6', '#eafff8'] },
    { name: 'Deep End', colors: ['#0b1a3a', '#2b6fd6', '#cfe6ff'] },
    { name: 'Grotto', colors: ['#04322b', '#1c9e7a', '#d8ffee'] },
    { name: 'Emerald', colors: ['#06301f', '#16a34a', '#ddffe8'] },
    { name: 'Twilight', colors: ['#1a1040', '#5a4fd6', '#d9d2ff'] },
    { name: 'Sunlit', colors: ['#0e3b52', '#3aa0c9', '#fff6d6'] },
    { name: 'Ink', colors: ['#0a0a16', '#2a4a7a', '#9fd0ff'] },
    { name: 'Lava', colors: ['#2a0805', '#c1440e', '#ffd166'] },
    { name: 'Magma', colors: ['#160000', '#b31217', '#ffb347'] },
    { name: 'Sunset', colors: ['#3a0d3a', '#e0567a', '#ffd9a0'] },
    { name: 'Gold', colors: ['#231402', '#c98a1a', '#fff2c2'] },
    { name: 'Citrus', colors: ['#2e1a00', '#f59e0b', '#fff7cc'] },
    { name: 'Neon', colors: ['#0a021a', '#d100d1', '#00ffe0'] },
    { name: 'Poison', colors: ['#0d1a00', '#7fbf00', '#eaff9f'] },
    { name: 'Rose', colors: ['#2a0416', '#e11d74', '#ffe0ec'] }
  ];

  function applyPalette(p: Palette) {
    [deepColor, shallowColor, causticColor] = p.colors;
  }

  // Nudge one hex by small H/S/L deltas — lets shuffle land *near* a preset
  // rather than on it (or on a muddy fully-random trio).
  function jitterHex(hex: string, dh: number, ds: number, dl: number): string {
    const c = hexToHsl(hex);
    return hslToHex(
      (c.h + dh + 360) % 360,
      clamp(c.s + ds, 0, 100),
      clamp(c.l + dl, 0, 100)
    );
  }

  let renderer: Poolside;
  let savedScenes: SavedScenes;

  // Chrome flips against the deep-water backdrop (the caustic sits over it).
  // Derive it directly from the color — no per-frame canvas readback needed.
  $: chromeLight = (() => {
    const { r, g, b } = hexRgb(deepColor);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  })();

  // A signed value in [-max, max] that hugs 0 (cubing a uniform biases toward
  // the center) — so "extremes are ok but minimal is preferred".
  const neutral = (max: number) => round(rand(-1, 1) ** 3 * max, 2);

  // Shuffle colors + waves, and pick a scale/zoom/swirl *archetype*. Those three
  // are correlated — randomizing them independently mostly lands on mush — so we
  // draw from a few flavors that each hit a known sweet spot. Weighting favors
  // the calm-swirl flavors; the vortex flavor is where big swirl lives.
  function shuffle() {
    const base = pick(PALETTES);
    const dh = rand(-18, 18);
    deepColor = jitterHex(base.colors[0], dh, rand(-10, 10), rand(-6, 6));
    shallowColor = jitterHex(base.colors[1], dh, rand(-12, 12), rand(-8, 8));
    causticColor = jitterHex(base.colors[2], dh, rand(-8, 8), rand(-5, 5));
    sharpness = rand(3, 14);
    turbulence = rand(0.1, 0.85);
    iterations = randInt(3, 7);
    phase = randInt(0, 100);
    angle = randInt(0, 359);
    grain = rand(0.6, 1.8);
    weave = rand(1.5, 6);

    const flavor = pick([
      'closeup', 'closeup', // tight cells, zoomed in, calm swirl
      'expanse', 'expanse', // big sprawling field, pulled back, calm swirl
      'vortex', 'vortex', //   big field cranked into spirals, wide view
      'free' //               anything, still neutral-biased swirl
    ] as const);
    if (flavor === 'closeup') {
      scale = rand(1, 2.5);
      zoom = rand(1.4, 3.4);
      swirl = neutral(3);
    } else if (flavor === 'expanse') {
      scale = rand(10, 20);
      zoom = rand(0.25, 1.1);
      swirl = neutral(3);
    } else if (flavor === 'vortex') {
      scale = rand(9, 20);
      zoom = rand(0.25, 0.5);
      swirl = round(pick([-1, 1]) * rand(8, 24), 2);
    } else {
      scale = rand(1, 20);
      zoom = rand(0.25, 4);
      swirl = neutral(24);
    }
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
    renderer?.saveImage(`poolside-${shortId(encodeState())}.png`);
  }

  // --- video capture ------------------------------------------------------
  const CLIP_FPS = 30;
  let videoSeconds = 6; // clip length; bound to the SavedScenes selector
  let videoLoop = false; // seamless loop toggle
  let recording = false;
  let recordPct = 0;
  let videoErr = false;

  async function saveVideo() {
    if (recording || !renderer) return;
    recording = true;
    recordPct = 0;
    videoErr = false;
    const loop = videoLoop;
    const t0 = renderer.currentTime();
    try {
      await recordViewportClip({
        seconds: videoSeconds,
        fps: CLIP_FPS,
        filename: `poolside-${shortId(encodeState())}${loop ? '-loop' : ''}`,
        before: loop ? () => renderer.beginLoop(videoSeconds) : undefined,
        after: loop ? () => renderer.endLoop() : undefined,
        // Loop: evaluate the field at u∈[0,1). Plain: advance the clock at the live
        // speed so the clip matches what's on screen.
        draw: loop
          ? (ctx, i, W, H, frames) => renderer.captureLoopFrame(ctx, W, H, i / frames)
          : (ctx, i, W, H) => renderer.captureFrame(ctx, W, H, t0 + (i / CLIP_FPS) * speed),
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

  function reset() {
    deepColor = DEFAULTS.deepColor;
    shallowColor = DEFAULTS.shallowColor;
    causticColor = DEFAULTS.causticColor;
    speed = DEFAULTS.speed;
    scale = DEFAULTS.scale;
    intensity = DEFAULTS.intensity;
    sharpness = DEFAULTS.sharpness;
    turbulence = DEFAULTS.turbulence;
    iterations = DEFAULTS.iterations;
    angle = DEFAULTS.angle;
    swirl = DEFAULTS.swirl;
    grain = DEFAULTS.grain;
    weave = DEFAULTS.weave;
    detail = DEFAULTS.detail;
    phase = DEFAULTS.phase;
    zoom = DEFAULTS.zoom;
    renderer?.recenter();
  }

  // --- shareable scene code -----------------------------------------------
  // The whole scene packs into one short token (?s=…). `time` is never encoded,
  // so a shared scene reproduces the look while animating from wherever.
  function encodeState(): string {
    const g = [
      n36(speed, 100),
      n36(scale, 10),
      n36(intensity, 100),
      n36(sharpness, 10),
      n36(iterations),
      n36(turbulence, 100),
      n36(zoom, 100),
      n36(detail),
      n36(phase),
      n36(angle),
      n36(swirl, 100),
      n36(grain, 100),
      n36(weave, 100)
    ].join('.');
    return `w1~${g}~${packHex([deepColor, shallowColor, causticColor])}`;
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 'w1' || parts.length < 3) return;
      const g = parts[1].split('.');
      speed = p36(g[0], 100, speed);
      scale = p36(g[1], 10, scale);
      intensity = p36(g[2], 100, intensity);
      sharpness = p36(g[3], 10, sharpness);
      iterations = p36(g[4], 1, iterations);
      turbulence = p36(g[5], 100, turbulence);
      zoom = p36(g[6], 100, zoom);
      detail = p36(g[7], 1, detail);
      phase = p36(g[8], 1, phase);
      angle = p36(g[9], 1, angle);
      swirl = p36(g[10], 100, swirl);
      grain = p36(g[11], 100, grain);
      weave = p36(g[12], 100, weave);
      const colors = unpackHex(parts[2]);
      if (colors[0]) deepColor = colors[0];
      if (colors[1]) shallowColor = colors[1];
      if (colors[2]) causticColor = colors[2];
    } catch {
      // Malformed token — keep defaults.
    }
  }

  // --- saved scenes -------------------------------------------------------
  function applyScene(token: string) {
    decodeState(token);
    renderer?.recenter();
  }
  const sceneSnapshot = () => renderer?.snapshot(deepColor) ?? null;
  $: sceneLabel = `scale ${scale} · sharp ${sharpness}`;

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });

  // Record scene edits (debounced) so Undo can step back — even across a refresh.
  const history = createHistory('poolside');
  $: (void [speed, scale, intensity, sharpness, iterations, turbulence, zoom, detail, phase, angle, swirl, grain, weave, deepColor, shallowColor, causticColor], history.touch(encodeState));
  function undoScene() {
    const tok = history.undo(encodeState());
    if (tok) applyScene(tok);
  }
</script>

<Metatags
  title="Poolside"
  description="Tune the shimmering caustic light on a pool surface."
  ogMessage="Poolside"
/>

<PlaygroundShell
  title="Poolside"
  subtitle="Tune the shimmering caustic light on a pool surface. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onUndo={undoScene}
  onSavePng={savePng}
  onSaveVideo={saveVideo}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Scene">
    <Slider label="Speed" bind:value={speed} min={0} max={3} step={0.01} unit="×" />
    <Slider label="Flow" bind:value={turbulence} min={0} max={1} step={0.01} />
    <Slider label="Scale" bind:value={scale} min={1} max={20} step={0.1} />
    <Slider label="Rotate" bind:value={angle} min={0} max={360} step={1} unit="°" />
    <Slider label="Swirl" bind:value={swirl} min={-24} max={24} step={0.5} />
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
    <p class="hint">Speed 0 freezes the surface. Flow warps the ripples.</p>
  </Section>

  <Section title="Color">
    <span class="grp-lab">Presets</span>
    <div class="palette-row">
      {#each PALETTES as p}
        <button
          class="palette-chip"
          title={p.name}
          aria-label={`Apply ${p.name} palette`}
          style={`background: linear-gradient(135deg, ${p.colors[0]} 0%, ${p.colors[1]} 55%, ${p.colors[2]} 100%);`}
          on:click={() => applyPalette(p)}
        ></button>
      {/each}
    </div>
    <label class="color-row">
      <span class="lab">Deep</span>
      <input type="color" bind:value={deepColor} aria-label="Deep water color" />
      <span class="val">{deepColor}</span>
    </label>
    <label class="color-row">
      <span class="lab">Shallow</span>
      <input type="color" bind:value={shallowColor} aria-label="Shallow water color" />
      <span class="val">{shallowColor}</span>
    </label>
    <label class="color-row">
      <span class="lab">Surface</span>
      <input type="color" bind:value={causticColor} aria-label="Surface highlight color" />
      <span class="val">{causticColor}</span>
    </label>
    <p class="hint">Pick a preset, or set stops by hand: deep → shallow → surface.</p>
  </Section>

  <Section title="Waves">
    <Slider label="Weave" bind:value={weave} min={1} max={7} step={0.1} />
    <Slider label="Phase" bind:value={phase} min={0} max={100} step={1} />
    <p class="hint">Weave and Phase each reshuffle the wave network along a different axis.</p>
    <Slider label="Grain" bind:value={grain} min={0.3} max={3} step={0.05} unit="×" />
    <Slider label="Detail" bind:value={iterations} min={2} max={8} step={1} />
    <Slider label="Sharp" bind:value={sharpness} min={1} max={16} step={0.5} />
    <Slider label="Bright" bind:value={intensity} min={0.2} max={2} step={0.01} />
    <Slider label="Res" bind:value={detail} min={128} max={384} step={32} unit="px" />
    <p class="hint">Res sets the render buffer size — lower it if the animation stutters.</p>
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
    showLoop
    bind:videoLoop
    label={sceneLabel}
  />

  <svelte:fragment slot="footer">
    <button class="btn" on:click={shuffle}>Shuffle (F)</button>
    <button class="btn" on:click={reset}>Reset (R)</button>
  </svelte:fragment>

  <main slot="preview" class="preview" style={`background: ${deepColor};`}>
    <Poolside
      bind:this={renderer}
      {deepColor}
      {shallowColor}
      {causticColor}
      {speed}
      {scale}
      {intensity}
      {sharpness}
      {turbulence}
      {iterations}
      {angle}
      {swirl}
      {grain}
      {weave}
      {detail}
      {phase}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Preset water palettes — a wrapping row of gradient chips, each applying its
     deep → shallow → caustic trio. Shared control styling lives in PlaygroundShell. */
  .grp-lab {
    display: block;
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--pg-dim);
  }
  .palette-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .palette-chip {
    width: 34px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    cursor: pointer;
  }
  .palette-chip:hover {
    border-color: var(--pg-dim);
  }
  .palette-chip:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
  }
</style>
