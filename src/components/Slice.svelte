<script>
	export let title = false;
</script>

<div class="slice w-full py-8 md:py-12 mb-6 md:mb-8
						grid grid-cols-4 gap-4 md:gap-8 lg:gap-12 xl:gap-16
">
  {#if title}
	<div class="col-span-4 md:col-span-1">
		<h2 class="sticky top-4 mb-2 md:ml-4 lg:ml-12
							 text-black font-bold dark:text-blue-300 text-xl md:text-2xl
		">
			<a href="#{title}" class="slice-title">
			{title}
			</a>
		</h2>
	</div>
  {/if}
  <div class="{title ? 'col-span-4 md:col-span-3 xl:col-span-2' : 'col-span-4'}">
  	<p class="{title ? 'prose prose-lg prose-slate dark:prose-invert' : 'w-full md:w-2/3 md:ml-4 lg:ml-12'}">
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
