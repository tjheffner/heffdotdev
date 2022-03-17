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

<div class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-slate-900 sm:px-8">
	<Nav />
</div>
<!-- skip link added in nav -->
<main id="skip" class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-slate-900 sm:px-8">
	<slot />
</main>

<footer class="flex flex-col justify-center bg-gray-50 px-4 py-12 dark:bg-slate-900 sm:px-8">
	<hr class="border-1 mb-8 w-full border-gray-200 dark:border-blue-300" />
	<div class="prose prose-slate dark:prose-invert md:ml-4 lg:ml-12">
		<a class="block" href="/blog">Posts</a>
		<a class="block" href="#">Work [coming soon]</a>
		<a class="block" href="#">Gallery [coming soon]</a>
		<a class="block" href="/about">About</a>
		<p>© 2022 tanner heffner</p>
	</div>
</footer>
