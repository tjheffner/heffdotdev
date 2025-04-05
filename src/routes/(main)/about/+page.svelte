<script lang="ts">
  import Slice from '$lib/components/Slice.svelte'
  import Card from '$lib/components/Card.svelte'
  import EmojiWall from '$lib/components/EmojiWall.svelte'
  import Currently from '$lib/components/Currently.svelte'
  import {
    SITE_URL,
    SITE_TITLE,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    TWITTER_ID,
  } from '$lib/siteConfig'


  interface Props {
    // data from +page.server.js, keeps api keys private
    data: any;
  }

  let { data }: Props = $props();
  const { recentlyListened, recentlyWatched, recentlyPlayed, duolingo } = data;
</script>

<svelte:head>
  <title>{SITE_TITLE}</title>
  <link rel="canonical" href={SITE_URL} />
  <link
    rel="alternate"
    type="application/rss+xml"
    href={SITE_URL + '/rss.xml'}
  />
  <meta property="og:url" content={SITE_URL} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={SITE_TITLE} />
  <meta name="Description" content={SITE_DESCRIPTION} />
  <meta property="og:description" content={SITE_DESCRIPTION} />
  <meta property="og:image" content={DEFAULT_OG_IMAGE} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:creator" content={'@' + TWITTER_ID} />
  <meta name="twitter:title" content={SITE_TITLE} />
  <meta name="twitter:description" content={SITE_DESCRIPTION} />
  <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section class="mx-auto flex w-full flex-col items-start px-4 sm:p-0">
  <Slice full={true}>
    <h1 class="text-secondary text-3xl font-bold lg:text-5xl mb-4">
      information desk
    </h1>

    <div class="prose">
      <h2>about the site</h2>
      <p>this site is the online home of <strong>tanner heffner</strong>.</p>
      <p>it's perpetually under construction but coming together 🏄‍♂️</p>

      <p>parts <a href="/blog">blog,</a> <a href="/gallery">photo gallery,</a> web <a href="/christmas"> playground,</a> and <a href="/resume" target="_blank">resume</a></p>

      <p>this site is my own personal <a href="https://joelhooks.com/digital-garden" target="_blank">digital garden</a>, using
      <a href="https://swyxkit.netlify.app/about" target="_blank">swyxkit</a> as my starting point.</p>

      <p>this site is <a href="https://github.com/tjheffner/heffdotdev">public on github</a> and hosted via <a href="https://www.netlify.com/">netlify</a>.</p>
      <p><a href="/heffdotdev-technical-details">this post</a> explains more about the tools i chose and why.</p>


      <h2>about me</h2>
      <p>i am based out of <strong>portland, oregon</strong>. in my free time i like to play disc golf, ride my bike, garden, cook, hit the gym, and make art. i generally find a way to get outside, weather permitting. i have been a software engineer for over a decade and i still love the feeling when i launch a fresh <strong>hello world!</strong></p>
      <p>you can find my professional resume <a href="/resume" target="_blank">over here</a>.</p>


      <h2>other cool pages i enjoy</h2>
      <ul>
        <li><a href="https://darkdell.net">nug doug</a></li>
        <li><a href="https://critter.blog">mike crittenden</a></li>
        <li><a href="https://defector.com">defector</a></li>
        <li><a href="https://www.brightsideofthesun.com/">bright side of the sun</a></li>
        <li><a href="https://www.fujichia.com/">fujichia</a></li>
        <li><a href="https://www.swyx.io/">shawn wang</a></li>
        <li><a href="https://css-tricks.com/">css-tricks</a></li>
        <li><a href="https://www.randibolt.com/">randi bolt</a></li>
      </ul>

      <p><strong>thank you</strong> for stopping by!</p>
    </div>
  </Slice>
</section>

<style>
  ul {
    list-style: none;
  }
  li:before {
    content: '\1F525';
    margin-left: -20px;
    margin-right: 10px;
  }
</style>
