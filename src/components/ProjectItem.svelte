<script>
	export let href = '#';

	// gimme full item
	export let item;
</script>

<a sveltekit:prefetch
	  class="w-full no-underline !bg-unset"
    href={'/work/' + item.slug}
>
  <div>
    <p class="font-bold text-lg text-lime-500">{item.data.name}</p>

    <p class="text-slate-800 dark:text-gray-400 mb-2">{item.data.description}</p>
  </div>
</a>
