<script context="module">
	// export const prerender = true; // turned off so it refreshes quickly
	export async function load({ params, fetch }) {
		const res = await fetch(`/api/listContent.json`);
		if (res.status > 400) {
			return {
				status: res.status,
				error: await res.text()
			};
		}

		/** @type {import('$lib/types').ContentItem[]} */
		const items = await res.json();
		return {
			props: { items },
			maxage: 60 // 1 min
		};
	}
</script>

<script>
	import IndexCard from '../components/IndexCard.svelte';
	import queryString from 'query-string';
	import { onMount } from 'svelte';

	let urlState = { filter: '', show: [] };
	let defaultURLState = { filter: '', show: [] };

	const setURLState = (newState) => {
		// merge with existing state
		const finalState = { ...urlState, ...newState };
		urlState = finalState;

		Object.keys(finalState).forEach(function (k) {
			if (
				// don't save some state values if it meets the conditions below
				!finalState[k] || // falsy
				finalState[k] === '' || // string
				(Array.isArray(finalState[k]) && !finalState[k].length) || // array
				finalState[k] === defaultURLState[k] // same as default state, unnecessary
			) {
				delete finalState[k]; // drop query params with new values = falsy
			}
		});
		if (typeof window !== 'undefined') {
			history.pushState(
				{},
				'',
				document.location.origin +
					document.location.pathname +
					'?' +
					queryString.stringify(finalState)
			);
		};
	};

	let recipes = false;
	let snippets = false;
	let technical = false;
	let notes = false;

	let filterStr = '';

	onMount(() => {
		if (location.search.length < 1) return; // early terminate if no search
		let givenstate = queryString.parse(location.search);
		if (!Array.isArray(givenstate.show)) givenstate.show = [givenstate.show];
		if (!givenstate.show.includes('Recipes')) recipes = false;
		if (!givenstate.show.includes('Technical')) technical = false;
		if (!givenstate.show.includes('Snippets')) snippets = false;
		if (!givenstate.show.includes('Notes')) notes = false;
		if (givenstate.filter) filterStr = givenstate.filter;
		urlState = { ...defaultURLState, ...givenstate };
	});

	function saveURLState() {
		showAll = true
		setTimeout(() => {
			setURLState({
				filter: filterStr,
				show: [
					recipes && 'Recipes',
					snippets && 'Snippets',
					technical && 'Technical',
					notes && 'Notes'
				].filter(Boolean)
			});
		}, 100);
	}

	// $: showAll = filterStr.length > 2;
	$: showAll = true;

	function notIncludes(_filterStr, item) {
		let res = true;
		_filterStr = _filterStr.toLowerCase().replace('/', '');
		function incluye(thing) {
			// make sure to coerce to string bc sometimes yaml parses as string
			if (thing && String(thing).toLowerCase().includes(_filterStr)) res = false;
		}
		incluye(item.title);
		incluye(item.slug);
		incluye(item.categories);
		incluye(item.description);
		return res;
	}

	let inputEl;
	function focusSearch(e) {
		if (e.key === '/' && inputEl) inputEl.select();
	}

	export let items;

	$: list = items
		.slice(0, showAll ? items.length : 20)
		.filter((x) => {
			if (filterStr && notIncludes(filterStr, x)) {
				return false;
			} else {
				if ([recipes, technical, snippets, notes].every(v => v === false)) return true;
				if (recipes && x.category === 'recipe') return true;
				if (technical && x.category === 'technical') return true;
				if (snippets && x.category === 'snippet') return true;
				if (notes && x.category === 'note') return true;
			}
		});
</script>

<svelte:head>
	<title>heffdotdev | posts</title>
	<meta name="description" content="Latest musings fit to print." />
</svelte:head>

<svelte:window on:keyup={focusSearch} />

