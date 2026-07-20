<script lang="ts">
  import { collapseMenus } from '$lib/playground/ui';

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

  // Optional action hooks, wired to keyboard shortcuts (see onKeydown). A page
  // supplies the ones it has; missing ones simply do nothing.
  export let onShuffle: (() => void) | undefined = undefined;
  export let onReset: (() => void) | undefined = undefined;
  export let onUndo: (() => void) | undefined = undefined;
  export let onSavePng: (() => void) | undefined = undefined;
  export let onSaveVideo: (() => void) | undefined = undefined;
  export let onSaveScene: (() => void) | undefined = undefined;

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

  // The keyboard cheat-sheet shown in the title info card. Esc and "/" are
  // always available; the action keys appear only when the page wired that hook.
  $: shortcuts = [
    { k: 'Esc', label: 'Hide controls' },
    { k: '/', label: 'Toggle controls' },
    ...(onShuffle ? [{ k: 'F', label: 'Shuffle' }] : []),
    ...(onReset ? [{ k: 'R', label: 'Reset' }] : []),
    ...(onUndo ? [{ k: 'Z', label: 'Undo' }] : []),
    ...(onSavePng ? [{ k: 'P', label: 'Save PNG' }] : []),
    ...(onSaveVideo ? [{ k: 'V', label: 'Save video' }] : []),
    ...(onSaveScene ? [{ k: 'S', label: 'Save scene' }] : [])
  ];

  let controlsHidden = false;
  let titleOpen = false;
  const titleCardId = `pg-title-${Math.random().toString(36).slice(2, 8)}`;

  // Hiding the controls also closes every open menu (the title card here, and
  // each <Section> via the shared signal), so re-opening starts clean.
  function setHidden(v: boolean) {
    controlsHidden = v;
    if (v) {
      titleOpen = false;
      collapseMenus();
    }
  }
  const toggleControls = () => setHidden(!controlsHidden);

  // Keyboard: Esc hides the controls; "/" toggles them. F/R/P/S run the scene
  // actions (shuffle / reset / save PNG / save scene). All are ignored while
  // typing in a field or when a modifier is held, so browser combos (Cmd+S,
  // Cmd+R, Cmd+P) and text entry are never hijacked.
  function onKeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (e.key === 'Escape') {
      setHidden(true);
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === '/') {
      setHidden(!controlsHidden);
      e.preventDefault(); // don't trigger the browser's quick-find
    } else if (k === 'f' && onShuffle) {
      onShuffle();
      e.preventDefault();
    } else if (k === 'r' && onReset) {
      onReset();
      e.preventDefault();
    } else if (k === 'z' && onUndo) {
      onUndo();
      e.preventDefault();
    } else if (k === 'p' && onSavePng) {
      onSavePng();
      e.preventDefault();
    } else if (k === 'v' && onSaveVideo) {
      onSaveVideo();
      e.preventDefault();
    } else if (k === 's' && onSaveScene) {
      onSaveScene();
      e.preventDefault();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="playground" class:light-canvas={lightCanvas}>
  <slot name="preview" />

  <div class="control-layer" class:hidden={controlsHidden}>
    <div class="control-bar">
      <!-- Easter egg: reads as a plain title, but clicking it reveals an info
           card with the description and a link back to all experiments. Wrapped
           in an <h1> so each immersive page has a proper top-level heading (the
           heading wraps the button, which stays the interactive/visual chip). -->
      <h1 class="title-heading">
        <button
          class="title-chip"
          aria-expanded={titleOpen}
          aria-controls={titleCardId}
          on:click={() => (titleOpen = !titleOpen)}
        >{title}</button>
      </h1>
      {#if titleOpen}
        <section class="title-card" id={titleCardId} aria-label={`About ${title}`}>
          <header class="title-card-head">
            <h2>{title}</h2>
            <button class="card-close" aria-label="Close" on:click={() => (titleOpen = false)}>×</button>
          </header>
          {#if subtitle}<p class="title-sub">{subtitle}</p>{/if}
          <div class="title-keys">
            <h3>Shortcuts</h3>
            <ul>
              {#each shortcuts as s}
                <li><kbd>{s.k}</kbd> <span>{s.label}</span></li>
              {/each}
            </ul>
          </div>
          <a class="title-link" href="/playground">← Playground</a>
        </section>
      {/if}
      <slot />
      <div class="row-break" aria-hidden="true"></div>
      {#if $$slots.footer || onUndo}
        <div class="bar-actions">
          <slot name="footer" />
          {#if onUndo}
            <button class="btn" on:click={onUndo} title="Return to the previous scene — works across a refresh">Undo (Z)</button>
          {/if}
        </div>
      {/if}
      <!-- Sits in the right cluster (after the action buttons, before Hide); its
           card still drops below via the order-2 / row-break mechanism. -->
      <slot name="saved" />
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

  /* The heading wraps the chip but stays layout-neutral: it becomes the flex
     item (order 0, where the chip used to sit) and imposes no box of its own. */
  .title-heading {
    order: 0;
    margin: 0;
    padding: 0;
    display: inline-flex;
    align-items: center;
    font: inherit;
  }

  /* Easter egg: styled exactly like the old static title — no chip background,
     no chevron, default cursor — so nothing hints it's clickable. */
  .title-chip {
    order: 0;
    pointer-events: auto;
    margin: 0;
    padding: 0.34rem 0.2rem;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pg-chrome-fg);
    background: none;
    border: none;
    cursor: default;
    transition: color 160ms ease;
  }
  .title-chip:focus-visible {
    outline: 2px solid var(--pg-chrome-fg);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Info card — mirrors the <Section> card panel, drops below the bar (order 2). */
  .title-card {
    order: 2;
    align-self: flex-start;
    pointer-events: auto;
    flex: 0 0 clamp(220px, 22vw, 300px);
    max-width: calc(100vw - 1.5rem);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    background: rgba(20, 20, 26, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--pg-line);
    border-radius: 10px;
    padding: 0.7rem 0.8rem 0.85rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  }
  .title-card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .title-card-head h2 {
    margin: 0;
    flex: 1;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pg-dim);
  }
  .title-sub {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.55;
    color: var(--pg-text);
  }
  .title-keys h3 {
    margin: 0 0 0.35rem;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pg-dim);
  }
  .title-keys ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
  }
  .title-keys li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    color: var(--pg-text);
  }
  .title-keys kbd {
    flex: none;
    min-width: 1.7rem;
    text-align: center;
    font: inherit;
    font-size: 0.62rem;
    padding: 0.1rem 0.35rem;
    color: var(--pg-dim);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--pg-line);
    border-radius: 4px;
  }
  .title-link {
    font-size: 0.7rem;
    color: var(--pg-accent);
    text-decoration: none;
    width: fit-content;
  }
  .title-link:hover {
    text-decoration: underline;
  }
  .card-close {
    flex: none;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    font: inherit;
    font-size: 0.95rem;
    line-height: 1;
    color: var(--pg-dim);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }
  .card-close:hover {
    color: var(--pg-text);
    border-color: var(--pg-line);
  }
  .card-close:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  /* An odd trailing button spans the full width, so 3-button playgrounds don't
     leave a lonely half-width cell (4-button Poolside stays a clean 2×2). */
  :global(.playground .scene-actions .btn:last-child:nth-child(odd)) {
    grid-column: 1 / -1;
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
