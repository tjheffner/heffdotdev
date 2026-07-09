<script lang="ts">
  // Fullscreen canvas + a floating control layer over it.
  // Default slot: <Section> pills (they render a pill in the top row and an
  // expanding card below). "footer" slot: action buttons, shown as a cluster
  // at the right of the pill row. "preview" slot: the <main class="preview">
  // canvas, which fills the viewport behind the controls.
  export let title: string;
  export let subtitle = '';
  // Hex color of the canvas backdrop, so the chrome can flip light/dark to stay
  // legible over it. Pages pass their current bg (or a stand-in when transparent).
  export let bg = '';
  // Optional override: when a page samples the real canvas pixels under the
  // chrome (e.g. Triangles, which can be zoomed past its background), it passes
  // the result here and it wins over the bg-color guess.
  export let lightChrome: boolean | undefined = undefined;

  // Perceived luminance (Rec. 601). Light backdrop → dark chrome, and vice versa.
  function isLight(hex: string): boolean {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return false;
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const int = parseInt(h, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }
  $: lightCanvas = lightChrome ?? isLight(bg);

  let controlsHidden = false;
  const toggleControls = () => (controlsHidden = !controlsHidden);

  // Esc hides the control layer for a clean full-canvas view; "/" toggles it
  // (matching the blog's search shortcut). Ignore "/" while typing in a field.
  function onKeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (e.key === 'Escape') controlsHidden = true;
    else if (e.key === '/' && !typing) {
      controlsHidden = !controlsHidden;
      e.preventDefault(); // don't trigger the browser's quick-find
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="playground" class:light-canvas={lightCanvas}>
  <slot name="preview" />

  <div class="control-layer" class:hidden={controlsHidden}>
    <div class="control-bar">
      <h1 class="title-chip" title={subtitle}>{title}</h1>
      <slot />
      <div class="row-break" aria-hidden="true"></div>
      {#if $$slots.footer}
        <div class="bar-actions"><slot name="footer" /></div>
      {/if}
      <button class="chrome-pill hide-toggle" on:click={toggleControls} title="Hide controls">
        Hide (Esc)
      </button>
    </div>
  </div>

  {#if controlsHidden}
    <button class="chrome-pill show-toggle" on:click={toggleControls} title="Show controls">
      Controls (/)
    </button>
  {/if}
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

    /* Chrome colors flip with the canvas luminance (see .light-canvas). These
     * drive the title and the pill/action chips so they read over any backdrop. */
    --pg-chrome-fg: #e8e8ec;
    --pg-chrome-chip: rgba(10, 10, 14, 0.62);
    --pg-chrome-line: var(--pg-line);
    /* Monochrome "selected" fill for the active pill (no colored accent up in
     * the chrome): a solid swatch of the fg color with inverted text. */
    --pg-chrome-solid: #e8e8ec;
    --pg-chrome-on-solid: #16161c;

    position: relative;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    font-family: ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
    color: var(--pg-text);
    background: var(--pg-bg);
  }

  /* Light canvas → dark chrome (light chip, dark text, darker hairline). */
  .playground.light-canvas {
    --pg-chrome-fg: #16161c;
    --pg-chrome-chip: rgba(246, 246, 249, 0.66);
    --pg-chrome-line: rgba(0, 0, 0, 0.18);
    --pg-chrome-solid: #1c1c22;
    --pg-chrome-on-solid: #f2f2f5;
  }

  /* --- floating control layer --------------------------------------------- */
  /* The layer spans the viewport but is click-through; only the pills, cards,
   * and action cluster opt back into pointer events, so canvas drag/zoom keeps
   * working everywhere except directly on a control. */
  .control-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
  .control-layer.hidden {
    display: none;
  }
  .control-bar {
    position: absolute;
    inset: 0.75rem 0.75rem auto 0.75rem;
    display: flex;
    flex-wrap: wrap;
    /* Center the pill row; open cards top-align themselves (.card align-self). */
    align-items: center;
    gap: 0.5rem;
    pointer-events: none;
  }
  /* Forces open cards (order 2) onto the line(s) below the pill row (order 0). */
  .row-break {
    order: 1;
    flex-basis: 100%;
    height: 0;
  }

  .title-chip {
    order: 0;
    pointer-events: auto;
    margin: 0;
    padding: 0.34rem 0.2rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pg-chrome-fg);
    transition: color 160ms ease;
    cursor: default;
  }
  .bar-actions {
    order: 0;
    pointer-events: auto;
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 0.4rem;
  }
  /* No wrapping pill (it isn't a collapsible menu); each button carries its own
   * translucent chip so it stays legible over the canvas without adding a
   * border-box that shifts the row when sections open/close. */
  .bar-actions :global(.btn) {
    color: var(--pg-chrome-fg);
    background: var(--pg-chrome-chip);
    border-color: var(--pg-chrome-line);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  /* Chrome pills: the Hide (in-bar) and Controls (when hidden) toggles. */
  .chrome-pill {
    pointer-events: auto;
    font: inherit;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--pg-chrome-fg);
    background: var(--pg-chrome-chip);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--pg-chrome-line);
    border-radius: 999px;
    padding: 0.34rem 0.7rem;
    cursor: pointer;
  }
  .chrome-pill:hover {
    border-color: var(--pg-chrome-fg);
  }
  .chrome-pill:focus-visible {
    outline: 2px solid var(--pg-chrome-fg);
    outline-offset: 2px;
  }
  .hide-toggle {
    order: 0;
  }
  .show-toggle {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 3;
  }

  /* --- shared kit (styles the slotted sidebar content) -------------------- */

  :global(.playground .hint) {
    margin: 0.1rem 0 0;
    font-size: 0.66rem;
    line-height: 1.5;
    color: var(--pg-dim);
  }

  :global(.playground .btn) {
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
  :global(.playground .btn:hover) {
    border-color: var(--pg-dim);
  }
  :global(.playground .btn:focus-visible) {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
  }
  :global(.playground .btn:disabled) {
    opacity: 0.4;
    cursor: not-allowed;
  }
  :global(.playground .btn.accent) {
    border-color: var(--pg-accent);
    color: var(--pg-accent);
  }
  :global(.playground .btn.accent:hover) {
    border-color: #ff8a5c;
  }
  :global(.playground .btn.block) {
    width: 100%;
    padding: 0.5rem 0.6rem;
  }
  :global(.playground .scene-actions) {
    display: flex;
    gap: 0.5rem;
  }
  :global(.playground .scene-actions .btn) {
    flex: 1;
  }
  :global(.playground .group-actions) {
    display: flex;
    gap: 0.4rem;
  }

  :global(.playground .mode-row) {
    display: grid;
    grid-template-columns: 3.4rem 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }
  :global(.playground .mode-row .lab) {
    color: var(--pg-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  :global(.playground .mode-btns) {
    display: flex;
    gap: 0;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    overflow: hidden;
  }
  :global(.playground .mode-btn) {
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
  :global(.playground .mode-btn:last-child) {
    border-right: none;
  }
  :global(.playground .mode-btn:hover) {
    color: var(--pg-text);
  }
  :global(.playground .mode-btn.active) {
    background: var(--pg-line);
    color: var(--pg-text);
  }
  :global(.playground .mode-btn:focus-visible) {
    outline: 2px solid var(--pg-accent);
    outline-offset: -2px;
  }

  :global(.playground .hue-row) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  :global(.playground .hue-swatch) {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex: none;
    box-shadow: 0 0 6px 1px currentColor;
  }
  :global(.playground .hue-row .slider) {
    flex: 1;
  }

  :global(.playground .toggle-row) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.7rem;
  }
  :global(.playground .toggle-row .lab) {
    color: var(--pg-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  :global(.playground .toggle-row input) {
    accent-color: var(--pg-accent);
  }

  :global(.playground .color-row) {
    display: grid;
    grid-template-columns: 3.4rem auto 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }
  :global(.playground .color-row .lab) {
    color: var(--pg-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  :global(.playground .color-row .val) {
    color: var(--pg-text);
    text-align: right;
  }
  :global(.playground .color-row input[type='color']) {
    width: 34px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    background: none;
    cursor: pointer;
  }

  /* --- preview ------------------------------------------------------------ */

  :global(.playground .preview) {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
  }
  :global(.playground .preview-frame) {
    position: absolute;
    left: 0.9rem;
    bottom: 0.75rem;
    z-index: 1;
    pointer-events: none;
  }
  :global(.playground .preview-frame span) {
    display: inline-block;
    padding: .25rem 0.5rem;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.35);
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
  }

  /* --- responsive --------------------------------------------------------- */

  @media (max-width: 640px) {
    .control-bar {
      inset: 0.5rem 0.5rem auto 0.5rem;
      gap: 0.4rem;
    }
    .title-chip {
      /* On phones the pills need the width; keep the title compact. */
      font-size: 0.72rem;
    }
  }
</style>
