<script lang="ts">
  import { Accordion } from '@hyzer-labs/ui'
  import Metatags from '$lib/components/Metatags.svelte';
  import Currently from '$lib/components/Currently.svelte';
  import type { PageData } from './$types'

  // type="single" keeps only one panel open at a time — the old `linked` behavior
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
          <p>My name is <strong>tanner heffner</strong> and I am based out of <strong>portland, oregon</strong>.</p>

          <p>
            I enjoy disc golf, cooking, gardening, making art, riding bikes and plenty more.
            My girlfriend says I like to learn things the hard way, and I would say that's probably accurate.
            There's beauty in the struggle.
          </p>

          <p>A software engineer for over a decade and I still love the feeling when launching a fresh <strong>hello world!</strong></p>

          <p>heffner.dev is perpetually under construction, same as me <span class="surfer">🏄‍♂️</span></p>

          <p>parts <a href="/blog">blog,</a> <a href="/gallery">photo gallery,</a> and some <a href="/playground">playground</a> too.
             this website is my own personal <a href="https://joelhooks.com/digital-garden" target="_blank">digital garden</a>
          </p>

          <a href="https://hyzer.sh" target="_blank">[business]</a>
          <a href="/resume" target="_blank">[resume]</a>
        {:else if item.id === 'colophon'}
          <p>
            built with <a href="https://svelte.dev/docs/kit/introduction" target="_blank">sveltekit</a>,
            hosted on netlify, and <a href="https://github.com/tjheffner/heffdotdev">public on github</a>.
            every post and gallery is a github issue, so the writing lives where the code does.
          </p>

          <p>
            the components and design tokens come from <a href="https://design.hyzer.sh" target="_blank">@hyzer-labs/ui</a>.
            palette, type scale, spacing and density are all authored in one config file and generated into css —
            one place to change how the whole site looks, instead of hunting through stylesheets.
          </p>

          <p>
            headings are merriweather, body is mulish, and the colors are written in oklch.
            spacing follows <a href="https://complementary.space/" target="_blank">complementary space</a>:
            two distances, near and away, that tighten automatically as regions nest inside each other.
          </p>

          <p>
            photos are resized on the fly by netlify's image cdn, since they come off github at full camera size.
            code is highlighted on the server by <a href="https://shiki.style" target="_blank">shiki</a>,
            using a theme I built for this palette rather than a stock one.
          </p>

          <p>
            color contrast is checked in ci, and every page gets scanned by
            <a href="https://playwright.dev" target="_blank">playwright</a> +
            <a href="https://www.deque.com/axe/" target="_blank">axe</a> before it ships.
            accessible is the whole point of building it myself.
          </p>

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
  /* port of the old Details.svelte styles onto the accordion's hooks */
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
  section :global(.hz-accordion-icon) {
    color: var(--hz-intent-primary);
    transition: transform 0.3s ease;
  }
  section :global(.hz-accordion-item[data-state='open'] .hz-accordion-icon) {
    transform: rotate(180deg);
  }

  /* `scale` and `rotate` are separate properties, not one packed `transform`,
     so the keyframes can own the wobble while a transition owns the size. That
     split is what lets hover-out ease back down: a lone `animation: shake` on
     :hover has nothing to interpolate and snaps the instant the cursor leaves.
     Only scale is transitioned — pulling an animation snaps its property to the
     base value rather than transitioning out of it, so a rotate transition here
     would be dead CSS. The tilt does drop instantly, but it's ±10deg against a
     0.35s glide back to size; the eye follows the size. */
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
  /* the scale is the part that still reads as a response to hover once the
     wobble is gone */
  @media (prefers-reduced-motion: reduce) {
    .surfer:hover {
      animation: none;
    }
  }
</style>
