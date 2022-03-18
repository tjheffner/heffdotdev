<script>
	import { page } from '$app/stores';
	$: isActive = $page.url.pathname === $$props.href;
	export let href;
</script>

<a
	class="{isActive
		? 'block w-fit my-4 footer-link font-bold text-sky-200 dark:text-slate-900 bg-[length:4px_50px]'
		: 'block w-fit my-4 footer-link font-bold'
	}"
	{href}
	>
	<slot />
</a>
