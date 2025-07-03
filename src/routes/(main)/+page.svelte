<script>
  import {
    SITE_URL,
    SITE_TITLE,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    TWITTER_ID,
  } from '$lib/siteConfig'
</script>

<svelte:head>
  <title>{SITE_TITLE}</title>
  <link rel="canonical" href={SITE_URL} />
  <link
    rel="alternate"
    type="application/rss+xml"
    href={SITE_URL + '/rss.xml'}
  />
  <meta property="og:url" content={SITE_URL} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={SITE_TITLE} />
  <meta name="Description" content={SITE_DESCRIPTION} />
  <meta property="og:description" content={SITE_DESCRIPTION} />
  <meta property="og:image" content={DEFAULT_OG_IMAGE} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:creator" content={'@' + TWITTER_ID} />
  <meta name="twitter:title" content={SITE_TITLE} />
  <meta name="twitter:description" content={SITE_DESCRIPTION} />
  <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section>
  <h1 class="big-boi">
    Creative technologist passionate about design systems, responsive web
    design and accessibility.
  </h1>
</section>

<style>
  .big-boi {
    font-size: var(--large-text);
    flex-grow: 1;
    align-self: center;
  }
</style>