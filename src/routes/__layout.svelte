<script context="module">
	import { MY_TWITTER_HANDLE, REPO_URL, SITE_TITLE } from '$lib/siteConfig';
</script>

<script>
	import '../tailwind.css';
	import Nav from '../components/Nav.svelte';
</script>

<svelte:head>
	<link
		rel="alternate"
		type="application/rss+xml"
		title={'RSS Feed for ' + SITE_TITLE}
		href="/rss.xml"
	/>
</svelte:head>

<div class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-8">
	<Nav />
</div>
<main class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-8">
	<slot />
</main>

<!-- <footer class="mx-auto mb-8 flex w-full max-w-2xl flex-col items-start justify-center">
	<hr class="border-1 mb-8 w-full border-gray-200 dark:border-gray-800" />
	<p class="prose dark:prose-invert"> built with svelte, based on swyxkit </p>
</footer> -->
