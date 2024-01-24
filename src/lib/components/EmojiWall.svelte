<script>
  const WALL_SIZE = 84

  // The first emoji in the array becomes the dominant background
  // The others intersperse randomly
  const emojis = [
    ['🌊','🦑','🦀','🐳','🦐','🐡','🐠','🦈','🏄‍♂️','🏝'],
    ['🌳','🦥','🦜','🐊','🐸','🐒','🌺','🍄','🐯','🐜'],
    ['🏜','🌵','🌞','🦂','🐍','🤠','🦇','🦉','🐫'],
    ['🏔','🏕','🌲','🦅','🌝','🏂']
  ]

  // randomly replace array elements with something else
  function fillRandom(array, fill, count) {
    return function () {
        const indices = new Set();
        do {
          indices.add(Math.floor(Math.random() * array.length));
        } while (indices.size < count)
        return array.map((v, i) => indices.has(i) ? fill[Math.floor(Math.random() * fill.length)] : v);
    };
  }

  // Create the emoji walls.
  const scenes = []
  emojis.forEach(set => {
    const background = set.shift()
    let wall = Array(WALL_SIZE).fill(background)
    wall = fillRandom(wall, set, 18)()

    return scenes.push(wall)
  })

  // sort an array by random map, unmap to get new order
  function shuffleArray(array) {
    return array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
  }

  // increment counter and update visible wall
  function changeWall() {
    initial++
    if (initial === scenes.length) initial = 0

    visible = shuffleArray(scenes[initial])
  }

  // set default wall
  let initial = 0
  let visible = shuffleArray(scenes[initial])
</script>

<div class="block text-shadow text-4xl md:text-6xl mt-4 lg:mt-8 w-full max-h-[400px] md:max-h-[450px] overflow-hidden lg:overflow-visible" aria-hidden="true">
  {#each visible as f, i}
    <!-- <span>{i}</span> -->
    <button
      class="emoji emoji-{i} p-1 m-1 text-shadow"
      on:click={() => changeWall()}
    >
      {f}
    </button>
  {/each}
</div>
