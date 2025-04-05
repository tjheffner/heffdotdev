<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<!-- this file gets used for any .svx file -->
<article class="mx-auto mb-16 flex w-full flex-col items-start px-4 sm:p-0 prose">
  {@render children?.()}
</article>
