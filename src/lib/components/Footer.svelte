<script>
  import { Footer, Link } from '@hyzer-labs/ui'
  import { GH_USER } from '$lib/siteConfig'
</script>

<Footer columns={[]} class="wrapper site-footer">
  {#snippet social()}
    <Link href="/rss.xml" ariaLabel="RSS" class="icon">
      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <circle cx="68" cy="189" r="24"/>
        <path d="M160 213h-34a82 82 0 0 0 -82 -82v-34a116 116 0 0 1 116 116z" />
        <path d="M184 213A140 140 0 0 0 44 73 V 38a175 175 0 0 1 175 175z" />
      </svg>
    </Link>

    <Link href={`https://github.com/${GH_USER}`} ariaLabel="Github" class="icon">
      <svg
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          fill-rule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
        0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608
        1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088
        2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988
        1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112
        6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202
        2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566
        4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019
        10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clip-rule="evenodd"
        />
      </svg>
    </Link>

    <Link href="https://www.linkedin.com/in/tannerheffner" ariaLabel="LinkedIn" class="icon">
      <svg
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 512 512"
      >
        <path
          d="M186.4 142.4c0 19-15.3 34.5-34.2 34.5 -18.9 0-34.2-15.4-34.2-34.5 0-19 15.3-34.5 34.2-34.5C171.1 107.9 186.4 123.4 186.4 142.4zM181.4 201.3h-57.8V388.1h57.8V201.3zM273.8 201.3h-55.4V388.1h55.4c0 0 0-69.3 0-98 0-26.3 12.1-41.9 35.2-41.9 21.3 0 31.5 15 31.5 41.9 0 26.9 0 98 0 98h57.5c0 0 0-68.2 0-118.3 0-50-28.3-74.2-68-74.2 -39.6 0-56.3 30.9-56.3 30.9v-25.2H273.8z"
        />
      </svg>
    </Link>
  {/snippet}
</Footer>

<style>
  :global(.site-footer .hz-footer-social) {
    margin: var(--hz-space-away) 0 var(--hz-space-near);
    text-align: right;
  }
  :global(.site-footer .icon) {
    display: inline-block;
    width: 60px;
    border-radius: 8px;
    margin: 0.25rem;
    transition: all ease-in-out 0.3s;
    color: var(--hz-intent-primary);
  }
  :global(.site-footer .icon:hover) {
    background-color: var(--hz-intent-secondary);
    color: var(--hz-color-surface);
  }
</style>
