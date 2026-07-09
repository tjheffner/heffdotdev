<script lang="ts">
  // Index of playground experiments. Matches the immersive dark aesthetic of
  // the experiments it links to (see PlaygroundShell for the shared palette).
  const experiments = [
    {
      href: '/playground/glowfield',
      title: 'Glowfield',
      blurb: 'Tune an ambient, scroll-reactive cloud of light.',
    },
    {
      href: '/playground/triangles',
      title: 'Triangle Wrangler',
      blurb: 'Generate a faceted, low-poly triangle scene.',
    },
    {
      href: '/christmas',
      title: 'Christmas',
      blurb: 'A dinner invitation with merriment and cheer.',
    },
  ]
</script>

<svelte:head>
  <title>Playground | heffner.dev</title>
  <meta name="description" content="Interactive experiments and toys." />
</svelte:head>

<main class="playground-index">
  <div class="wrap">
    <header class="head">
      <h1>Playground</h1>
    </header>

    <ul class="grid">
      {#each experiments as x}
        <li>
          <a class="card" href={x.href}>
            <span class="card-title">{x.title}</span>
            <span class="card-blurb">{x.blurb}</span>
            <span class="card-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      {/each}
    </ul>

    <a class="back" href="/about">← back to heffner.dev</a>
  </div>
</main>

<style>
  :global(html, body) {
    margin: 0;
  }

  .playground-index {
    --pg-bg: #101015;
    --pg-panel: #16161c;
    --pg-line: #26262e;
    --pg-text: #e8e8ec;
    --pg-dim: #8a8a93;
    --pg-accent: #ff6b35;

    display: flex;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: clamp(2rem, 8vh, 6rem) 1.25rem;
    box-sizing: border-box;
    font-family: ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
    color: var(--pg-text);
    background: var(--pg-bg);
  }

  .wrap {
    width: 100%;
    max-width: 640px;
  }

  .head h1 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .grid {
    list-style: none;
    margin: 2rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .card {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'title arrow'
      'blurb arrow';
    align-items: center;
    gap: 0.15rem 1rem;
    padding: 1rem 1.1rem;
    border: 1px solid var(--pg-line);
    border-radius: 6px;
    background: var(--pg-panel);
    text-decoration: none;
    color: inherit;
    transition: border-color 120ms ease, transform 120ms ease;
  }
  .card:hover {
    border-color: var(--pg-accent);
    transform: translateX(2px);
  }
  .card:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
  }

  .card-title {
    grid-area: title;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .card-blurb {
    grid-area: blurb;
    font-size: 0.7rem;
    line-height: 1.5;
    color: var(--pg-dim);
  }
  .card-arrow {
    grid-area: arrow;
    font-size: 1rem;
    color: var(--pg-dim);
    transition: color 120ms ease;
  }
  .card:hover .card-arrow {
    color: var(--pg-accent);
  }

  .back {
    display: inline-block;
    margin-top: 2rem;
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    color: var(--pg-dim);
    text-decoration: none;
  }
  .back:hover {
    color: var(--pg-text);
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: border-color 120ms ease;
    }
    .card:hover {
      transform: none;
    }
  }
</style>
