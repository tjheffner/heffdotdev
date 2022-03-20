<script context="module">
	// export const prerender = true; // you can uncomment to prerender as an optimization
	export const hydrate = true;
	import { MY_TWITTER_HANDLE, REPO_URL, SITE_URL } from '$lib/siteConfig';
	import Comments from '../components/Comments.svelte';
	export async function load({ url, params, fetch }) {
		const slug = params.slug;
		let res = null;
		try {
			res = await fetch(`/api/blog/${slug}.json`);
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
			console.error('error fetching blog post at [slug].svelte: ' + slug, res, err);
			return {
				status: 500,
				error: new Error('error fetching blog post at [slug].svelte: ' + slug + ': ' + res)
			};
		}
	}
</script>

<script>
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	// import Newsletter from '../components/Newsletter.svelte';
	import Reactions from '../components/Reactions.svelte';

	/** @type {import('$lib/types').ContentItem} */
	export let json; // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates
</script>

<svelte:head>
	<title>{json.title}</title>
	<meta name="description" content="heffdotdev blog" />

	<link rel="canonical" href={SITE_URL} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={json.title} />
	<meta name="Description" content={json.description} />
	<meta property="og:description" content={json.description} />
	<meta name="twitter:card" content={json.image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:creator" content={'@' + MY_TWITTER_HANDLE} />
	<meta name="twitter:title" content={json.title} />
	<meta name="twitter:description" content={json.description} />
	{#if json.image}
		<meta property="og:image" content={json.image} />
		<meta name="twitter:image" content={json.image} />
	{/if}
</svelte:head>

<a href="/blog" class="back-link"> Back </a>

<article
	class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>
	<h1
		class="text-shadow mb-8 text-3xl font-bold tracking-tight text-amber-600 dark:text-yellow-400 md:text-6xl"
	>
		{json.title}
	</h1>
	<div
		class="bg mt-2 flex w-full justify-between sm:flex-col sm:items-start md:flex-row md:items-center"
	>
		<p class="flex items-center text-sm text-gray-700 dark:text-gray-300">tjheffner</p>
		<p class="min-w-32 flex items-center text-sm text-gray-600 dark:text-gray-400 md:mt-0">
			<a href={json.ghMetadata.issueUrl} rel="external" class="no-underline" target="_blank">
				<span class="mr-4 font-mono text-xs text-gray-700 text-opacity-70 dark:text-gray-300"
					>{json.ghMetadata.reactions.total_count}
					{#if json.ghMetadata.reactions.total_count === 1}reaction{:else}reactions{/if}</span
				>
			</a>
			{new Date(json.date).toISOString().slice(0, 10)}
		</p>
	</div>

	<hr class="mt-2 w-full border-t-2 border-indigo-700 dark:border-blue-300" />

	<!-- <div
		class="-mx-4 my-2 flex h-1 w-[100vw] bg-gradient-to-r from-blue-300 via-indigo-700 to-slate-900 sm:mx-0 sm:w-full"
	/> -->

	<div class="prose mt-12 mb-12 w-full max-w-none dark:prose-invert">
		{@html json.content}
	</div>
</article>

<div class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8">
	<!-- <div class="mx-auto mb-16 w-fit max-w-2xl flex flex-col justify-center px-4 sm:px-8"> -->
	<div
		class="mb-12 w-fit self-center border-t-2 border-b-2 border-indigo-700 p-4 p-4 text-gray-700 dark:border-blue-300 dark:text-gray-400"
	>
		{#if json.ghMetadata.reactions.total_count > 0}
			Reactions: <Reactions
				issueUrl={json.ghMetadata.issueUrl}
				reactions={json.ghMetadata.reactions}
			/>
		{:else}
			<a class="gh-link" href={json.ghMetadata.issueUrl}>Leave a reaction </a>
			if you liked this post! 🧡
		{/if}
	</div>
	<div class="mb-8 w-full">
		<Comments ghMetadata={json.ghMetadata} />
	</div>

	<!-- <Newsletter /> -->
</div>
