<script>
	/** @type {import('$lib/types').Project} */
	export let data;
	let { json } = data;

	import { MY_TWITTER_HANDLE, SITE_URL } from '$lib/siteConfig';
</script>

<svelte:head>
	<title>{json.data.name}</title>
	<meta name="description" content="heffdotdev | project" />

	<meta property="og:type" content="article" />
	<meta property="og:title" content={json.data.name} />
	<meta name="Description" content={json.data.description} />
	<meta property="og:description" content={json.data.description} />
	<meta name="twitter:card" content={json.data.image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:creator" content={'@' + MY_TWITTER_HANDLE} />
	<meta name="twitter:title" content={json.data.name} />
	<meta name="twitter:description" content={json.data.description} />
	{#if json.data.image}
		<meta property="og:image" content={json.data.image} />
		<meta name="twitter:image" content={json.data.image} />
	{/if}
</svelte:head>

<a href="/work" class="back-link">Back </a>

<article class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8">
	{#if json.data.name}
		<div class="mb-12">
			<h1 class="text-shadow text-3xl font-bold tracking-tight text-amber-600 dark:text-yellow-400 md:text-6xl">
				{json.data.name}
				<span class="text-base text-unshadow text-slate-500 dark:text-gray-600">({json.data.date.slice(0,4)})</span>
			</h1>
		</div>
	{/if}

	{#if json.data.image}
		<img src={json.data.image} alt={json.name} class="mb-4" />
	{/if}

	<div class="prose mb-12 w-full max-w-none dark:prose-invert">
		{@html json.content}
	</div>

	{#if json.data.url}
		<a class="footer-link font-bold" href={json.data.url}>View this project live</a>
	{/if}
</article>
