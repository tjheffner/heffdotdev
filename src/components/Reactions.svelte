<script>
	/** @type {import('$lib/types').GHReactions} */
	export let reactions;
	/** @type {string}*/
	export let issueUrl;
	let emojiMap = {
		'+1': '👍',
		'-1': '👎',
		laugh: '😆',
		hooray: '🎉',
		confused: '😕',
		heart: '❤️',
		rocket: '🚀',
		eyes: '👀'
	};
</script>

{#if reactions.total_count > 0}
<a href={`${issueUrl}`}
	 class="no-underline !bg-unset font-bold text-accent hover:text-accent dark:text-yellow-400 dark:hover:text-yellow-400">
	{#each Object.keys(reactions) as reaction}
		{#if Object.keys(emojiMap).includes(reaction) && reactions[reaction] > 0}
			<span class="reaction-button">
				<span class="space-x-1 p-2">
					<span class="reaction-button-emoji">{emojiMap[reaction]}</span>
					<span class="reaction-button-count">{reactions[reaction]}</span>
				</span>
			</span>
		{/if}
	{/each}
</a>
{/if}
