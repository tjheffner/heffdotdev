<script lang="ts">
  import { TextInput } from '@hyzer-labs/ui'
  import IconSearch from '@hyzer-labs/ui/icons/search'

  let {
      search = $bindable(),
      selectedCategories = $bindable(),
      categories,
      inputEl = $bindable(),
  } = $props();
</script>

<div class="blog-search" data-density-shift id="filters">
  <!-- Search Bar -->
  <div class="search">
    <TextInput
      name="search"
      label="Search articles"
      hideLabel
      bind:value={search}
      bind:element={inputEl}
      placeholder="Hit / to search"
    >
      {#snippet suffix()}
        <IconSearch size={20} />
      {/snippet}
    </TextInput>
  </div>

  <!-- Filter Buttons -->
  <div class="pillbox">
    <p class="pillbox-label"> Category: </p>
    <div class="pills">
      {#each categories as availableCategory}
        <div
          class="filter"
          class:active={selectedCategories.includes(availableCategory)}
        >
          <input
            id="category-{availableCategory}"
            class="sr-only"
            type="checkbox"
            bind:group={selectedCategories}
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
    top: var(--header-height);
    background-color: var(--hz-color-surface);
    padding: var(--hz-space-away) 0;
    border-bottom: 2px solid var(--hz-intent-primary);
  }
  /* the old .input pill styling, moved onto the field's bordered box — the
     wrapper carries the border so the suffix icon sits inside it */
  .search :global(.hz-input-wrapper) {
    height: 2.5rem;
    border-radius: 2rem;
    border: 1px solid;
    padding: 0 var(--hz-space-away);
    background-color: field;
  }
  .search :global(.hz-input-wrapper input) {
    border: none;
    background: none;
    outline: none;
  }
  .search :global(.hz-input-wrapper:focus-within) {
    outline: 2px solid var(--hz-intent-primary);
  }

  .pillbox {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    margin: var(--hz-space-away) 0;
    gap: var(--hz-space-near);
  }
  .pillbox-label {
    width: 100%;
    margin: var(--hz-space-near) 0;

    @media (min-width: 668px) {
      width: fit-content;
    }
  }
  .pills {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--hz-space-near);
  }


  .filter label {
    display: inline-block;
    width: 100%;
    height: 100%;
    padding: .5rem 1rem;
    border-radius: 2rem;
    transition: .3s all ease-in-out;
    cursor: pointer;
    background-color: var(--hz-palette-secondary-tint);

    &:hover {
        background-color: var(--hz-intent-secondary);
        color: var(--hz-color-surface);
    }
  }
  .active label {
    background-color: var(--hz-intent-secondary);
    color: var(--hz-color-surface);
  }

</style>