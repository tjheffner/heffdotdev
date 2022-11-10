<script>
	import { SITE_TITLE } from '$lib/siteConfig';
	import Slice from '../../components/Slice.svelte';
	import ProjectItem from '../../components/ProjectItem.svelte';

	export let data;
	let { items } = data;
</script>

<svelte:head>
	<title>{SITE_TITLE} | Work</title>
</svelte:head>

<section class="mx-auto px-4 sm:p-0 flex w-full flex-col items-start">
	<Slice>
		<h1 class="mb-6 text-3xl font-bold tracking-tight text-accent md:text-5xl">Past work</h1>
		<p class="text-xl font-semibold text-accent">
			A selection of previously completed projects, personal and professional.
		</p>
	</Slice>

	<Slice title="Professional" prose={false}>
		<ul class="list-none">
			{#each items as project}
				{#if project.data.type === 'professional'}
					<li>
						<ProjectItem item={project} href={project.slug} />
					</li>
				{/if}
			{/each}
		</ul>
		<p class="font-bold text-lg text-orange-600 dark:text-lime-500">Other clients</p>
		<p class="mb-8 text-slate-800 dark:text-gray-400"> Department of Veterans Affairs, Epic Games, Crossfit, Norwegian Cruise Line, PGA Tour, Weight Watchers, Urban Institute, Wilson Center</p>

		<a href="/resume" class="font-bold text-lg text-orange-600 dark:text-lime-500 hover:text-red-600 dark:hover:text-yellow-400">Resume</a>
	</Slice>

	<Slice title="Personal" prose={false}>
		<ul class="list-none">
			{#each items as project}
				{#if project.data.type === 'personal'}
					<li>
						<ProjectItem item={project} href={project.slug} />
					</li>
				{/if}
			{/each}

			<!-- <li>
				<a href="/gallery" class="block font-bold text-lg text-indigo-700 dark:text-lime-500 hover:text-orange-600 dark:hover:text-yellow-400">gallery</a>
				<p class="mb-2 text-slate-800 dark:text-gray-400">digital art, photography</p>
			</li> -->
		</ul>
	</Slice>
</section>