<section class="mx-auto mb-16 flex max-w-2xl flex-col items-start justify-center px-4 sm:px-8">
	<h1 class="mb-4 text-3xl font-bold tracking-tight text-black dark:text-white md:text-5xl">
		Posts
	</h1>
	<p class="mb-4 text-gray-600 dark:text-gray-400">
		In total, I've written {items.length} posts on my blog. Use the search below to
		filter by title.
	</p>
	<div class="relative w-full">
		<input
			aria-label="Search articles"
			type="text"
			bind:this={inputEl}
			on:input={saveURLState}
			bind:value={filterStr}
			placeholder="Hit / to search"
			class="block w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-900 dark:bg-gray-800 dark:text-gray-100"
		/><svg
			class="absolute right-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/></svg
		>
	</div>
	<div class="mb-12 mt-2 flex items-center ">
		<span class="mr-2 text-gray-900 dark:text-gray-400"> Filter: </span>
		<span class="relative z-0 grid grid-cols-3 rounded-md shadow-sm sm:grid-cols-6">
			<!-- <div class="inline-flex items-center text-gray-600 dark:text-gray-400 mr-2 italic px-4">Show:</div> -->
			<button
				type="button"
				on:click={() => {
					saveURLState();
					recipes = !recipes;
				}}
				class:bimodalpurple={recipes}
				class:mytext={recipes}
				class:font-medium={recipes}
				class="focus:ring-yellow relative -ml-px inline-flex items-center border border-gray-300
      px-4 py-2 text-sm leading-5 text-gray-700
     transition duration-150 ease-in-out
      focus:z-10 focus:border-blue-300 focus:text-yellow-400 focus:outline-none
       dark:text-gray-200 sm:ml-0
      sm:rounded-l-md"
			>
				Recipes
			</button>
			<button
				type="button"
				on:click={() => {
					saveURLState();
					snippets = !snippets;
				}}
				class:bimodalpurple={snippets}
				class:mytext={snippets}
				class:font-medium={snippets}
				class="focus:ring-yellow relative -ml-px inline-flex items-center border border-gray-300
        px-4 py-2 text-sm leading-5 text-gray-700
       transition duration-150
        ease-in-out focus:z-10 focus:border-blue-300
       focus:text-yellow-400 focus:outline-none dark:text-gray-200"
			>
				Snippets
			</button>
			<button
				type="button"
				on:click={() => {
					saveURLState();
					technical = !technical;
				}}
				class:bimodalpurple={technical}
				class:mytext={technical}
				class:font-medium={technical}
				class="focus:ring-yellow relative -ml-px inline-flex items-center border border-gray-300
        px-4 py-2 text-sm leading-5 text-gray-700
       transition duration-150
        ease-in-out focus:z-10 focus:border-blue-300
       focus:text-yellow-400 focus:outline-none dark:text-gray-200"
			>
				Technical
			</button>
			<button
				type="button"
				on:click={() => {
					saveURLState();
					notes = !notes;
				}}
				class:bimodalpurple={notes}
				class:mytext={notes}
				class:font-medium={notes}
				class="
      focus:ring-yellow relative -ml-px inline-flex items-center border border border-gray-300 px-4
      py-2 text-sm leading-5 text-gray-700 transition
     duration-150 ease-in-out
      focus:z-10 focus:border-blue-300 focus:text-yellow-400
     focus:outline-none dark:text-gray-200 sm:rounded-r-md"
			>
				Notes
			</button>
		</span>
	</div>
	{#if list.length}
		<ul class="max-w-full">
			{#each list as item}
				<li class="mb-4">
					<IndexCard item={item}>
						{item.description}
					</IndexCard>
				</li>
			{/each}
		</ul>
		{#if !showAll}
			<div class="flex justify-center">
				<button
					on:click={() => (showAll = true)}
					class="inline-block rounded bg-blue-100 p-4 text-lg font-bold tracking-tight text-black hover:text-yellow-900 dark:bg-blue-900 dark:text-white hover:dark:text-yellow-200 md:text-2xl"
				>
					Load More Posts...
				</button>
			</div>
		{/if}
	{:else if filterStr}
		<div class="prose dark:prose-invert">
			No posts found for
			<code>{filterStr}</code>.
		</div>
		<button class="p-2 bg-slate-500" on:click={() => (filterStr = '')}>Clear your search</button>
	{:else}
		<div class="prose dark:prose-invert">Search something else!</div>
	{/if}
</section>
