<script lang="ts">
  // A collapsible sidebar group. Put controls in the default slot; optional
  // summary buttons (e.g. Add / Copy) go in the "actions" slot.
  export let title: string;
  export let open = true;
</script>

<!-- Actions live *outside* <summary> (a summary is itself a button, so nesting
  buttons in it fails axe's nested-interactive rule) but *inside* .group so they
  overlay the header row. They sit outside <details> visually via absolute
  positioning, which keeps them shown even when the section is collapsed. -->
<div class="group">
  <details class="collapsible" {open}>
    <summary>
      <h2>{title}</h2>
      <span class="chev" aria-hidden="true"></span>
    </summary>
    <div class="collapsible-body">
      <slot />
    </div>
  </details>
  {#if $$slots.actions}
    <div class="section-actions">
      <slot name="actions" />
    </div>
  {/if}
</div>

<style>
  .group {
    position: relative;
    padding-top: 1rem;
    border-top: 1px solid var(--pg-line);
  }
  .collapsible {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .section-actions {
    position: absolute;
    top: 1rem;
    right: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    /* vertically center the (taller) action buttons on the summary text row */
    height: 1.2rem;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.2rem;
    cursor: pointer;
    list-style: none;
    user-select: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
  h2 {
    margin: 0;
    flex: 1;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pg-dim);
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
</style>
