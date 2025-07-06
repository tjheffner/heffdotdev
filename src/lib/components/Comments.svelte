<script lang="ts">
  import utterances, {injectScript}  from '$lib/content/loadUtterances'

  let { issueNumber, commentsEl = $bindable() } = $props();
</script>

<!-- <div>
  <script
    src="https://utteranc.es/client.js"
    repo="tjheffner/heffdotdev"
    issue-number={`${issueNumber}`}
    theme="boxy-light"
    crossorigin="anonymous"
    async>
  </script>
</div> -->

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
