<svelte:options css="injected" />

<script lang="ts">
  import { SITE_URL } from "$lib/siteConfig"

  let {
    message
  }: {
    message: string;
  } = $props();
</script>


<div class="container">
  <div class="content">
    <h1 class="title">{message}</h1>
  </div>
  {#if message !== 'heffner.dev'}
    <div class="brand">{SITE_URL}</div>
  {/if}
</div>


<style>
  * {
    display: flex; /* Helps satisfy Satori's CSS requirements */
  }
  .container {
    width: 1200px;
    height: 630px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px;
    font-family: "Merriweather", serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .title {
    font-size: 112px;
    font-weight: 800;
    line-height: 1.1;
    margin: 0;
  }
  .brand {
    font-family: "Mulish", sans-serif;
    font-size: 48px;
    font-weight: 600;
    opacity: 0.7;
    align-self: flex-end;
  }
</style>