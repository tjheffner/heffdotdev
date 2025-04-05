<script lang="ts">
  import utterances, {injectScript}  from '$lib/loadUtterances'

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


<div class="mb-8 text-black " bind:this={commentsEl} use:utterances={{number: issueNumber}}>
  Loading comments...
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <button class="my-4 bg-blue-200 hover:bg-blue-100 text-black p-2 rounded-lg"
    onclick={() => injectScript(commentsEl, issueNumber)}
    onmouseover={() => injectScript(commentsEl, issueNumber)}
  >Load now</button>
</div>
