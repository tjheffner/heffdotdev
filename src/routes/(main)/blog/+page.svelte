<script lang="ts">
  import { queryParam, ssp } from 'sveltekit-search-params'
  import PostItem from '$lib/components/PostItem.svelte'
  import { POST_CATEGORIES } from '$lib/siteConfig'
  import { fuzzySearch } from './fuzzySearch'
  import type { Writable } from 'svelte/store'

  let { data } = $props();
  let { items } = data

  // https://github.com/paoloricciuti/sveltekit-search-params#how-to-use-it
  let selectedCategories: Writable<string[] | null> = queryParam(
    'show',
    {
      encode: (arr) => arr?.toString(),
      decode: (str) => str?.split(',')?.filter((e) => e) ?? []
    },
    { debounceHistory: 100 }
  );
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

<section
  class=""
>
  <h1 class="">
    Posts
  </h1>
  <p class="">
    In total, I've written <strong>{items.length}</strong> posts on my blog. Use the search below
    to filter.
  </p>

  <!-- Search Bar -->
  <div class="">
    <input
      aria-label="Search articles"
      id="search"
      type="text"
      bind:value={$search}
      bind:this={inputEl}
      placeholder="Hit / to search"
      class=""
    />
    <svg
      class=""
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>

  <!-- Filter Buttons -->
  <div class="">
    <span class=""> Filter: </span>
    {#each POST_CATEGORIES as availableCategory}
      <div>
        <input
          id="category-{availableCategory}"
          class="peer sr-only"
          type="checkbox"
          bind:group={$selectedCategories}
          value={availableCategory}
        />
        <label
          for="category-{availableCategory}"
          class="filter"
          class:activefilter={$selectedCategories.includes(availableCategory)}
        >
          {availableCategory}
        </label>
      </div>
    {/each}
  </div>

  <hr class="" />

  <!-- Results -->
  {#if list?.length}
    <ul class="">
      {#each list as item, i}
        {#if isTruncated && (i+1 < LIST_DISPLAY_LENGTH)}
          <li class="mb-4 sm:mb-0">
            <PostItem {item} href={item.slug}>
              {item.description}
            </PostItem>
          </li>
        {:else if !isTruncated}
          <li class="mb-4 sm:mb-0">
            <PostItem {item} href={item.slug}>
              {item.description}
            </PostItem>
          </li>
        {/if}
      {/each}
    </ul>
    {#if isTruncated && list.length > LIST_DISPLAY_LENGTH}
      <div class="">
        <button
          onclick={() => (isTruncated = false)}
          class="filter"
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
      class="filter"
    >
      Clear your search
    </button>
  {:else}
    <div class="prose">No posts found with this combination of filters. Search something else!</div>
    <button
      onclick={clearFilters}
      class="filter"
    >
      Clear all filters
    </button>
  {/if}
</section>


<style>
  .filter {
    /* @apply m-1 inline-block whitespace-nowrap rounded rounded-md px-4 py-2 font-bold; */
    /* @apply text-copy; */
    /* @apply ring-accent transition-all duration-200 ease-in-out hover:ring-2; */
  }
  .activefilter {
    /* @apply border-accent bg-secondary text-background; */
    /* @apply ring-secondary; */
  }
</style>