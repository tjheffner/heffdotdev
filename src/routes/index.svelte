<script context="module">
	import {
		SITE_URL,
		SITE_TITLE,
		SITE_DESCRIPTION,
		DEFAULT_OG_IMAGE,
		MY_TWITTER_HANDLE
	} from '$lib/siteConfig';
	export const prerender = false; // index page is most visited, lets prerender
</script>

<script>
	import Slice from '../components/Slice.svelte';
</script>

<svelte:head>
	<title>{SITE_TITLE}</title>
	<link rel="canonical" href={SITE_URL} />
	<link rel="alternate" type="application/rss+xml" href={SITE_URL + '/api/rss.xml'} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={SITE_TITLE} />
	<meta name="Description" content={SITE_DESCRIPTION} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:image" content={DEFAULT_OG_IMAGE} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:creator" content={'@' + MY_TWITTER_HANDLE} />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section class="mx-auto px-4 sm:p-0 mb-16 flex w-full flex-col items-start">
	<Slice>
		<h1 class="text-3xl lg:text-5xl font-bold text-shadow">
			some fun intro or cool art thing is going to live in this space just wait
		</h1>
	</Slice>

	<Slice title="Featured">
		<div>
			<p>under construction but coming along :)</p>

			<p>thanks for stopping by, check out the links that work</p>
		</div>
	</Slice>
</section>
