<script>
	import Slice from '$lib/components/Slice.svelte';
	import Card from '$lib/components/Card.svelte';
	import {
		SITE_URL,
		SITE_TITLE,
		SITE_DESCRIPTION,
		DEFAULT_OG_IMAGE,
		MY_TWITTER_HANDLE
	} from '$lib/siteConfig';
	export const prerender = false; // index page is most visited, lets prerender
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

<section class="mx-auto px-4 sm:p-0 flex w-full flex-col items-start">
	<Slice>
		<h1 class="text-3xl lg:text-5xl font-bold text-shadow">
			welcome to my page
		</h1>
	</Slice>

	<Slice title="Hello!">
			<p>this site is perpetually under construction but coming along :)</p>

			<p>it's mostly a reminder of past work and a place for me to post recipes I like, with the occasional technical post or personal blog mixed in.<p>

			<p>thanks for stopping by, check out the links that work</p>
	</Slice>

	<Slice title="Fav Recipes">
		<div class="grid w-full grid-cols-1 md:grid-cols-3 gap-4 align-middle">
			<Card title="Caper Butter" href={'/dill-caper-compound-butter'} />
			<Card title="Pizza Dough" href={'/pizza-dough'}/>
			<Card title="Chicken & Bean Stew" href={'/southwest-chicken-bean-stew'}/>
		</div>
	</Slice>

	<!-- <Slice title="Latest Tech Posts">
		<div class="grid w-full grid-cols-1 md:grid-cols-3 gap-4 align-middle">
			pull the latest 3 posts that have `technical` or `snippet` category here
		</div>
	</Slice> -->
</section>
