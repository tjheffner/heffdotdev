<script>
  let isDark = false
  if (typeof localStorage !== 'undefined') {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      isDark = true
    }
  }
  function toggleDarkMode() {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
      isDark = false
    } else {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
      isDark = true
    }
  }
</script>

<nav class="relative flex justify-between md:mx-4 lg:mx-12">
  <h1
    class="text-lg font-bold text-accent transition-all duration-200 ease-in-out hover:scale-110"
  >
    <a href="/">heffner.dev</a>
  </h1>
  <div class="flex">
    <a href="#menu"
       class="flex mr-3 h-9 w-9 items-center justify-center rounded-lg"
    >
      <svg
        class="absolute h-5 w-5 text-red-600 dark:text-yellow-400"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        >
        <path
          d="M2.5 7.5H17.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M2.5 12.5H17.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>
    <button
      aria-label="Toggle Dark Mode"
      class="ml-1 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 ring-red-600 transition-all
  		hover:ring-2 dark:bg-yellow-800 dark:ring-yellow-400"
      on:click={toggleDarkMode}
    >
      {#if isDark}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="h-5 w-5 text-gray-800 dark:text-yellow-100"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728
  					0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="h-5 w-5 text-orange-100 dark:text-gray-200"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      {/if}
    </button>
  </div>
</nav>
