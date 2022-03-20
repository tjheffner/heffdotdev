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
  import ProjectPopup from '../components/ProjectPopup.svelte';

  export let items;
</script>

<svelte:head>
  <title>{SITE_TITLE} | Work</title>
</svelte:head>

<section>
<Slice>
  <h1 class="mb-4 text-3xl font-bold tracking-tight text-orange-600 dark:text-blue-300 md:text-5xl">
    Past work
  </h1>
  <p class="font-semibold text-xl text-orange-600 dark:text-blue-300">
    A collection of previously completed projects, both personal and professional.
  </p>
</Slice>
<Slice title="Professional">

  <ul class="list-disc list-outside">
    {#each items as project}
      <li>
        <ProjectPopup project={project} />
      </li>
    {/each}
  </ul>

  <p> standard list: <p>
  <ul class="list-disc list-outside">
    <li>Twitter Brand Studio</li>
    <li>Google.org</li>
    <li>Pinterest Business</li>
    <li>Greenhouse</li>
    <li>Crohn's & Colitis Foundation</li>
    <li>Memorial Sloan Kettering Cancer Hospital</li>
    <li>University of the Arts</li>
    <li>Arsenal Football Club</li>
    <li>Al Jazeera</li>
  </ul>
</Slice>
<Slice title="Personal">
  <ul class="list-disc list-outside">
    <li>Blink</li>
    <li>Dieter Rothko</li>
    <li>File Cabinet Smoker</li>
    <li>Gallery</li>
  </ul>
</Slice>
</section>
