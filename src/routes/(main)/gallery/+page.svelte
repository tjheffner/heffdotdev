<script>
	import Slice from '$lib/components/Slice.svelte';
	export let data;
	let { items } = data;
</script>

<svelte:head>
	<title>heffner.dev | gallery</title>
	<meta name="description" content="part photo gallery, part adventure log" />
	<meta property="og:image" content={`https://heffner.dev/og?message=adventure%20log`} />
	<meta
		name="twitter:card"
		content={`https://heffner.dev/og?message=adventure%20log` ? 'summary_large_image' : 'summary'}
	/>
	<meta name="twitter:image" content={`https://heffner.dev/og?message=adventure%20log`} />
</svelte:head>

<section class="mx-auto flex w-full flex-col items-start px-4 sm:p-0">
	<Slice>
		<h1 class="mb-6 text-3xl font-bold tracking-tight text-accent md:text-5xl">Gallery</h1>
		<p class="text-xl font-semibold text-accent">details, photos, ephemera from past adventures</p>
	</Slice>

	{#each items as trip}
		<Slice title={trip.title}>
			<a href="/gallery/{trip.slug}" style="display: inline-block"
				><img src={trip.image} alt={trip.alt} style="margin: 0" />
				{trip.description}
			</a>
		</Slice>
	{/each}
</section>
