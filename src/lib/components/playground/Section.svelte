<script lang="ts">
  // A control group rendered as a floating pill that expands into a drop-down
  // card over the canvas. Pills sit in the shell's top row (flex order 0);
  // open cards flow onto the line(s) below the row-break (flex order 2).
  // Sections are independent — several can be open at once.
  import { collapseSignal } from '$lib/playground/ui';

  export let title: string;
  export let open = false;

  // Links the pill (button) to its card (region) for assistive tech.
  const uid = `pg-sec-${Math.random().toString(36).slice(2, 8)}`;

  const toggle = () => (open = !open);

  // Close when the shell hides the controls, so re-opening starts collapsed.
  let _collapseSeen: number | undefined;
  $: {
    const v = $collapseSignal;
    if (_collapseSeen === undefined) _collapseSeen = v;
    else if (v !== _collapseSeen) {
      _collapseSeen = v;
      open = false;
    }
  }
</script>

<button
  class="pill"
  class:active={open}
  aria-expanded={open}
  aria-controls={uid}
  on:click={toggle}
>
  <span class="pill-label">{title}</span>
  <span class="chev" class:up={open} aria-hidden="true"></span>
</button>

{#if open}
  <section class="card" id={uid} aria-label={title}>
    <header class="card-head">
      <h2>{title}</h2>
      <slot name="actions" />
      <button class="card-close" aria-label="Close {title}" on:click={toggle}>×</button>
    </header>
    <div class="card-body">
      <slot />
    </div>
  </section>
{/if}

<style>
  /* --- pill (collapsed state, lives in the top row) ----------------------- */
  .pill {
    order: 0;
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font: inherit;
    font-size: 0.66rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    /* Chrome colors flip with canvas luminance (set on .playground). */
    color: var(--pg-chrome-fg, var(--pg-text));
    background: var(--pg-chrome-chip, rgba(10, 10, 14, 0.62));
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--pg-chrome-line, var(--pg-line));
    border-radius: 999px;
    padding: 0.34rem 0.7rem;
    cursor: pointer;
    transition: color 160ms ease, background 160ms ease, border-color 120ms ease;
  }
  .pill:hover {
    border-color: var(--pg-chrome-fg, var(--pg-text));
  }
  /* Active = a solid monochrome swatch (no colored accent in the chrome). */
  .pill.active {
    color: var(--pg-chrome-on-solid, #16161c);
    background: var(--pg-chrome-solid, #e8e8ec);
    border-color: transparent;
  }
  .pill:focus-visible {
    outline: 2px solid var(--pg-chrome-fg, var(--pg-text));
    outline-offset: 2px;
  }
  .chev {
    width: 6px;
    height: 6px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(45deg);
    transition: transform 120ms ease;
    opacity: 0.8;
  }
  .chev.up {
    transform: rotate(-135deg);
  }

  /* --- card (expanded state, drops below the pill row) -------------------- */
  .card {
    order: 2;
    align-self: flex-start;
    pointer-events: auto;
    flex: 0 0 clamp(248px, 24vw, 328px);
    max-width: calc(100vw - 1.5rem);
    max-height: calc(100dvh - 4.5rem);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    /* Opaque enough that control text keeps contrast over any canvas art. */
    background: rgba(20, 20, 26, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--pg-line);
    border-radius: 10px;
    padding: 0.7rem 0.8rem 0.85rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    scrollbar-width: thin;
    scrollbar-color: var(--pg-line) transparent;
  }
  .card::-webkit-scrollbar {
    width: 6px;
  }
  .card::-webkit-scrollbar-thumb {
    background: var(--pg-line);
    border-radius: 3px;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .card-head h2 {
    margin: 0;
    flex: 1;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pg-dim);
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
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  @media (prefers-reduced-motion: reduce) {
    .chev {
      transition: none;
    }
  }
</style>
