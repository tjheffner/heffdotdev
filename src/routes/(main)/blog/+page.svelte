<script lang="ts">
  import { queryParam, ssp } from 'sveltekit-search-params'
  import PostItem from '$lib/components/PostItem.svelte'
  import SearchFilters from '$lib/components/SearchFilters.svelte';
  import Metatags from '$lib/components/Metatags.svelte'
  import { POST_CATEGORIES } from '$lib/siteConfig'
  import { fuzzySearch } from './fuzzySearch'
  import type { Writable } from 'svelte/store'

  let { data } = $props();
  let { items } = data
  let inputEl: HTMLInputElement = $state();
  let resultsEl: HTMLElement = $state();

  let list: (typeof items) = $state()
  let LIST_DISPLAY_LENGTH = 10
  let isTruncated = $state(items?.length > LIST_DISPLAY_LENGTH);

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

  function focusSearch(e) {
    if (e.key === '/' && inputEl) inputEl.select();
  }

  function clearFilters(e) {
    $search = ''
    $selectedCategories = []
  }

  $effect.pre(() => {
    fuzzySearch(items, $selectedCategories, $search).then(_items => {
      list = _items
    })
    // reset list position when filters change
    if (resultsEl) {
      const header = document.getElementById('header');
      const filters = document.getElementById('filters');
      const stickyHeight = header.offsetHeight + filters.offsetHeight;

      if (window.scrollY === 0) {
        return;
      } else {
        window.scrollTo({top: resultsEl.offsetTop - stickyHeight, behavior: 'instant'})
      }
    }
  })
</script>

{#snippet emptyResults(string = undefined, buttonText, func, query = undefined)}
  <div class="empty prose">
    {#if string}
      {#if query}
        <p>{string} <code>{query}</code></p>
      {:else}
        <p>{string}</p>  
      {/if}
    {/if}
    <button
      onclick={func}
      class="button"
    >
      {buttonText}
    </button>
  </div>
{/snippet}

<svelte:window onkeyup={focusSearch} />

<Metatags 
  title="Posts" 
  description="personal blogs covering topics including DIY, technical tips and tricks, and cooking recipes."
  ogMessage="Posts"  
/>

<section data-density-shift id="content" tabindex="-1">
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

  <!-- Results -->
  <div id="results" bind:this={resultsEl}>
    {#if list?.length}
      <ul class="clean-list">
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
        {@render emptyResults(
          null,
          'See more posts',
          () => isTruncated = false
        )}
      {/if}
    {:else if $search && $selectedCategories.length === 0}
      {@render emptyResults(
        'No posts found for',
        'Clear your search',
        () => ($search = ''),
        $search
      )}
    {:else}
      {@render emptyResults(
        'No posts found with this combination of filters. Search something else!',
        'Clear all filters',
        clearFilters
      )}
    {/if}
  </div>
</section>

<style>
  .button {
    background-color: var(--c-accent-brighter);
    border: none;
    border-radius: 2rem;
    cursor: pointer;

    margin: var(--space-near) 0;
    padding: .5rem 1rem;
    transition: .3s all ease-in-out;
    
    &:hover {
        background-color: var(--c-accent);
        color: var(--c-background);
    }
  }
  .empty {
    margin: var(--space-away) 0;
    padding: var(--space-away) 0;
    min-height: 400px;
  }
  #results {
    margin: var(--space-away) 0;
  }
</style>