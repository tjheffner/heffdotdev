<script>
	export let title = false;
	export let prose = true;

	let slotWrapperClasses = 'w-full md:w-2/3 md:ml-4 lg:ml-12';
	if (title && prose) {
		slotWrapperClasses = 'prose prose-lg prose-slate dark:prose-invert';
	}
	if (title && !prose) {
		slotWrapperClasses = 'not-prose';
	}
</script>

<div
	class="slice mb-6 grid w-full grid-cols-4 gap-4
						py-8 md:mb-8 md:gap-8 md:py-12 lg:gap-12 xl:gap-16
"
>
	{#if title}
		<div class="col-span-4 md:col-span-1">
			<h2
				class="sticky top-4 mb-2 text-xl font-bold
							 text-black dark:text-blue-300 md:ml-4 md:text-2xl lg:ml-12
		"
			>
				<a href="#{title}" class="slice-title">
					{title}
				</a>
			</h2>
		</div>
	{/if}
	<div class={title ? 'col-span-4 md:col-span-3 xl:col-span-2' : 'col-span-4'}>
		<p class={slotWrapperClasses}>
			<!-- <p class="{title ? 'prose prose-lg prose-slate dark:prose-invert' : 'w-full md:w-2/3 md:ml-4 lg:ml-12'}"> -->
			<slot />
		</p>
	</div>
</div>

<style>
	.slice h2::before {
		display: none;
	}
	.slice-title {
		color: var(--brand-accent) !important;
	}
	.slice:not(:first-child) {
		border-top: 2px solid var(--brand-accent);
	}
</style>
