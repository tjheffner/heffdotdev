<script context="module">
	export const prerender = true; // you can uncomment to prerender as an optimization
	export const hydrate = true;
	import { MY_TWITTER_HANDLE, REPO_URL, SITE_URL } from '$lib/siteConfig';
	export async function load({ url, params, fetch }) {
		const slug = params.slug;
		let res = null;
		try {
			res = await fetch(`/api/work/${slug}.json`);
			if (res.status > 400) {
				return {
					status: res.status,
					error: await res.text()
				};
			}

			return {
				props: {
					json: await res.json(),
					slug,
					REPO_URL
				},
				maxage: 60 // 1 minute
			};
		} catch (err) {
			console.error('error fetching project at [slug].svelte: ' + slug, res, err);
			return {
				status: 500,
				error: new Error('error fetching project at [slug].svelte: ' + slug + ': ' + res)
			};
		}
	}
</script>

<script>
	/** @type {import('$lib/types').Project} */
	export let json; // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates
</script>

<svelte:head>
	<title>{json.data.name}</title>
	<meta name="description" content="heffdotdev project" />

	<link rel="canonical" href={SITE_URL} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={json.data.name} />
	<meta name="Description" content={json.data.description} />
	<meta property="og:description" content={json.data.description} />
	<meta name="twitter:card" content={json.image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:creator" content={'@' + MY_TWITTER_HANDLE} />
	<meta name="twitter:title" content={json.data.name} />
	<meta name="twitter:description" content={json.data.description} />
	{#if json.data.image}
		<meta property="og:image" content={json.image} />
		<meta name="twitter:image" content={json.image} />
	{/if}
</svelte:head>

<a href="/work" class="back-link"> Back </a>

<article class="mx-auto mb-16 flex w-full flex-col items-start px-4 sm:px-8 lg:w-2/3">
	{#if json.data.name}
		<h1 class="mt-4 text-3xl font-bold tracking-tight text-accent md:text-5xl">
			{json.data.name}
		</h1>
	{/if}

	{#if json.data.image}
		<img src={json.data.image} alt={json.name} class="mt-4" />
	{/if}

	<div class="prose mt-12 mb-12 w-full max-w-none dark:prose-invert">
		{@html json.content}
	</div>
</article>
