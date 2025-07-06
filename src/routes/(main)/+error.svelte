<script>
  import { page } from '$app/state'

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false

  let message = $state(offline
    ? 'Find the internet and try again'
    : page.error?.message)

  let title = $state(offline ? 'Offline' : page.status)
  if (page.status === 404) {
    title = 'Page not found'
    message = 'Sorry! If you think this URL is broken, please let me know!'
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<section >
  <h1>{page.status}: {title}</h1>

  {#if page.status === 404}
    <p >
      There is no post at the slug <code>{page.url.pathname}</code>.
    </p>
    <p>
      <a href={'/blog?filter=' + page.url.pathname.slice(1)}
        >Try searching for it here!</a
      >
    </p>
    <p >
      If you believe this was a bug, please let me know! <a
        href="https://github.com/tjheffner/heffdotdev/issues"
        >Open an issue here.</a
      >
    </p>
  {:else}
    <p >{message}</p>
  {/if}
</section>