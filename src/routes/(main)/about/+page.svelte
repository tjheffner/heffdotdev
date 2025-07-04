<script lang="ts">
  import Slice from '$lib/components/Slice.svelte'
  import {
    SITE_URL,
    SITE_TITLE,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    TWITTER_ID,
  } from '$lib/siteConfig'
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

<section class="">
  <Slice full={true}>
    <h1 class="">
      information desk
    </h1>

    <div>
      <h2>about me</h2>
      <p>my name is <strong>tanner heffner</strong> and i am based out of <strong>portland, oregon</strong>.</p>
      <p>i have been a software engineer for over a decade and still love the feeling when launching a fresh <strong>hello world!</strong></p>
      <a href="/resume" target="_blank">[resume]</a>



      <h2>about the site</h2>
      <p>perpetually under construction but coming together 🏄‍♂️</p>

      <p>parts <a href="/blog">blog,</a> <a href="/gallery">photo gallery,</a> <a href="/about/latest">tracker,</a> and <a href="/christmas">playground</a></p>

      <p>it's my own personal <a href="https://joelhooks.com/digital-garden" target="_blank">digital garden</a>, using
      <a href="https://swyxkit.netlify.app/about" target="_blank">swyxkit</a> as a starting point</p>

      <p><a href="https://github.com/tjheffner/heffdotdev">public on github</a> and hosted via <a href="https://www.netlify.com/">netlify</a></p>
      <p><a href="/heffdotdev-technical-details">this post</a> explains more about the tools i chose and why</p>

      <p><strong>thank you</strong> for stopping by!</p>
    </div>
  </Slice>
</section>