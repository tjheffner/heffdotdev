<script lang="ts">
  // keep css reset, but no layout otherwise
  // any route in this group can render without header/footer
  // import '../../tailwind.css'
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

{@render children?.()}
