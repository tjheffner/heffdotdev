<script>
  import Slice from '$lib/components/Slice.svelte'
  import GetInTouch from '$lib/components/GetInTouch.svelte'
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

<section>
  <Slice>
    <h1 class="text-secondary text-3xl font-bold tracking-tight md:text-5xl">
      Creative technologist passionate about design systems, responsive web
      design and accessibility.
    </h1>
  </Slice>

  <Slice title="Mission Statement">
    <p class="text-2xl font-bold">
      I believe the web should be enjoyable for all.
    </p>
    <p>To me, that means that websites should:</p>

    <ul>
      <li>
        Load quickly with minimal page bloat and disruption (no unnecessary
        tracking, excessive and obtrusive advertisements, autoplaying videos
        etc.)
      </li>
      <li>
        Be functional for all users regardless of their manner of access
        (sighted or screenreaders, navigable by keyboard, mouse or touch, etc.)
      </li>
      <li>At the bare minimum, pass WCAG-AA accessibility guidelines</li>
    </ul>

    <p class="font-bold">
      The web can be so much more than it is. Let's make it better.
    </p>
  </Slice>

  <Slice title="Expertise & Skillset">
    <p class="text-2xl font-bold">
      Working across the web tech stack, I've consulted, architected, and
      delivered <a href="#work">numerous projects</a> for clients big and small with
      all sorts of use cases.
    </p>

    <p>
      I love to design and architect design systems and responsive component
      libraries in close collaboration with designers. In the past, I've helped
      build and maintain agency-wide front-end tooling for consistently
      delivering best practices to clients and stakeholders. Rapid prototyping
      is my jam.
    </p>

    <p>
      I'm comfortable working in and with a number of languages and
      technologies, but have a strong preference towards modern TypeScript and
      CSS. I've delivered projects using Javascript, PHP, Python, Ruby and many others. I've been a mostly off-and-on <a href="https://www.drupal.org/u/tjh">contributor to the Drupal ecosystem</a> for eight+ years. A long time ago (read: 2015), I dove into node and an early
      edition of
      <a href="https://patternlab.io/">Pattern Lab</a>
      to build a command line-based training module around atomic design concepts
      for
      <a href="https://nodeschool.io/">nodeschool.io</a>. It is not being
      maintained.
    </p>

    <p class="mb-10">
      I mentor new and junior developers and perform duties as a tech lead.
    </p>

    <p>
      Currently: <a href="https://agile6.com/">Agile6</a>
    </p>
    <p>
      Previously: <a href="https://www.instrument.com/">Instrument</a>,
      <a href="https://www.phase2technology.com/">Phase2</a>
    </p>
  </Slice>

  <Slice title="Clients">
    <div id="work">
      <p>add logos here</p>
    </div>
  </Slice>

  <GetInTouch />
</section>
