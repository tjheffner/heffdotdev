<script>
	import PostItem from '$lib/components/PostItem.svelte';
	import queryString from 'query-string';
	import { onMount } from 'svelte';

	export let data;
	let { items } = data;

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
		}
	};

	let recipes = false;
	let technical = false;
	let notes = false;

	let filterStr = '';

	onMount(() => {
		if (location.search.length < 1) return; // early terminate if no search
		let givenstate = queryString.parse(location.search);
		if (!Array.isArray(givenstate.show)) givenstate.show = [givenstate.show];
		if (!givenstate.show.includes('Recipes')) recipes = false;
		if (!givenstate.show.includes('Technical')) technical = false;
		if (!givenstate.show.includes('Notes')) notes = false;
		if (givenstate.filter) filterStr = givenstate.filter;
		urlState = { ...defaultURLState, ...givenstate };
	});

	function saveURLState() {
		showAll = true;
		setTimeout(() => {
			setURLState({
				filter: filterStr,
				show: [recipes && 'Recipes', technical && 'Technical', notes && 'Notes'].filter(Boolean)
			});
		}, 100);
	}

	// $: showAll = filterStr.length > 2
	$: showAll = false;

	function notIncludes(_filterStr, item) {
		let res = true;
		_filterStr = _filterStr.toLowerCase().replace('/', '');
		function incluye(thing) {
			// make sure to coerce to string bc sometimes yaml parses as string
			if (thing && String(thing).toLowerCase().includes(_filterStr)) res = false;
		}
		incluye(item.title);
		incluye(item.slug);
		incluye(item.category);
		incluye(item.description);
		return res;
	}

	let inputEl;
	function focusSearch(e) {
		if (e.key === '/' && inputEl) inputEl.select();
	}

	$: list = items
		.slice(0, showAll ? items.length : 10) // bump this up when more posts
		.filter((x) => {
			if (filterStr && notIncludes(filterStr, x)) {
				return false;
			} else {
				if ([recipes, technical, notes].every((v) => v === false)) return true;
				if (recipes && x.category === 'recipe') return true;
				if (technical && x.category === 'technical') return true;
				if (notes && x.category === 'note') return true;
			}
		});
</script>

<svelte:head>
	<title>heffner.dev | posts</title>
	<meta name="description" content="Latest musings fit to print." />
	<meta property="og:image" content={`https://heffner.dev/og?message=posts`} />
	<meta
		name="twitter:card"
		content={`https://heffner.dev/og?message=posts` ? 'summary_large_image' : 'summary'}
	/>
	<meta name="twitter:image" content={`https://heffner.dev/og?message=posts`} />
</svelte:head>

<svelte:window on:keyup={focusSearch} />

<section class="mx-auto mb-16 flex w-full flex-col items-start p-0 sm:px-8 lg:w-2/3">
	<h1 class="text-shadow mb-4 text-3xl font-bold tracking-tight md:text-5xl">Posts</h1>
	<p class="mb-4 text-zinc-900 dark:text-gray-400">
		In total, I've written {items.length} posts on my blog. Use the search below to filter.
	</p>

	<div class="relative w-full">
		<input
			aria-label="Search articles"
			type="text"
			bind:this={inputEl}
			on:input={saveURLState}
			bind:value={filterStr}
			placeholder="Hit / to search"
			class="block w-full rounded-md border border-zinc-400 bg-gray-200
						px-4 py-2 text-gray-900 placeholder:text-zinc-700
						dark:border-slate-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-zinc-50
						"
		/>
		<svg
			class="absolute right-3 top-3 h-5 w-5 text-gray-700 dark:text-gray-300"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
	</div>

	<!-- Filter Buttons -->
	<div class="my-4 flex w-full items-center">
		<span class="mr-2 text-zinc-900 dark:text-gray-400"> Filter: </span>
		<span class="">
			<button
				type="button"
				on:click={() => {
					saveURLState();
					recipes = !recipes;
				}}
				class:activefilter={recipes}
				class="filter"
			>
				Recipes
			</button>
			<button
				type="button"
				on:click={() => {
					saveURLState();
					technical = !technical;
				}}
				class:activefilter={technical}
				class="filter"
			>
				Technical
			</button>
			<button
				type="button"
				on:click={() => {
					saveURLState();
					notes = !notes;
				}}
				class:activefilter={notes}
				class="filter"
			>
				Notes
			</button>
		</span>
	</div>

	<hr class="mb-6 md:mb-12" />

	<!-- Results -->
	{#if list.length}
		<ul
			class="w-full divide-y divide-dashed divide-sky-600 md:mx-auto md:w-4/5 dark:divide-blue-300"
		>
			{#each list as item}
				<li class="mb-4 sm:mb-0">
					<PostItem {item} href={item.slug}>
						{item.description}
					</PostItem>
				</li>
			{/each}
		</ul>
		{#if !showAll}
			<div class="flex justify-center">
				<button
					on:click={() => (showAll = true)}
					class="my-4 rounded-lg bg-sky-600 p-2 font-bold text-orange-100 ring-red-600
					transition-all duration-200 ease-in-out hover:ring-2
					dark:bg-yellow-800 dark:text-yellow-100 dark:ring-yellow-400
					"
				>
					See more posts
				</button>
			</div>
		{/if}
	{:else if filterStr}
		<div class="prose dark:prose-invert">
			No posts found for
			<code>{filterStr}</code>.
		</div>
		<button
			on:click={() => (filterStr = '')}
			class="my-4 rounded-lg bg-yellow-400 p-2 font-bold text-yellow-800 ring-yellow-800
			transition-all duration-200 ease-in-out hover:ring-2
			dark:bg-yellow-800 dark:text-yellow-100 dark:ring-yellow-400
			"
		>
			Clear your search
		</button>
	{:else}
		<div class="prose dark:prose-invert">Search something else!</div>
	{/if}

	<div class="prose my-4">
		<a href="/feed">RSS feed available.</a>
	</div>
</section>
