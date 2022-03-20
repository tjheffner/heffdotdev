<script context="module">
	export const prerender = true; // turned off so it refreshes quickly
	export async function load({ params, fetch }) {
		const res = await fetch(`../api/listLocalContent.json`);
		if (res.status > 400) {
			return {
				status: res.status,
				error: await res.text()
			};
		}

		/** @type {import('$lib/types').Project[]} */
		const items = await res.json();

		let sorted = items.map((item) => {
			return { ...item, date: new Date(item.data.date) };
		});

		sorted = sorted.sort((a, b) => Number(b.date) - Number(a.date));

		return {
			props: { sorted },
			maxage: 60 // 1 min
		};
	}
</script>

<script>
	import { SITE_TITLE } from '$lib/siteConfig';
	import Slice from '../components/Slice.svelte';
	import ProjectItem from '../components/ProjectItem.svelte';

	export let sorted;
</script>

<svelte:head>
	<title>{SITE_TITLE} | Work</title>
</svelte:head>

<section>
	<Slice>
		<h1 class="mb-6 text-3xl font-bold tracking-tight text-accent md:text-5xl">Past work</h1>
		<p class="text-xl font-semibold text-accent">
			A selection of previously completed projects, personal and professional.
		</p>
	</Slice>

	<Slice title="Professional" prose={false}>
		<ul class="list-none">
			{#each sorted as project}
				{#if project.data.type === 'professional'}
					<li>
						<ProjectItem item={project} href={project.slug} />
					</li>
				{/if}
			{/each}
		</ul>
		<p class="my-8 text-slate-800 dark:text-gray-400"><span class="font-bold text-indigo-700 dark:text-lime-500">Other clients:</span> Epic Games, Autism Speaks, Norweigan Cruise Lines, PGA Tour, Weight Watchers, Urban Institute, Wilson Center</p>

		<a href="/resume" class="font-bold text-indigo-700 dark:text-lime-500 hover:text-orange-600 dark:hover:text-yellow-400">Resume</a>
	</Slice>

	<Slice title="Personal" prose={false}>
		<ul class="list-none">
			{#each sorted as project}
				{#if project.data.type === 'personal'}
					<li>
						<ProjectItem item={project} href={project.slug} />
					</li>
				{/if}
			{/each}

			<!-- <li><a href="/gallery">Gallery</a></li> -->
		</ul>
	</Slice>
</section>
