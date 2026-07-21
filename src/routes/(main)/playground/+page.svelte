<script lang="ts">
  import Metatags from '$lib/components/Metatags.svelte'

  // Landing page for the playground. Lives in (main) so it wears the site
  // chrome/type; the individual experiments stay in (nowrapper) and go
  // full-bleed immersive on their own.
  const experiments = [
    {
      href: '/playground/plotter',
      title: 'Plotter',
      blurb: 'Rule-driven pens travel a grid.',
    },
    {
      href: '/playground/feather',
      title: 'Feather',
      blurb: 'Layered ink sweeps from curves you draw.',
    },
    {
      href: '/playground/mosaic',
      title: 'Mosaic',
      blurb: 'Seed a grid of shapes.',
    },
    {
      href: '/playground/poolside',
      title: 'Poolside',
      blurb: 'Shimmering light on a pool surface.',
    },
    {
      href: '/playground/kaleidoscope',
      title: 'Kaleidoscope',
      blurb: 'Build your own symmetric bloom.',
    },
    {
      href: '/playground/triangles',
      title: 'Shatter',
      blurb: 'Generate a faceted, low-poly triangle scene.',
    },
    {
      href: '/playground/glowfield',
      title: 'Glowfield',
      blurb: 'Tune an ambient, scroll-reactive cloud of light.',
    },
    {
      href: '/christmas',
      title: 'Christmas',
      blurb: 'A dinner invitation with merriment and cheer.',
    },
  ]
</script>

<Metatags
  title="Playground"
  description="Interactive experiments and one-offs."
  ogMessage="Playground"
/>

<section data-density-shift id="content" tabindex="-1">
  <h1>Playground</h1>
  <p>
    Interactive experiments and one-offs. Each opens
    full-screen.
  </p>

  <hr />

  <ul class="clean-list">
    {#each experiments as x}
      <li data-density-shift class="post">
        <a class="post-link" href={x.href}>
          <div class="left">
            <h2>{x.title}</h2>
            <p>{x.blurb}</p>
          </div>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  /* Mirrors PostItem: dashed accent divider, title shifts to secondary on
     hover. No dates/right-column — experiments carry no metadata. */
  .post {
    margin: var(--space-away) 0;
    border-bottom: 1px dashed var(--c-accent);

    &:last-child {
      border-bottom: none;
    }
  }

  .post-link {
    text-decoration: none;
    width: 100%;
    padding: var(--space-away) var(--space-near);
    display: flex;
    flex-direction: column;
    color: var(--c-text);
  }
  .post:hover h2 {
    color: var(--c-secondary);
  }

  .left {
    flex-grow: 1;
  }
</style>
