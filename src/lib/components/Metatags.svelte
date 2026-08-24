<script lang="ts">
  import { Metatags } from '@hyzer-labs/ui'
  import { page } from '$app/state';
  import { dev } from '$app/environment';
  import {
    SITE_URL,
    SITE_TITLE,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
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
    image = dev ? 'localhost:5173/api/og.png' : DEFAULT_OG_IMAGE
  }: Props = $props();

  // encode the message: a raw space (multi-word titles) is an invalid URL and
  // Slack drops the image without a word. Discord tolerates it.
  const fullImage = $derived(ogMessage ? `${image}?message=${encodeURIComponent(ogMessage)}` : image)
</script>

<Metatags
  siteUrl={SITE_URL}
  url={page.url.pathname}
  siteName={SITE_TITLE}
  title={title === SITE_TITLE ? undefined : title}
  {type}
  {description}
  canonical={canonical && (canonical.startsWith('/') ? canonical : `/${canonical}`)}
  image={fullImage}
  imageAlt={ogMessage ?? title}
  twitterCard="summary_large_image"
/>
