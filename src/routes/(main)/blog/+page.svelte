<script>
  import { queryParam, ssp } from 'sveltekit-search-params'
  import PostItem from '$lib/components/PostItem.svelte'
  import { POST_CATEGORIES } from '$lib/siteConfig'
  import { fuzzySearch } from './fuzzySearch'

  export let data
  let { items } = data

  // https://github.com/paoloricciuti/sveltekit-search-params#how-to-use-it
  /** @type import('svelte/store').Writable<String[] | null> */
  let selectedCategories = queryParam(
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

  let inputEl;

  function focusSearch(e) {
    if (e.key === '/' && inputEl) inputEl.select();
  }

  function clearFilters(e) {
    $search = ''
    $selectedCategories = []
  }

  let LIST_DISPLAY_LENGTH = 10
  let isTruncated = items?.length > LIST_DISPLAY_LENGTH;

  let list
  $: fuzzySearch(items, $selectedCategories, $search).then(_items => {
    list = _items
  })
</script>

<svelte:head>
  <title>heffner.dev | posts</title>
  <meta name="description" content="Latest musings fit to print." />
  <meta property="og:image" content={`https://heffner.dev/og?message=posts`} />
  <meta name="twitter:card" content={'summary'} />
  <meta name="twitter:image" content={`https://heffner.dev/og?message=posts`} />
</svelte:head>

<svelte:window on:keyup={focusSearch} />

<section
  class="mx-auto mb-16 flex w-full flex-col items-start p-0 sm:px-8 lg:w-2/3"
>
  <h1 class="text-secondary mb-4 text-3xl font-bold tracking-tight md:text-5xl">
    Posts
  </h1>
  <p class="mb-4 text-copy">
    In total, I've written <strong>{items.length}</strong> posts on my blog. Use the search below
    to filter.
  </p>

  <!-- Search Bar -->
  <div class="relative w-full">
    <input
      aria-label="Search articles"
      type="text"
      bind:value={$search}
      bind:this={inputEl}
      placeholder="Hit / to search"
      class="block w-full rounded-md border border-secondary bg-background px-4 py-2 text-copy placeholder:text-zinc-50"
    />
    <svg
      class="absolute right-3 top-3 h-5 w-5 text-secondary"
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
  <div class="my-4 flex w-full items-center">
    <span class="mr-2 text-copy"> Filter: </span>
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

  <hr class="mb-6 md:mb-12" />

  <!-- Results -->
  {#if list?.length}
    <ul
      class="w-full divide-y divide-dashed divide-secondary md:mx-auto md:w-4/5"
    >
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
      <div class="flex justify-center mx-auto">
        <button
          on:click={() => (isTruncated = false)}
          class="filter"
        >
          See more posts
        </button>
      </div>
    {/if}
  {:else if $search && $selectedCategories.length === 0}
    <div class="prose prose-invert">
      No posts found for
      <code>{$search}</code>.
    </div>
    <button
      on:click={() => ($search = '')}
      class="filter my-4"
    >
      Clear your search
    </button>
  {:else}
    <div class="prose prose-invert">No posts found with this combination of filters. Search something else!</div>
    <button
      on:click={clearFilters}
      class="filter my-4"
    >
      Clear all filters
    </button>
  {/if}
</section>
