<script lang="ts">
  import { dev } from '$app/environment';
  import Glowfield from '$lib/components/playground/Glowfield.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';

  type Layer = {
    sz: number; ox: number; oy: number; a: number;
    h: number; s: number; l: number;
    fx: number; fy: number; ax: number; ay: number; ph: number;
    open?: boolean;
  };

  type ColorMode = 'anchor' | 'rainbow' | 'mono';

  // --- state ------------------------------------------------------------

  let layers: Layer[] = [
    { sz: 688, ox: 0,    oy: 0,    a: 0.5,  h: 16, s: 100, l: 60, fx: 0.31, fy: 0.26, ax: 120, ay: 95,  ph: 0.0, open: true },
    { sz: 569, ox: -210, oy: -88,  a: 0.38, h: 6,  s: 100, l: 57, fx: 0.23, fy: 0.37, ax: 130, ay: 105, ph: 1.7, open: false },
    { sz: 643, ox: 238,  oy: 104,  a: 0.4,  h: 28, s: 100, l: 62, fx: 0.27, fy: 0.18, ax: 125, ay: 110, ph: 3.1, open: false },
    { sz: 397, ox: 92,   oy: -212, a: 0.34, h: 13, s: 96,  l: 66, fx: 0.41, fy: 0.33, ax: 110, ay: 115, ph: 4.6, open: false }
  ];

  let anchor = { x: 0.68, y: 0.3 };
  let intensity = { header: 1.0, middle: 0.34, footer: 0.9 };
  let depth = 0;
  let bg = '#0b0b0e';
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  let colorMode: ColorMode = 'anchor';
  let anchorHue = 16;
  let _prevHue = anchorHue;

  // --- color generation ---------------------------------------------------

  function generateColor(index: number, total: number): { h: number; s: number; l: number } {
    switch (colorMode) {
      case 'anchor': {
        // Deterministic fan around the anchor hue — smooth when the slider moves.
        const spread = 44;
        const offset = total > 1 ? (index / (total - 1) - 0.5) * spread : 0;
        return {
          h: Math.round((anchorHue + offset + 360) % 360),
          s: Math.round(94 + (index % 3) * 2),
          l: Math.round(57 + (index % 3) * 4)
        };
      }
      case 'rainbow':
        return {
          h: Math.round(rnd(0, 360)),
          s: Math.round(rnd(82, 100)),
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

  // In anchor mode, smoothly recolor as the hue slider moves.
  $: if (colorMode === 'anchor' && anchorHue !== _prevHue) {
    _prevHue = anchorHue;
    recolorLayers();
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

  function randomizeAll() {
    const count = layers.length || 4;
    layers = Array.from({ length: count }, (_, i) => ({
      ...randomLayer(i, count),
      open: layers[i]?.open ?? false
    }));
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
</script>

<svelte:head>
  <title>Glowfield playground</title>
</svelte:head>

<div class="playground">
  <aside class="sidebar">
    <header class="panel-head">
      <h1>Glowfield</h1>
      <p>Tune the ambient cloud{dev ? ', then copy the config into your page' : ''}.</p>
    </header>

    <details class="group collapsible" open>
      <summary>
        <h2>Scene</h2>
        <span class="chev" aria-hidden="true"></span>
      </summary>
      <div class="collapsible-body">
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
            <button
              class="mode-btn"
              class:active={colorMode === 'anchor'}
              on:click={() => applyColorMode('anchor')}
            >Anchor</button>
            <button
              class="mode-btn"
              class:active={colorMode === 'rainbow'}
              on:click={() => applyColorMode('rainbow')}
            >Rainbow</button>
            <button
              class="mode-btn"
              class:active={colorMode === 'mono'}
              on:click={() => applyColorMode('mono')}
            >B/W</button>
          </div>
        </div>

        {#if colorMode === 'anchor'}
          <div class="hue-row">
            <span
              class="hue-swatch"
              style="background: hsl({anchorHue}, 100%, 60%);"
            ></span>
            <Slider label="Hue" bind:value={anchorHue} min={0} max={360} step={1} />
          </div>
        {/if}
      </div>
    </details>

    <details class="group collapsible">
      <summary>
        <h2>Scroll intensity</h2>
        <span class="chev" aria-hidden="true"></span>
      </summary>
      <div class="collapsible-body">
        <svg class="curve" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="Opacity across scroll depth">
          <line x1="0" y1="36" x2="100" y2="36" class="axis" />
          <path d={curvePath} class="trace" />
          <line x1={markerX} y1="4" x2={markerX} y2="36" class="cursor" />
          <circle cx={markerX} cy={markerY} r="2.4" class="dot" />
        </svg>
        <Slider label="Depth" bind:value={depth} min={0} max={1} step={0.001} />
        <Slider label="Header" bind:value={intensity.header} min={0} max={1.2} step={0.01} />
        <Slider label="Middle" bind:value={intensity.middle} min={0} max={1.2} step={0.01} />
        <Slider label="Footer" bind:value={intensity.footer} min={0} max={1.2} step={0.01} />
        <p class="hint">Depth simulates page scroll: 0 is the header, 1 is the footer.</p>
      </div>
    </details>

    <details class="group collapsible" open>
      <summary>
        <h2>Layers · {layers.length}</h2>
        <div class="group-actions">
          <button class="btn" on:click|preventDefault|stopPropagation={addLayer}>Add</button>
          <button class="btn" on:click|preventDefault|stopPropagation={randomizeAll}>Randomize</button>
        </div>
        <span class="chev" aria-hidden="true"></span>
      </summary>
      <div class="collapsible-body">
        {#each layers as layer, i (layer)}
          <details class="layer" bind:open={layer.open}>
            <summary>
              <span
                class="swatch"
                style="background: radial-gradient(circle, hsl({layer.h}, {layer.s}%, {layer.l}%) 0%, transparent 72%);"
              ></span>
              <span class="layer-name">Layer {i + 1}</span>
              <span class="layer-meta">{layer.sz}px · h{Math.round(layer.h)}</span>
              <button
                class="layer-delete"
                title="Delete layer {i + 1}"
                aria-label="Delete layer {i + 1}"
                disabled={layers.length <= 1}
                on:click|preventDefault|stopPropagation={() => removeLayer(i)}
              >×</button>
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
        {/each}
      </div>
    </details>

    {#if dev}
      <details class="group collapsible">
        <summary>
          <h2>Config</h2>
          <button
            class="btn accent"
            on:click|preventDefault|stopPropagation={copyConfig}
          >{copied ? 'Copied' : 'Copy'}</button>
          <span class="chev" aria-hidden="true"></span>
        </summary>
        <div class="collapsible-body">
          <pre class="config">{configText}</pre>
        </div>
      </details>
    {/if}
  </aside>

  <main class="preview" style="background: {bg};">
    <Glowfield
      {layers}
      {anchor}
      {intensity}
      contained={true}
      progressOverride={depth}
    />
    <div class="preview-frame">
      <span>preview · depth {depth.toFixed(2)}</span>
    </div>
  </main>
</div>

<style>
  :global(html, body) {
    margin: 0;
  }

  .playground {
    --pg-bg: #101015;
    --pg-panel: #16161c;
    --pg-line: #26262e;
    --pg-text: #e8e8ec;
    --pg-dim: #8a8a93;
    --pg-accent: #ff6b35;
    --pg-track: #2a2a31;

    display: grid;
    grid-template-columns: 340px 1fr;
    height: 100vh;
    height: 100dvh;
    font-family: ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
    color: var(--pg-text);
    background: var(--pg-bg);
  }

  /* --- sidebar --------------------------------------------------------- */

  .sidebar {
    overflow-y: auto;
    border-right: 1px solid var(--pg-line);
    background: var(--pg-panel);
    padding: 1.1rem 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    scrollbar-width: thin;
    scrollbar-color: var(--pg-line) transparent;
  }
  .sidebar::-webkit-scrollbar {
    width: 6px;
  }
  .sidebar::-webkit-scrollbar-track {
    background: transparent;
  }
  .sidebar::-webkit-scrollbar-thumb {
    background: var(--pg-line);
    border-radius: 3px;
  }
  .sidebar::-webkit-scrollbar-thumb:hover {
    background: var(--pg-dim);
  }

  .panel-head h1 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .panel-head p {
    margin: 0.35rem 0 0;
    font-size: 0.72rem;
    line-height: 1.5;
    color: var(--pg-dim);
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding-top: 1rem;
    border-top: 1px solid var(--pg-line);
  }
  .group h2 {
    margin: 0 0 0.2rem;
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pg-dim);
  }
  .group-actions {
    display: flex;
    gap: 0.4rem;
  }

  .hint {
    margin: 0.1rem 0 0;
    font-size: 0.66rem;
    line-height: 1.5;
    color: var(--pg-dim);
  }

  /* --- collapsible sidebar groups ---------------------------------------- */

  .collapsible > summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    list-style: none;
    user-select: none;
  }
  .collapsible > summary::-webkit-details-marker {
    display: none;
  }
  .collapsible > summary:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .collapsible > summary h2 {
    margin: 0;
    flex: 1;
  }
  .chev {
    width: 7px;
    height: 7px;
    flex: none;
    border-right: 1.5px solid var(--pg-dim);
    border-bottom: 1.5px solid var(--pg-dim);
    transform: rotate(-45deg);
    transition: transform 120ms ease;
  }
  .collapsible[open] > summary .chev {
    transform: rotate(45deg);
  }
  .collapsible-body {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding-top: 0.55rem;
  }
  @media (prefers-reduced-motion: reduce) {
    .chev {
      transition: none;
    }
  }

  /* --- color mode -------------------------------------------------------- */

  .mode-row {
    display: grid;
    grid-template-columns: 3.4rem 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }
  .mode-row .lab {
    color: var(--pg-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .mode-btns {
    display: flex;
    gap: 0;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    overflow: hidden;
  }
  .mode-btn {
    flex: 1;
    font: inherit;
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--pg-dim);
    background: transparent;
    border: none;
    border-right: 1px solid var(--pg-line);
    padding: 0.3rem 0;
    cursor: pointer;
    transition: background 100ms ease, color 100ms ease;
  }
  .mode-btn:last-child {
    border-right: none;
  }
  .mode-btn:hover {
    color: var(--pg-text);
  }
  .mode-btn.active {
    background: var(--pg-line);
    color: var(--pg-text);
  }
  .mode-btn:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: -2px;
  }

  .hue-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .hue-swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex: none;
    box-shadow: 0 0 6px 1px currentColor;
  }
  .hue-row :global(.slider) {
    flex: 1;
  }

  /* --- intensity curve --------------------------------------------------- */

  .curve {
    width: 100%;
    height: 64px;
    display: block;
    background: #101016;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
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

  .layer {
    border: 1px solid var(--pg-line);
    border-radius: 6px;
    background: #14141a;
  }
  .layer summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.5rem 0.6rem;
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

  /* --- buttons & inputs ---------------------------------------------------- */

  .btn {
    font: inherit;
    font-size: 0.66rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--pg-text);
    background: transparent;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
  }
  .btn:hover {
    border-color: var(--pg-dim);
  }
  .btn:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn.accent {
    border-color: var(--pg-accent);
    color: var(--pg-accent);
  }

  .color-row {
    display: grid;
    grid-template-columns: 3.4rem auto 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }
  .color-row .lab {
    color: var(--pg-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .color-row .val {
    color: var(--pg-text);
    text-align: right;
  }
  .color-row input[type='color'] {
    width: 34px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    background: none;
    cursor: pointer;
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

  /* --- preview ------------------------------------------------------------ */

  .preview {
    position: relative;
    overflow: hidden;
  }
  .preview-frame {
    position: absolute;
    left: 0.9rem;
    bottom: 0.75rem;
    z-index: 1;
    pointer-events: none;
  }
  .preview-frame span {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
  }

  /* --- responsive ---------------------------------------------------------- */

  @media (max-width: 800px) {
    .playground {
      grid-template-columns: 1fr;
      grid-template-rows: 45vh 1fr;
      height: auto;
      min-height: 100dvh;
    }
    .preview {
      order: -1;
      min-height: 45vh;
    }
    .sidebar {
      border-right: none;
      border-top: 1px solid var(--pg-line);
    }
  }
</style>
