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

<section class="prose" id="#content">
    <h1>information kiosk</h1>

    <Details title="about me" open linked>
      <p>My name is <strong>tanner heffner</strong> and I am based out of <strong>portland, oregon</strong>.</p>

      <p>
        I enjoy disc golf, cooking, gardening, making art, riding bikes and plenty more. 
        My girlfriend says I like to learn things the hard way, and I would say that's probably accurate.
        There's beauty in the struggle.
      </p>

      <p>A software engineer for over a decade and I still love the feeling when launching a fresh <strong>hello world!</strong></p>

      <a href="/resume" target="_blank">[resume]</a>
    </Details>

    <Details title="about this site" tall linked>
      <p>heffner.dev is perpetually under construction, same as me 🏄‍♂️</p>

      <p>parts <a href="/blog">blog,</a> and <a href="/gallery">photo gallery,</a> a dash of <a href="/about/latest">activity tracker,</a> and a <a href="/christmas">playground</a> too. 
         this website is my own personal <a href="https://joelhooks.com/digital-garden" target="_blank">digital garden</a>
      </p>

      <p>
        it is built with <a href="https://svelte.dev/docs/kit/introduction" target="_blank">sveltekit</a> and leverages a github issue queue as my CMS.
        the code is <a href="https://github.com/tjheffner/heffdotdev">public on github</a> and hosted via <a href="https://www.netlify.com/">netlify.</a>
      </p>

      <p><a href="/heffdotdev-technical-details">this post</a> explains more about the tools I chose and why.</p>
    </Details>

    <Details title="contact" linked>
      <p>If you have questions, need a tech consultation, or are interested in working together, please send me an <a href="mailto:tannerjheffner@gmail.com">email.</a></p>

      <p class="h1">✌️</p>
    </Details>

</section>