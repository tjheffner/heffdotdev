<script>
	import '../tailwind.css';
	import Header from '../components/Header.svelte';
	import Icon from '../components/Icon.svelte';
	import NavLink from '../components/NavLink.svelte';
	import Slice from '../components/Slice.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { MY_TWITTER_HANDLE, GH_USER, SITE_TITLE } from '$lib/siteConfig';

	import { fade } from 'svelte/transition'

	let showBackToTop = true;
	let showGetInTouch = false;

	export let data

	onMount(async () => {
		if ($page.url.pathname === '/') showBackToTop = !showBackToTop;
		if ($page.url.pathname === '/about') showGetInTouch = !showGetInTouch;
	})
</script>

<svelte:head>
	<link
		rel="alternate"
		type="application/rss+xml"
		title={'RSS Feed for ' + SITE_TITLE}
		href="/rss.xml"
	/>
</svelte:head>

<div class="flex flex-col justify-center bg-orange-100 px-4 py-12 dark:bg-slate-900 sm:px-8">
	<Header />
</div>
<!-- for skip link -->

{#key data.currentRoute}
<main
	in:fade={{ duration: 150, delay: 150 }} out:fade={{ duration: 150 }}
	id="maincontent"
	class="flex flex-col justify-center bg-orange-100 px-4 dark:bg-slate-900 sm:px-8"
>
	<slot />

{#if showBackToTop}
	<a href="#maincontent" class="font-bold text-accent md:mx-4 lg:mx-12">Back to top</a>
{/if}

</main>

<footer class="flex flex-col justify-center bg-orange-100 px-4 py-12 dark:bg-slate-900 sm:px-8">
	{#if showGetInTouch}
		<br> <!-- force slice top-border -->
		<Slice title="Contact">
		  <p class="mb-3 text-2xl font-bold">I'm reachable online in a few places</p>

		  <p class="mb-3">
		    Feel free to send me an <a href="mailto:tannerjheffner@gmail.com">email</a> or connect on
		    <a href="https://www.linkedin.com/in/tannerheffner/">linkedin</a> with a message or tweet <a href={`https://twitter.com/${MY_TWITTER_HANDLE}`}>@{MY_TWITTER_HANDLE}.</a> Thanks for visiting!
		  </p>

		  <p class="font-bold">
		    Please no recruiters. I'm happy where I'm at. <span role="img" aria-label="happy cowboy"
		      >&#129312;</span
		    >
		  </p>
		</Slice>
	{/if}
	<hr class="mb-8" />
	<div class="grid grid-cols-4 gap-4 md:mx-4 md:gap-8 lg:mx-12 lg:gap-12 xl:gap-16">
		<div class="col-span-3 md:col-span-2">
			<NavLink href="/blog">Posts</NavLink>
			<NavLink href="/work">Work</NavLink>
			<NavLink href="/about">About</NavLink>
		</div>

		<div class="col-span-1 text-right md:col-span-2 md:col-start-4">
			<Icon href={`https://twitter.com/${MY_TWITTER_HANDLE}`} label="Twitter">
				<svg viewBox="0 0 512 512" class="h-12 w-12 p-1" fill="currentColor">
					<path
						d="M419.6 168.6c-11.7 5.2-24.2 8.7-37.4 10.2 13.4-8.1 23.8-20.8 28.6-36 -12.6 7.5-26.5 12.9-41.3 15.8 -11.9-12.6-28.8-20.6-47.5-20.6 -42 0-72.9 39.2-63.4 79.9 -54.1-2.7-102.1-28.6-134.2-68 -17 29.2-8.8 67.5 20.1 86.9 -10.7-0.3-20.7-3.3-29.5-8.1 -0.7 30.2 20.9 58.4 52.2 64.6 -9.2 2.5-19.2 3.1-29.4 1.1 8.3 25.9 32.3 44.7 60.8 45.2 -27.4 21.4-61.8 31-96.4 27 28.8 18.5 63 29.2 99.8 29.2 120.8 0 189.1-102.1 185-193.6C399.9 193.1 410.9 181.7 419.6 168.6z"
					/>
				</svg>
			</Icon>

			<Icon href={`https://github.com/${GH_USER}`} label="Github">
				<svg aria-hidden="true" class="h-12 w-12 p-1" fill="currentColor" viewBox="0 0 24 24">
					<path
						fill-rule="evenodd"
						d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
						0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608
						1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088
						2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988
						1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112
						6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202
						2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566
						4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019
						10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
						clip-rule="evenodd"
					/>
				</svg>
			</Icon>

			<Icon href="https://www.linkedin.com/in/tannerheffner" label="LinkedIn">
				<svg aria-hidden="true" class="h-12 w-12 p-1" fill="currentColor" viewBox="0 0 512 512">
					<path
						d="M186.4 142.4c0 19-15.3 34.5-34.2 34.5 -18.9 0-34.2-15.4-34.2-34.5 0-19 15.3-34.5 34.2-34.5C171.1 107.9 186.4 123.4 186.4 142.4zM181.4 201.3h-57.8V388.1h57.8V201.3zM273.8 201.3h-55.4V388.1h55.4c0 0 0-69.3 0-98 0-26.3 12.1-41.9 35.2-41.9 21.3 0 31.5 15 31.5 41.9 0 26.9 0 98 0 98h57.5c0 0 0-68.2 0-118.3 0-50-28.3-74.2-68-74.2 -39.6 0-56.3 30.9-56.3 30.9v-25.2H273.8z"
					/>
				</svg>
			</Icon>
		</div>
	</div>
</footer>
{/key}
