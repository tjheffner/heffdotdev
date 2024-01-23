<script>
  const blendMode = [
    "normal",
    "multiply",
    "screen",
    // "overlay",
    // "darken",
    // "lighten",
    "color-dodge",
    "color-burn",
    // "hard-light",
    // "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity",
    // "plus-darker",
    // "plus-lighter",
  ]

  const emojis = [
    '🏔',
    '🌊',
    '🏜',
    '🥏',
    '👨‍🍳',
    '👻',
    '🌲',
    '🦌',
    '🦑',
    '🤠',
    '🍳'
  ]

  // all combinations of the above two arrays
  // ex: { e: '🌊', b: 'exclusion'}
  const full = emojis.map(
    e => {
      const bm = []

      blendMode.forEach(b => {
        return bm.push({e, b})
      })

      return bm
    }
  ).flat()

  // sort by random map, unmap to get new order
  function shuffleArray(array) {
    return array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
  }

  // reconstruct item from what was clicked, filter array to remove it
  function handleRemoval(event) {
    const data = event.target.dataset
    const r = {e: data.emoji, b: data.blend}

    const items = shuffled.filter(e => !(e.e === r.e && e.b === r.b))
    shuffled = shuffleArray(items)
  }

  // set initial shuffle to full list
  let shuffled = shuffleArray(full)
</script>

<div class="block text-shadow text-4xl mt-4 lg:mt-8 w-full max-h-[400px] lg:max-h-fit overflow-hidden lg:overflow-visible">
  {#each shuffled as f, i}
    <!-- <span>{i}</span> -->
    <button
      class="emoji emoji-{i} p-1 m-1 text-shadow"
      style="mix-blend-mode: {f.b}"
      data-emoji={f.e}
      data-blend={f.b}
      on:click={(event) => handleRemoval(event)}
    >
      {f.e}
    </button>
  {/each}
</div>

{#if shuffled.length < 50 && shuffled.length > 25}
  <p class="text-accent font-semibold text-xl my-4">keep going...</p>
{/if}
{#if shuffled.length <= 25 && shuffled.length > 0}
  <p class="text-accent font-semibold text-xl my-4">almost there...</p>
{/if}
{#if shuffled.length === 0}
  <!-- svelte-ignore a11y-distracting-elements -->
  <marquee class="text-shadow font-bold text-6xl py-8">🎉 {full.length} emojis clicked 🎉</marquee>
{/if}
