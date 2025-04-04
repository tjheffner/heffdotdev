<script>
  import utterances, {injectScript}  from '$lib/loadUtterances'

  export let issueNumber
  export let commentsEl
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
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <button class="my-4 bg-blue-200 hover:bg-blue-100 text-black p-2 rounded-lg"
    on:click={() => injectScript(commentsEl, issueNumber)}
    on:mouseover={() => injectScript(commentsEl, issueNumber)}
  >Load now</button>
</div>
