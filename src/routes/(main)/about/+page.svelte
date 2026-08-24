<script lang="ts">
  import { Accordion } from '@hyzer-labs/ui'
  import Metatags from '$lib/components/Metatags.svelte';
  import Currently from '$lib/components/Currently.svelte';
  import type { PageData } from './$types'

  // type="single" keeps only one panel open at a time
  const items = [
    { id: 'about', title: 'about' },
    { id: 'recent-activity', title: 'recent activity' },
    { id: 'colophon', title: 'colophon' },
    { id: 'contact', title: 'contact' },
  ]

  let { data }: { data: PageData } = $props();
  const { recentlyListened, recentlyWatched, recentlyPlayed, duolingo } = $derived(data);
</script>

<Metatags title="About" />

<section class="prose" id="content" tabindex="-1">
    <h1>information kiosk</h1>

    <Accordion {items} type="single" defaultOpen="about" headingLevel={2} class="about-accordion">
      {#snippet panel(item)}
        {#if item.id === 'about'}
          <p>heffner.dev is perpetually under construction, same as me <span class="surfer">🏄‍♂️</span></p>

          <p>parts <a href="/blog">blog,</a> <a href="/gallery">photo gallery,</a> and some <a href="/playground">playground</a> too.
             this website is my own personal <a href="https://joelhooks.com/digital-garden" target="_blank">digital garden</a>
          </p>

          <p>
            My name is <strong>tanner heffner</strong>, a software engineer of over a decade
            based out of <strong>portland, oregon</strong>. I still love the feeling when
            launching a fresh <strong>hello world!</strong>
          </p>

          <p>
            I enjoy disc golf, cooking, gardening, making art, riding bikes and plenty more.
            My girlfriend says I like to learn things the hard way, and I would say that's probably accurate.
            There's beauty in the struggle.
          </p>

          <a href="https://hyzer.sh" target="_blank">business</a>
          <a href="/resume" target="_blank">resume</a>
        {:else if item.id === 'colophon'}
          <p>this site is built with <a href="https://svelte.dev/docs/kit/introduction" target="_blank">sveltekit</a>. the codebase is <a href="https://github.com/tjheffner/heffdotdev">public on github</a>.</p>

          <p>the ui comes from my design system, <a href="https://design.hyzer.sh" target="_blank">@hyzer-labs/ui</a>.</p>

          <p>type is <a href="https://fonts.google.com/specimen/Merriweather" target="_blank">merriweather</a> and <a href="https://fonts.google.com/specimen/Mulish" target="_blank">mulish</a>, both from google fonts.</p>

          <p><a href="/heffdotdev-technical-details">this post</a> (and later, <a href="/2025-site-updates">this one</a>) explains more about the tools I chose and why.</p>
        {:else if item.id === 'recent-activity'}
          <Currently
            recentlyListened={recentlyListened}
            recentlyPlayed={recentlyPlayed}
            recentlyWatched={recentlyWatched}
            duolingo={duolingo}
          />
        {:else}
          <p>If you have questions, need a tech consultation, or are interested in working together, please send me an <a href="mailto:tanner@hyzer.sh">email.</a></p>

          <p>More details can be found at <a href="https://hyzer.sh" target="_blank">hyzer.sh</a></p>

          <p class="h1">✌️</p>
        {/if}
      {/snippet}
    </Accordion>

</section>

<style>
  section :global(.hz-accordion-item) {
    interpolate-size: allow-keywords;
    margin-bottom: var(--hz-space-away);
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
  /* The trigger is a flex row of [heading, chevron] aligned to flex-start, which
     leaves the 24px chevron sitting about 12px high against a 50px heading.
     Child combinator so this outweighs the component's own scoped rule. */
  section :global(.hz-accordion-item > .hz-accordion-trigger) {
    align-items: center;
  }
  section :global(.hz-accordion-icon) {
    color: var(--hz-intent-primary);
    transition: transform 0.3s ease;
  }
  section :global(.hz-accordion-item[data-state='open'] .hz-accordion-icon) {
    transform: rotate(180deg);
  }

  /* `scale` and `rotate` are separate properties here, not one packed
     `transform`, so the keyframes can own the wobble while a transition owns the
     size. That split is what lets hover-out ease back down. Only scale is
     transitioned: pulling an animation snaps its property to the base value
     rather than transitioning out of it, so a rotate transition would be dead
     CSS. */
  .surfer {
    display: inline-block; /* transforms don't apply to inline boxes */
    scale: 1;
    transition: scale 0.35s ease;
  }
  .surfer:hover {
    scale: 2.2;
    cursor: none; /* the pointer sits right on top of the wiggle otherwise */
    animation: shake 0.4s ease-in-out infinite;
  }
  @keyframes shake {
    0%, 100% { rotate: -10deg; }
    50%      { rotate: 10deg; }
  }
  /* scale still reads as a response to hover once the wobble is gone */
  @media (prefers-reduced-motion: reduce) {
    .surfer:hover {
      animation: none;
    }
  }
</style>
