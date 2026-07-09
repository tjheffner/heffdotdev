<script lang="ts">
  export let label: string;
  export let value: number;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let unit = '';

  // Clamp on blur so partial/out-of-range typing is tidied without fighting
  // the user mid-keystroke (clamping on every input blocks typing e.g. "100").
  function sanitize(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    let n = Number(el.value);
    if (Number.isNaN(n)) n = min;
    value = Math.min(max, Math.max(min, n));
  }
</script>

<label class="slider">
  <span class="lab">{label}</span>
  <input class="range" type="range" bind:value {min} {max} {step} />
  <span class="num">
    <input
      class="field"
      type="number"
      bind:value
      {min}
      {max}
      {step}
      on:blur={sanitize}
      aria-label={label}
    />
    {#if unit}<span class="unit">{unit}</span>{/if}
  </span>
</label>

<style>
  .slider {
    display: grid;
    grid-template-columns: 3.4rem 1fr auto;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }
  .lab {
    color: var(--pg-dim, #8a8a93);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .num {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 1px;
  }
  .field {
    width: 3rem;
    font: inherit;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--pg-text, #e8e8ec);
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    padding: 1px 0;
    border-radius: 0;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .field::-webkit-outer-spin-button,
  .field::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .field:hover {
    border-bottom-color: var(--pg-line, #26262e);
  }
  .field:focus {
    outline: none;
    border-bottom-color: var(--pg-accent, #ff6b35);
  }
  .unit {
    color: var(--pg-dim, #8a8a93);
    flex: none;
  }
  input[type='range'] {
    width: 100%;
    height: 2px;
    appearance: none;
    -webkit-appearance: none;
    background: var(--pg-track, #2a2a31);
    border-radius: 1px;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--pg-accent, #ff6b35);
    border: none;
  }
  input[type='range']::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--pg-accent, #ff6b35);
    border: none;
  }
  input[type='range']:focus-visible {
    outline: 2px solid var(--pg-accent, #ff6b35);
    outline-offset: 4px;
  }
</style>
