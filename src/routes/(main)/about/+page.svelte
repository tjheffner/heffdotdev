<script lang="ts">
  import { Accordion } from '@hyzer-labs/ui'
  import Metatags from '$lib/components/Metatags.svelte';

  // type="single" keeps only one panel open at a time — the old `linked` behavior
  const items = [
    { id: 'about-me', title: 'about me' },
    { id: 'about-this-site', title: 'about this site' },
    { id: 'contact', title: 'contact' },
  ]
</script>

<Metatags title="About" />

<section class="prose" id="content" tabindex="-1">
    <h1>information kiosk</h1>

    <Accordion {items} type="single" defaultOpen="about-me" headingLevel={2} class="about-accordion">
      {#snippet panel(item)}
        {#if item.id === 'about-me'}
          <p>My name is <strong>tanner heffner</strong> and I am based out of <strong>portland, oregon</strong>.</p>

          <p>
            I enjoy disc golf, cooking, gardening, making art, riding bikes and plenty more.
            My girlfriend says I like to learn things the hard way, and I would say that's probably accurate.
            There's beauty in the struggle.
          </p>

          <p>A software engineer for over a decade and I still love the feeling when launching a fresh <strong>hello world!</strong></p>

          <a href="/resume" target="_blank">[resume]</a>
        {:else if item.id === 'about-this-site'}
          <div class="tall">
            <p>heffner.dev is perpetually under construction, same as me 🏄‍♂️</p>

            <p>parts <a href="/blog">blog,</a> and <a href="/gallery">photo gallery,</a> a dash of <a href="/about/latest">activity tracker,</a> and some <a href="/playground">playground</a> too.
               this website is my own personal <a href="https://joelhooks.com/digital-garden" target="_blank">digital garden</a>
            </p>

            <p>
              it is built with <a href="https://svelte.dev/docs/kit/introduction" target="_blank">sveltekit</a>.
              the codebase is <a href="https://github.com/tjheffner/heffdotdev">public on github</a> and hosted via netlify.
            <a href="/heffdotdev-technical-details">this post</a> (and later, <a href="/2025-site-updates">this one</a>) explains more about the tools I chose and why.</p>
          </div>
        {:else}
          <p>If you have questions, need a tech consultation, or are interested in working together, please send me an <a href="mailto:tanner@hyzer.sh">email.</a></p>

          <p>More details can be found at <a href="https://hyzer.sh" target="_blank">hyzer.sh</a></p>

          <p class="h1">✌️</p>
        {/if}
      {/snippet}
    </Accordion>

</section>

<style>
  /* port of the old Details.svelte styles onto the accordion's hooks */
  section :global(.hz-accordion-item) {
    interpolate-size: allow-keywords;
    margin-bottom: var(--space-away);
  }
  section :global(.hz-accordion-item::details-content) {
    transition:
      block-size 1s,
      content-visibility 1s allow-discrete;
    overflow: hidden;
    block-size: 0;
  }
  section :global(.hz-accordion-item[open]::details-content) {
    block-size: auto;
  }
  section :global(.hz-accordion-icon) {
    color: var(--c-accent);
    transition: transform 0.3s ease;
  }
  section :global(.hz-accordion-item[data-state='open'] .hz-accordion-icon) {
    transform: rotate(180deg);
  }

  /* helpful if the children contain a lot of links */
  .tall > p {
    margin-bottom: var(--space-away);
  }
</style>
