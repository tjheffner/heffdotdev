<script lang="ts">
  import { Slider } from '@hyzer-labs/ui'

  // Thin wrapper over @hyzer-labs/ui's Slider, the same shape every other
  // component here takes over a hyzer primitive. It exists for two reasons:
  // the ~40 call sites across the playgrounds pass only `label`, and hyzer's
  // FieldBase requires a `name`; and the playground chrome is a compact
  // three-column row (label | track | value) rather than the stacked field
  // the library renders by default.
  let {
    label,
    value = $bindable(),
    min = 0,
    max = 100,
    step = 1,
    unit = '',
  }: {
    label: string
    value: number
    min?: number
    max?: number
    step?: number
    unit?: string
  } = $props()

  // Never submitted — these controls drive a canvas, not a form — so a slug of
  // the label is name enough, and it keeps the call sites to just `label`.
  let name = $derived(label.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
</script>

<div class="slider">
  <Slider {label} {name} {min} {max} {step} {unit} showInput bind:value />
</div>

<style>
  /* Collapse the stacked field into the playground's one-line row. The label
     is a real <label for> from hyzer's Field, so this is layout only. */
  .slider :global(.hz-field--slider) {
    display: grid;
    grid-template-columns: 3.4rem 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }

  .slider :global(.hz-field-label) {
    color: var(--hz-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  .slider :global(.hz-slider-row) {
    gap: 0.5rem;
  }

  .slider :global(.hz-slider-track) {
    flex: 1;
  }

  /* The exact-entry number field: bare, right-aligned, tabular so the digits
     don't jitter as you drag. */
  .slider :global(.hz-slider-number) {
    width: 3rem;
    font: inherit;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--hz-color-text);
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    padding: 1px 0;
    border-radius: 0;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .slider :global(.hz-slider-number::-webkit-outer-spin-button),
  .slider :global(.hz-slider-number::-webkit-inner-spin-button) {
    -webkit-appearance: none;
    margin: 0;
  }
  .slider :global(.hz-slider-number:hover) {
    border-bottom-color: var(--hz-color-border);
  }
  .slider :global(.hz-slider-number:focus) {
    outline: none;
    border-bottom-color: var(--hz-intent-primary);
  }

  .slider :global(.hz-slider-unit) {
    color: var(--hz-color-text-muted);
    flex: none;
  }

  /* Hairline track, dot thumb. */
  .slider :global(.hz-slider) {
    width: 100%;
    height: 2px;
    appearance: none;
    -webkit-appearance: none;
    background: var(--hz-palette-track);
    border-radius: 1px;
    cursor: pointer;
  }
  .slider :global(.hz-slider::-webkit-slider-thumb) {
    appearance: none;
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--hz-intent-primary);
    border: none;
  }
  .slider :global(.hz-slider::-moz-range-thumb) {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--hz-intent-primary);
    border: none;
  }
  .slider :global(.hz-slider:focus-visible) {
    outline: 2px solid var(--hz-intent-primary);
    outline-offset: 4px;
  }
</style>
