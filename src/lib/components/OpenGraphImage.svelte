<svelte:options css="injected" />

<script lang="ts">
  import { SITE_TITLE } from "$lib/siteConfig"

  let {
    message
  }: {
    message: string | undefined;
  } = $props();
</script>


<div class="container">
  {#if message && message !== SITE_TITLE}
    <div class="content space">
      <h1 class="title">{message}</h1>
      <div class="brand">{SITE_TITLE}</div>
    </div>
  {:else}
    <div class="content solo">
      <h1 class="brand">{SITE_TITLE}</h1>
    </div>
  {/if}
</div>


<style>
  * {
    display: flex; /* Helps satisfy Satori's CSS requirements */
    margin: 0;
  }
  .container {
    width: 1200px;
    height: 630px;
    padding: 1.25rem;
    background: white;
    color: white;
  }
  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    margin: 1.25rem;
  }
  .content.solo {
    justify-content: flex-end;
  }
  .content.space {
    justify-content: space-between;
  }

  .title {
    font-family: "Mulish", sans-serif;
    font-size: 112px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -5px;
    margin: 0;
    color: black;
  }

  .brand {
    font-family: "Merriweather", serif;
    font-size: 72px;
    font-weight: 600;
    align-self: flex-end;

    color: white;
    background: linear-gradient(
      to bottom,
      black 0%,
      black 100%
    );
    background-position: 0 100%;
    background-repeat: repeat-x;

    padding: 4px 8px;
    background-size: 8px 88px;
  }

  .solo > .brand {
    font-size: 112px;
    font-weight: 800;
    line-height: 1.1;
    background-size: 8px 142px;
  }
</style>