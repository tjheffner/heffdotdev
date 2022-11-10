
<script>
	export let title = 'Untitled post';
	export let href = '#';
</script>

<a sveltekit:prefetch {href} class="!bg-unset">
  <div class="card h-full p-2 rounded-xl text-center flex align-middle border-4 border-sky-600 dark:border-slate-500 hover:bg-red-300 hover:border-red-600 dark:hover:bg-yellow-400 dark:hover:border-yellow-800 transition-all">
  	<h3>
  		{title}
  	</h3>
  <div>
</a>

<style>
.card h3 {
  margin: auto;
}
.card h3::before {
  display: none;
}
.dark .card:hover {
  h3 {
    color: black;
  }
}
</style>
