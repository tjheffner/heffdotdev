<script lang="ts">
  import { page } from '$app/state';
  import { dev } from '$app/environment';
  import {
    SITE_URL,
    SITE_TITLE,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    DEFAULT_OG_PATH,
  } from '$lib/siteConfig'

	interface Props {
		type?: string;
    title?: string;
    canonical?: string;
    description?: string;
    ogMessage?: string;
    image?: string;
	}
  let { 
    type = 'website', // or article, or music.album etc. See https://ogp.me/#types
    title = SITE_TITLE,
    description = SITE_DESCRIPTION,
    ogMessage,
    canonical,
    image = dev ? 'https://localhost:5173/og?message=heffner.dev' : DEFAULT_OG_IMAGE
  }: Props = $props();

  const path = page.url.pathname;
  const titleWithSuffix = (SITE_TITLE === title) ? title : (title ? title + ' | ' : '') + SITE_TITLE;
  const fullURI = `${SITE_URL}${path}`;
  const fullCanonical = `${SITE_URL}/${canonical}` 
</script>

<svelte:head>
  <meta property="og:type" content={type} />
  <meta property="og:url" content={fullURI} />
  <meta property="twitter:url" content={fullURI} />
  <link rel="canonical" href={canonical ? fullCanonical : fullURI} />

  {#if titleWithSuffix}
    <title>{titleWithSuffix}</title>
    <meta name="title" content={titleWithSuffix} />
    <meta property="og:title" content={titleWithSuffix} />
    <meta property="twitter:title" content={titleWithSuffix} />
  {/if}

  {#if description}
    <meta name="description" content={description} />
    <meta property="og:description" content={description} />
    <meta property="twitter:description" content={description} />
  {/if}

  {#if ogMessage}
    <meta property="og:image" content={SITE_URL + DEFAULT_OG_PATH + ogMessage} />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:image" content={SITE_URL + DEFAULT_OG_PATH + ogMessage} />
  {:else}
    <meta property="og:image" content={image} />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:image" content={image} />
  {/if}
</svelte:head>
