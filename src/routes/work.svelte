<script context="module">
	// export const prerender = true; // turned off so it refreshes quickly
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
		return {
			props: { items },
			maxage: 60 // 1 min
		};
	}
</script>

<script>
  import { SITE_TITLE } from '$lib/siteConfig';
  import Slice from '../components/Slice.svelte';
  import ProjectItem from '../components/ProjectItem.svelte';

  export let items;
</script>

<svelte:head>
  <title>{SITE_TITLE} | Work</title>
</svelte:head>

<section>
	<Slice>
	  <h1 class="mb-4 text-3xl font-bold tracking-tight text-accent md:text-5xl">
	    Past work
	  </h1>
	  <p class="font-semibold text-xl text-accent">
	    A collection of previously completed projects, personal and professional.
	  </p>
	</Slice>

	<Slice title="Professional">
	  <ul class="list-none">
	    {#each items as project}
				{#if project.data.type === "professional"}
	      <li>
	        <ProjectItem item={project} href={project.slug} />
	      </li>
				{/if}
	    {/each}
	  </ul>
	</Slice>

	<Slice title="Personal">
		<ul class="list-none">
	    {#each items as project}
				{#if project.data.type === "personal"}
	      <li>
	        <ProjectItem item={project} href={project.slug} />
	      </li>
				{/if}
	    {/each}

			<!-- <li><a href="/gallery">Gallery</a></li> -->
	  </ul>
	</Slice>
</section>
