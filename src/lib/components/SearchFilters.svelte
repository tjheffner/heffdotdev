  <script lang="ts">
	let { 
        search = $bindable(),
        selectedCategories = $bindable(),
        categories,
        inputEl = $bindable(),
        ...props 
    } = $props();
    
  </script>
  
  <div class="blog-search" data-density-shift>
    <!-- Search Bar -->
    <div class="search">
      <input
        aria-label="Search articles"
        id="search"
        type="text"
        bind:value={search}
        bind:this={inputEl}
        placeholder="Hit / to search"
        class="input"
      />
      <svg
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
    <div class="filters">
      <span class=""> Filter: </span>
      {#each categories as availableCategory}
        <div class="filter">
          <input
            id="category-{availableCategory}"
            class="sr-only"
            type="checkbox"
            bind:group={$selectedCategories}
            value={availableCategory}
          />
          <label
            for="category-{availableCategory}"
            class:activefilter={$selectedCategories.includes(availableCategory)}
          >
            {availableCategory}
          </label>
        </div>
      {/each}
    </div>
  </div>


  <style>
  .blog-search {
    position: sticky;
    top: 90px;
    background-color: var(--c-background);
    padding: var(--space-away) 0;
  }
  .search {
    position: relative;
  }
  .input {
    width: 100%;
    height: 2.5rem;
  }
  svg {
    position: absolute;
    top: .6rem;
    right: .5rem;
    height: 1.25rem;
    width: 1.25rem;
  }

  .filters {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: var(--space-near) 0;
  }

  .filter {
    padding: .5rem 1rem;
    border-radius: 2rem;
    cursor: pointer;
    /* @apply m-1 inline-block whitespace-nowrap rounded rounded-md px-4 py-2 font-bold; */
    /* @apply text-copy; */
    /* @apply ring-accent transition-all duration-200 ease-in-out hover:ring-2; */
  }

  .filter label {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .activefilter {
    /* @apply border-accent bg-secondary text-background; */
    /* @apply ring-secondary; */
    background-color: var(--c-accent);
  }
</style>