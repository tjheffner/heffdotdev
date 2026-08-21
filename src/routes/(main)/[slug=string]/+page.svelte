<script lang="ts">
  import type { BaseContentItem } from '$lib/types'
  import Comments from '$lib/components/Comments.svelte'
  import Metatags from '$lib/components/Metatags.svelte'
  import TableOfContents from '$lib/components/TableOfContents.svelte';
  import { lightbox } from '$lib/actions/lightbox';

  import '$lib/code-highlight.css'

  let { data } = $props();
  let json: BaseContentItem = $derived(data.json) // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates
</script>

<Metatags 
  title={json.title} 
  description={json.description} 
  ogMessage={json.title} 
  canonical={json.slug}
/>

<TableOfContents type='blog' />

<article
  data-density-shift
  class="article"
  id="content"
  tabindex="-1"
>
  <div class="details">
    <h1>
      {json.title}
    </h1>
 
    <div class="side small" data-density-shift>
      <p>
        <span class="secondary">{new Date(json.date).toISOString().slice(0, 10)}</span>
        {#if new Date(json.date).toISOString().slice(0, 10) !== new Date(json.ghMetadata.updated_at).toISOString().slice(0, 10)}
          <span>
            (updated: <span class="accent">{new Date(json.ghMetadata.updated_at).toISOString().slice(0, 10)}</span>)
          </span>
        {/if}
      </p>
    </div>
  </div>

  <hr />

  <div class="prose" use:lightbox>
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
    /* margin: var(--hz-space-near) 0; */
    /* display: flex;
    flex-direction: column; */

    h1 {
      margin-bottom: var(--hz-space-near);
    }
  }
  .side {
    margin-bottom: 0;
  }
</style>
