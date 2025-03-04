<script>
  export let title = false
  export let date = false
  export let prose = true
  export let full = false
  export let warn = false
  export let titleLink = true

  let tag = 'a'

  if (titleLink === false) {
    tag = 'div'
  }

  let sliceClasses = "slice mb-6 grid w-full grid-cols-4 gap-4 py-8 md:mb-8 md:gap-8 md:py-12 lg:gap-12 xl:gap-16"
  let slotWrapperClasses = 'w-full md:w-2/3 md:ml-4 lg:ml-12'
  if (title && prose) {
    slotWrapperClasses = 'prose prose-lg prose-slate prose-invert'
  }
  if (title && !prose) {
    slotWrapperClasses = 'not-prose'
  }
  // nuclear full width
  if (full) {
    sliceClasses = "slice mb-6 grid w-full grid-cols-4 gap-4 pb-8 md:mb-8 md:gap-8 md:pb-12 lg:gap-12 xl:gap-16"
    slotWrapperClasses = 'w-full px-8'
  }
</script>

<div class={sliceClasses}>
  {#if title}
    <div class="col-span-4 md:col-span-1">
      <h2 class="sticky top-4 mb-2 text-xl font-bold text-blue-300 md:ml-4 md:text-2xl lg:ml-12">
        <svelte:element this={tag} href={titleLink ? `#${title}` : null} class="slice-title">
          {title}{#if warn}<a href="#warning" class="text-secondary">*</a>{/if}
        </svelte:element>
        {#if date}
        <span class="text-unshadow text-base text-gray-600">
        ({date.slice(0, 4)})
        </span>
        {/if}
      </h2>
    </div>
  {/if}
  <div class={title ? 'col-span-4 md:col-span-3 xl:col-span-2' : 'col-span-4'}>
    <p class={slotWrapperClasses}>
      <slot />
    </p>
  </div>
</div>

<style>
  .slice h2::before {
    display: none;
  }
  .slice-title {
    color: var(--brand-accent) !important;
  }
  .slice:not(:first-child) {
    border-top: 2px solid var(--brand-accent);
  }
</style>
