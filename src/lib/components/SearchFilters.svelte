<script lang="ts">
  let { 
      search = $bindable(),
      selectedCategories = $bindable(),
      categories,
      inputEl = $bindable(),
      ...props 
  } = $props();
  
</script>

<div class="blog-search" data-density-shift id="filters">
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
      aria-hidden="true"
      focusable="false"
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
  <div class="pillbox">
    <p class="pillbox-label"> Category: </p>
    <div class="pills">
      {#each categories as availableCategory}
        <div 
          class="filter"
          class:active={$selectedCategories.includes(availableCategory)}
        >
          <input
            id="category-{availableCategory}"
            class="sr-only"
            type="checkbox"
            bind:group={$selectedCategories}
            value={availableCategory}
          />
          <label
            for="category-{availableCategory}"
          >
            {availableCategory}
          </label>
        </div>
      {/each}
    </div>

  </div>
</div>

<style>
  .blog-search {
    position: sticky;
    top: 90px;
    background-color: var(--c-background);
    padding: var(--space-away) 0;
    border-bottom: 2px solid var(--c-accent);
  }
  .search {
    position: relative;
  }
  .input {
    width: 100%;
    height: 2.5rem;
    border-radius: 2rem;
    border: 1px solid;
    padding: 0 var(--space-away);
  }
  svg {
    position: absolute;
    top: .6rem;
    right: var(--space-away);
    height: 1.25rem;
    width: 1.25rem;
  }

  .pillbox {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    margin: var(--space-away) 0;
    gap: var(--space-near);
  }
  .pillbox-label {
    width: 100%;
    margin: var(--space-near) 0;

    @media (min-width: 668px) {
      width: fit-content;
    }
  }
  .pills {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-near);
  }


  .filter label {
    display: inline-block;
    width: 100%;
    height: 100%;
    padding: .5rem 1rem;
    border-radius: 2rem;
    transition: .3s all ease-in-out;
    cursor: pointer;
    background-color: var(--c-secondary-brighter);

    &:hover {
        background-color: var(--c-secondary);
        color: var(--c-background);
    }
  }
  .active label {
    background-color: var(--c-secondary);
    color: var(--c-background);
  }

</style>