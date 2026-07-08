<script lang="ts">
  export let label: string;
  export let value: number;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let unit = '';

  // Show the same precision the step implies, without trailing float noise.
  $: decimals = step < 1 ? String(step).split('.')[1]?.length ?? 2 : 0;
  $: display = Number(value).toFixed(decimals);
</script>

<label class="slider">
  <span class="lab">{label}</span>
  <input type="range" bind:value {min} {max} {step} />
  <span class="val">{display}{unit}</span>
</label>

<style>
  .slider {
    display: grid;
    grid-template-columns: 3.4rem 1fr 3.2rem;
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
  .val {
    color: var(--pg-text, #e8e8ec);
    font-variant-numeric: tabular-nums;
    text-align: right;
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