<script lang="ts">
  // css reset only, no layout. every route in this group renders without the
  // header and footer.
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

{@render children?.()}
