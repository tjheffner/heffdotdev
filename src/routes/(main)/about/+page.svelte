<script>
  import Slice from '$lib/components/Slice.svelte'
  import Card from '$lib/components/Card.svelte'
  import EmojiWall from '$lib/components/EmojiWall.svelte'
  import Currently from '$lib/components/Currently.svelte'
  // import GetInTouch from '$lib/components/GetInTouch.svelte'
  import {
    SITE_URL,
    SITE_TITLE,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    TWITTER_ID,
  } from '$lib/siteConfig'

  // data from +page.server.js, keeps api keys private
  export let data;
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
    <h1 class="text-shadow text-3xl font-bold lg:text-5xl">
      welcome to my page
    </h1>
    <EmojiWall />
  </Slice>

  <Slice title="Hello world!">
    <p>This site is perpetually under construction but coming along. 😎</p>

    ## the site
    this site is the online home of tanner heffner. it's part [blog](/blog), [portfolio](/work), [photo gallery](/gallery),  [playground](/christmas), [resume](/resume), and all [digital garden](https://joelhooks.com/digital-garden), using [swyxkit](https://swyxkit.netlify.app/about) as my starting point. [this post](/heffdotdev-technical-details) explains more about the tools i chose and why.

    you'll find technical snippets & longer blogs, cooking recipes, old projects both professional and personal, and potentially much more. we're just getting started watering this garden :)

    ## me
    i do a lot of different stuff. when i'm not staring at screens for work and fun,
    i like to get outside in the pnw.

    i'm interested in cooking, DIY, sustainability,
    gardening, disc golf, and a whole lot more.
  </Slice>

  <Slice title="Favorite recipes">
    <p>In no particular order, these are recipes I get a lot of mileage out of...</p>
    <div class="grid w-full grid-cols-1 gap-4 align-middle md:grid-cols-3">
      <Card title="Creme Brulee" href={'/creme-brulee'} />
      <Card title="Caper Butter" href={'/dill-caper-compound-butter'} />
      <Card title="Preserved Lemons" href={'/preserved-lemons'} />
      <Card title="Pizza Dough" href={'/pizza-dough'} />
      <Card title="Chicken & Beans" href={'/southwest-chicken-bean-stew'} />
      <Card title="Shrimp and Rice" href={'/shrimp-and-rice'} />
    </div>
  </Slice>

  <Slice title="Currently">
    <Currently recentlyListened={recentlyListened}
               recentlyWatched={recentlyWatched}
               recentlyPlayed={recentlyPlayed}
               duolingo={duolingo}
    />
  </Slice>

  <!-- <GetInTouch /> -->

</section>
