<script lang="ts">
  import utterances, {injectScript}  from '$lib/content/loadUtterances'

  let { issueNumber, commentsEl = $bindable() } = $props();
</script>

<div  bind:this={commentsEl} use:utterances={{number: issueNumber}}>
  Loading comments...
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <button

    onclick={() => injectScript(commentsEl, issueNumber)}
    onmouseover={() => injectScript(commentsEl, issueNumber)}
  >
    Load now
  </button>
</div>
