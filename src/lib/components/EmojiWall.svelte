<script>
  const WALL_SIZE = 96

  // The first emoji in the array becomes the dominant background
  // The others intersperse randomly
  const emojis = [
    ['🌊','🦑','🦀','🐳','🦐','🐡','🐠','🦈','🏄‍♂️','🏝','🦞','🐋'],
    ['🌳','🦥','🦜','🐊','🐸','🐒','🌺','🍄','🐯','🐜','🦟','🐝'],
    ['🏜','🌵','🌞','🦂','🐍','🤠','🦇','🦉','🐫', '🦗'],
    ['🏔','🏕','🌲','🦅','🌝','🏂']
  ]

  // replace `count` random elements with values pulled from `fill`
  function fillRandom(array, fill, count) {
    return function () {
        const indices = new Set();
        do {
          indices.add(Math.floor(Math.random() * array.length));
        } while (indices.size < count)
        return array.map((v, i) => indices.has(i) ? fill[Math.floor(Math.random() * fill.length)] : v);
    };
  }

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

  function changeWall() {
    initial++
    if (initial === scenes.length) initial = 0

    visible = shuffleArray(scenes[initial])
  }

  let initial = 0
  let visible = $state(shuffleArray(scenes[initial]))
</script>

<div class="emoji-wall" aria-hidden="true">
  {#each visible as f, i}
    <button
      class="emoji emoji-{i} p-1 m-1"
      onclick={() => changeWall()}
    >
      {f}
    </button>
  {/each}
</div>


<style>
  .emoji-wall {
    display: block;
    font-size: 4rem;
    padding: 4rem;
    width: 100%;
    max-height: 415px;
    overflow: hidden;
  }
  .emoji {
    display: inline-block;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .emoji:hover {
    transform: scale(2);
  }
</style>