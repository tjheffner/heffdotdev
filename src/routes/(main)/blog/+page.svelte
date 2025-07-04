<script lang="ts">
  import { queryParam, ssp } from 'sveltekit-search-params'
  import PostItem from '$lib/components/PostItem.svelte'
  import SearchFilters from '$lib/components/SearchFilters.svelte';
  import { POST_CATEGORIES } from '$lib/siteConfig'
  import { fuzzySearch } from './fuzzySearch'
  import type { Writable } from 'svelte/store'

  let { data } = $props();
  let { items } = data

  // https://github.com/paoloricciuti/sveltekit-search-params#how-to-use-it
  let selectedCategories: Writable<string[] | null> = $state(queryParam(
    'show',
    {
      encode: (arr) => arr?.toString(),
      decode: (str) => str?.split(',')?.filter((e) => e) ?? []
    },
    { debounceHistory: 100 }
  ));
  let search = queryParam('filter', ssp.string(), {
    debounceHistory: 500
  });

  let inputEl: HTMLInputElement = $state();

  function focusSearch(e) {
    if (e.key === '/' && inputEl) inputEl.select();
  }

  function clearFilters(e) {
    $search = ''
    $selectedCategories = []
  }

  let LIST_DISPLAY_LENGTH = 10
  let isTruncated = $state(items?.length > LIST_DISPLAY_LENGTH);

  let list: (typeof items) = $state()
  $effect.pre(() => {
    fuzzySearch(items, $selectedCategories, $search).then(_items => {
      list = _items
    })
  })
</script>

<svelte:head>
  <title>heffner.dev | posts</title>
  <meta name="description" content="Latest musings fit to print." />
  <meta property="og:image" content={`https://heffner.dev/og?message=posts`} />
  <meta name="twitter:card" content={'summary'} />
  <meta name="twitter:image" content={`https://heffner.dev/og?message=posts`} />
</svelte:head>

<svelte:window onkeyup={focusSearch} />

<section data-density-shift>
  <h1>
    Posts
  </h1>
  <p>
    In total, I've written <strong>{items.length}</strong> posts on my blog.
  </p>

  <SearchFilters 
    categories={POST_CATEGORIES} 
    bind:inputEl={inputEl}
    bind:search={$search} 
    bind:selectedCategories={selectedCategories} 
  />

  <hr />

  <!-- Results -->
  {#if list?.length}
    <ul class="list">
      {#each list as item, i}
        {#if isTruncated && (i+1 < LIST_DISPLAY_LENGTH)}
          <PostItem {item} href={item.slug}>
            {item.description}
          </PostItem>
        {:else if !isTruncated}
          <PostItem {item} href={item.slug}>
            {item.description}
          </PostItem>
        {/if}
      {/each}
    </ul>
    {#if isTruncated && list.length > LIST_DISPLAY_LENGTH}
      <div >
        <button
          onclick={() => (isTruncated = false)}
          class="button"
        >
          See more posts
        </button>
      </div>
    {/if}
  {:else if $search && $selectedCategories.length === 0}
    <div class="prose">
      No posts found for
      <code>{$search}</code>.
    </div>
    <button
      onclick={() => ($search = '')}
      class="button"
    >
      Clear your search
    </button>
  {:else}
    <div class="prose">No posts found with this combination of filters. Search something else!</div>
    <button
      onclick={clearFilters}
      class="button"
    >
      Clear all filters
    </button>
  {/if}
</section>

<style>
  .list {
    padding: 0;
    list-style-type: none;
  }
  .button {
    margin: var(--space-near) 0;
  }
</style>