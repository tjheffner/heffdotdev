<script lang="ts">
  // Shared sidebar + preview scaffolding for the playgrounds.
  // Default slot: sidebar sections. "footer" slot: pinned action buttons.
  // "preview" slot: the <main class="preview"> canvas area.
  export let title: string;
  export let subtitle = '';
</script>

<div class="playground">
  <aside class="sidebar">
    <div class="sidebar-scroll">
      <header class="panel-head">
        <h1>{title}</h1>
        {#if subtitle}<p>{subtitle}</p>{/if}
      </header>
      <slot />
    </div>
    {#if $$slots.footer}
      <div class="sidebar-footer">
        <slot name="footer" />
      </div>
    {/if}
  </aside>
  <slot name="preview" />
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

  /* --- sidebar shell ------------------------------------------------------ */

  .sidebar {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid var(--pg-line);
    background: var(--pg-panel);
  }
  .sidebar-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    /* Reserve the scrollbar's space so content doesn't shift when it appears. */
    scrollbar-gutter: stable;
    padding: 1.1rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    scrollbar-width: thin;
    scrollbar-color: var(--pg-line) transparent;
  }
  .sidebar-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .sidebar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .sidebar-scroll::-webkit-scrollbar-thumb {
    background: var(--pg-line);
    border-radius: 3px;
  }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--pg-dim);
  }
  .sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
    border-top: 1px solid var(--pg-line);
    background: var(--pg-panel);
  }

  .panel-head h1 {
    margin: 0;
    font-size: 1.05rem;
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
    position: relative;
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

  @media (max-width: 800px) {
    .playground {
      grid-template-columns: 1fr;
      grid-template-rows: 45vh 1fr;
      height: auto;
      min-height: 100dvh;
    }
    :global(.playground .preview) {
      order: -1;
      min-height: 45vh;
    }
    .sidebar {
      border-right: none;
      border-top: 1px solid var(--pg-line);
    }
  }
</style>
