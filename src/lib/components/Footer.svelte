<script>
  import Icon from '$lib/components/Icon.svelte'
  import NavLink from '$lib/components/NavLink.svelte'
  import { TWITTER_ID, LASTFM_ID, LETTERBOXD_ID, GH_USER } from '$lib/siteConfig'

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
</script>

<footer
  id="menu"
  class="flex flex-col justify-center bg-orange-100 px-4 py-4 sm:px-8 dark:bg-slate-900"
>
  <hr class="mb-8" />
  <div
    class="grid grid-cols-4 gap-4 md:mx-4 md:gap-8 lg:mx-12 lg:gap-12 xl:gap-16"
  >
    <div class="col-span-2 md:col-span-2">
      <NavLink href="/blog">Posts</NavLink>
      <NavLink href="/gallery">Gallery</NavLink>
      <NavLink href="/work">Work</NavLink>
      <NavLink href="/about">About</NavLink>
      <NavLink href="/blogroll">Blogroll</NavLink>
    </div>

    <div class="col-span-2 text-right md:col-start-4">
      <Icon href={`/rss.xml`} label="RSS">
        <svg viewBox="0 0 256 256" class="h-12 w-12 p-1" fill="currentColor">
          <circle cx="68" cy="189" r="24"/>
          <path d="M160 213h-34a82 82 0 0 0 -82 -82v-34a116 116 0 0 1 116 116z" />
          <path d="M184 213A140 140 0 0 0 44 73 V 38a175 175 0 0 1 175 175z" />
        </svg>
      </Icon>

      <Icon href={`https://twitter.com/${TWITTER_ID}`} label="Twitter">
        <svg viewBox="0 0 512 512" class="h-12 w-12 p-1" fill="currentColor">
          <path
            d="M419.6 168.6c-11.7 5.2-24.2 8.7-37.4 10.2 13.4-8.1 23.8-20.8 28.6-36 -12.6 7.5-26.5 12.9-41.3 15.8 -11.9-12.6-28.8-20.6-47.5-20.6 -42 0-72.9 39.2-63.4 79.9 -54.1-2.7-102.1-28.6-134.2-68 -17 29.2-8.8 67.5 20.1 86.9 -10.7-0.3-20.7-3.3-29.5-8.1 -0.7 30.2 20.9 58.4 52.2 64.6 -9.2 2.5-19.2 3.1-29.4 1.1 8.3 25.9 32.3 44.7 60.8 45.2 -27.4 21.4-61.8 31-96.4 27 28.8 18.5 63 29.2 99.8 29.2 120.8 0 189.1-102.1 185-193.6C399.9 193.1 410.9 181.7 419.6 168.6z"
          />
        </svg>
      </Icon>

      <!-- <Icon href={`https://instagram.com/${TWITTER_ID}`} label="Instagram">
        <svg class="h-12 w-12 p-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 3.79086 3.79086 2 6 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6ZM6 4C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9ZM7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12ZM17.5 8C18.3284 8 19 7.32843 19 6.5C19 5.67157 18.3284 5 17.5 5C16.6716 5 16 5.67157 16 6.5C16 7.32843 16.6716 8 17.5 8Z" fill="currentColor"/>
        </svg>
      </Icon> -->

      <Icon href={`https://github.com/${GH_USER}`} label="Github">
        <svg
          aria-hidden="true"
          class="h-12 w-12 p-1"
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
      </Icon>

      <Icon href="https://www.linkedin.com/in/tannerheffner" label="LinkedIn">
        <svg
          aria-hidden="true"
          class="h-12 w-12 p-1"
          fill="currentColor"
          viewBox="0 0 512 512"
        >
          <path
            d="M186.4 142.4c0 19-15.3 34.5-34.2 34.5 -18.9 0-34.2-15.4-34.2-34.5 0-19 15.3-34.5 34.2-34.5C171.1 107.9 186.4 123.4 186.4 142.4zM181.4 201.3h-57.8V388.1h57.8V201.3zM273.8 201.3h-55.4V388.1h55.4c0 0 0-69.3 0-98 0-26.3 12.1-41.9 35.2-41.9 21.3 0 31.5 15 31.5 41.9 0 26.9 0 98 0 98h57.5c0 0 0-68.2 0-118.3 0-50-28.3-74.2-68-74.2 -39.6 0-56.3 30.9-56.3 30.9v-25.2H273.8z"
          />
        </svg>
      </Icon>

      <Icon href={`https://www.last.fm/user/${LASTFM_ID}`} label="last.fm">
        <svg viewBox="0 0 256 256" class="h-12 w-12 p-1" fill="currentColor">
          <path d="M102.9,158.4c-4.9,4.4-14.4,13.3-30.3,13.3C54,171.8,36,155.4,36,129.3c0-33.5,21.5-44.3,38-44.3c23.8,0,29,14.4,35.5,34.2l8.7,27.2c8.6,26.4,24.9,47.7,71.6,47.7c33.5,0,56.2-10.4,56.2-37.6c0-22.1-12.5-33.5-35.7-39l-17.3-3.8c-11.9-2.7-15.4-7.6-15.4-15.8c0-9.3,7.3-14.7,19.2-14.7c13,0,20,4.9,21.1,16.6l27-3.3C242.7,72,226,61.9,198.4,61.9c-24.3,0-48.1,9.3-48.1,39c0,18.5,8.9,30.2,31.4,35.7l18.4,4.4c13.8,3.3,18.4,9,18.4,16.9c0,10.1-9.7,14.2-28.1,14.2c-27.3,0-41-14.4-47.5-34.3l-8.9-27.2C122.5,75,109.1,61.9,73.2,61.9C41.1,61.9,10,87.3,10,130.3c0,41.4,29.9,63.8,61.3,63.8c22.7,0,34.2-8,39.9-12.1L102.9,158.4z"/>
        </svg>
      </Icon>

      <Icon href={`https://letterboxd.com/${LETTERBOXD_ID}/`} label="Letterboxd">
        <svg viewBox="0 0 500 500" class="h-12 w-12 p-1" fill="currentColor">
          <defs>
            <rect id="path-1" x="0" y="0" width="129.847328" height="141.443299"></rect>
            <rect id="path-3" x="0" y="0" width="129.847328" height="141.443299"></rect>
          </defs>
          <g id="letterboxd-decal-dots-neg-mono" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Dots" transform="translate(61.000000, 180.000000)">
              <ellipse id="Green" fill="currentColor" cx="189" cy="70" rx="70.0786517" ry="70"></ellipse>
              <g id="Blue" transform="translate(248.152672, 0.000000)">
                <mask id="mask-2" fill="white">
                  <use xlink:href="#path-1"></use>
                </mask>
                <g id="Mask"></g>
                <ellipse fill="currentcolor" mask="url(#mask-2)" cx="59.7686766" cy="70" rx="70.0786517" ry="70"></ellipse>
              </g>
              <g id="Orange">
                  <mask id="mask-4" fill="white">
                    <use xlink:href="#path-3"></use>
                  </mask>
                  <g id="Mask"></g>
                  <ellipse fill="currentColor" mask="url(#mask-4)" cx="70.0786517" cy="70" rx="70.0786517" ry="70"></ellipse>
              </g>
            </g>
          </g>
        </svg>
      </Icon>
    </div>
  </div>
</footer>
