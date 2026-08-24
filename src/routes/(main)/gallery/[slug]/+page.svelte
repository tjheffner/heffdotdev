<script lang="ts">
  import type { BaseContentItem } from '$lib/types.js'
  import Comments from '$lib/components/Comments.svelte'
  import Metatags from '$lib/components/Metatags.svelte'
  import TableOfContents from '$lib/components/TableOfContents.svelte';
  import { lightboxGroup } from '@hyzer-labs/ui'
  // The viewer's skin, cherry-picked rather than the full theme. It lives in the
  // hz-theme cascade layer, so unlayered site CSS still wins, and its carousel
  // rules are scoped under .hz-lightbox, so Currently's rail is untouched.
  import '@hyzer-labs/ui/theme/components/lightbox.css'

  let { data } = $props();
  let json: BaseContentItem = $derived(data.json) // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates
</script>

<Metatags
  title={json.title}
  description={json.description}
  ogMessage={json.title}
  canonical={'gallery/' + json.slug}
/>

<TableOfContents type='gallery'/>

<article
  data-density-shift
  class="article"
  id="content"
  tabindex="-1"
>
  {#if json.title}
    <div class="details">
      <h1>{json.title}</h1>

      <div class="side small" data-density-shift>
        <span>({json.date.toString().slice(0, 4)})</span>
      </div>
    </div>
  {/if}

  <div class="prose" {@attach lightboxGroup()}>
    {@html json.content}
  </div>
</article>

<hr />

<div>
  <Comments issueNumber={json.issueNumber} />
</div>

<style>
  .article {
    margin: var(--hz-space-near) 0;
  }
  .details {
    display: flex;
    gap: var(--hz-space-near);
    align-items: center;

    h1 {
      margin-bottom: var(--hz-space-near);
    }
  }
  .side {
    margin-bottom: 0;
  }
</style>