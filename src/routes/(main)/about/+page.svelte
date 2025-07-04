<script lang="ts">
  import Details from '$lib/components/Details.svelte'
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

<section class="wrapper prose">
    <h1>information kiosk</h1>

    <Details title="about me" open>
      <p>My name is <strong>tanner heffner</strong> and I am based out of <strong>portland, oregon</strong>.</p>

      <p>I enjoy disc golf, cooking, gardening, making art, riding bikes and plenty more. My girlfriend says I like to learn things the hard way, and I would say that's probably accurate. There's beauty in the struggle.</p>

      <p>A software engineer for over a decade and I still love the feeling when launching a fresh <strong>hello world!</strong></p>

      <a href="/resume" target="_blank">[resume]</a>
    </Details>

    <Details title="about the site">
      <p>heffner.dev is perpetually under construction but coming together 🏄‍♂️</p>

      <p>parts <a href="/blog">blog,</a> <a href="/gallery">photo gallery,</a> <a href="/about/latest">tracker,</a> and <a href="/christmas">playground</a></p>

      <p>it's my own personal <a href="https://joelhooks.com/digital-garden" target="_blank">digital garden</a>, built with <a href="https://svelte.dev/docs/kit/introduction" target="_blank">sveltekit</a> and leveraging github issues as my CMS.</p>

      <p>the code is <a href="https://github.com/tjheffner/heffdotdev">public on github</a> and hosted via <a href="https://www.netlify.com/">netlify</a></p>
      <p><a href="/heffdotdev-technical-details">this post</a> explains more about the tools i chose and why</p>
    </Details>

    <Details title="contact">
      <p>If you have questions, or are interested in hiring me, send me an <a href="mailto:tannerjheffner@gmail.com">email</a> or reach out on linkedin. The icon in the footer will take you to my profile.</p>

      <p>Cheers!</p>
    </Details>

</section>