<script>
  import Slice from '$lib/components/Slice.svelte'
  import GetInTouch from '$lib/components/GetInTouch.svelte'
</script>

<svelte:head>
  <title>Tanner Heffner's Resume</title>
  <meta name="description" content="digital resume of tanner heffner" />
  <meta property="og:image" content={`https://heffner.dev/og?message=resume`} />
  <meta name="twitter:card" content={'summary'} />
  <meta
    name="twitter:image"
    content={`https://heffner.dev/og?message=resume`}
  />
</svelte:head>

<section>
  <Slice>
    <h1 class="text-shadow mb-3 text-3xl font-bold tracking-tight md:text-5xl">
      Creative technologist passionate about design systems, responsive web
      design and accessibility.
    </h1>
  </Slice>

  <Slice title="Mission Statement">
    <p class="mb-3 text-2xl font-bold">
      I believe the web should be enjoyable for all.
    </p>
    <p class="mb-3">To me, that means that websites should:</p>

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
    <p class="mb-3 text-2xl font-bold">
      Working across the web tech stack, I've consulted, architected, and
      delivered <a href="/work">numerous projects</a> for clients big and small with
      all sorts of use cases.
    </p>

    <p class="mb-3">
      I love to design and architect design systems and responsive component
      libraries in close collaboration with designers. In the past, I've helped
      build and maintain agency-wide front-end tooling for consistently
      delivering best practices to clients and stakeholders. Rapid prototyping
      is my jam.
    </p>

    <p class="mb-3">
      I'm comfortable working in and with a number of languages and
      technologies, but have a strong preference towards modern Javascript and
      CSS. I've been a mostly off-and-on <a href="https://www.drupal.org/u/tjh"
        >contributor to the Drupal ecosystem</a
      >
      for eight+ years. A long time ago (read: 2015), I dove into node and an early
      edition of
      <a href="https://patternlab.io/">Pattern Lab</a>
      to build a command line-based training module around atomic design concepts
      for
      <a href="https://nodeschool.io/">nodeschool.io</a>. It is not being
      maintained.
    </p>

    <p class="mb-3">
      I mentor new and junior developers and perform duties as a tech lead.
    </p>
  </Slice>

  <Slice title="Background">
    <p class="mb-3 text-2xl font-bold">Designing for the web since '05.</p>

    <p class="mb-3">
      I hacked together my first CSS file at age 12 customizing a phpBB forum
      theme. Years later in a college art class, I was exposed to the <a
        href="https://processing.org/">Processing</a
      > language and rediscovered how magical that feeling of creation through code
      was.
    </p>

    <p class="mb-3">
      After graduating from the University of Oregon with a journalism degree
      (minor in multimedia art), I continued my education with a four-month
      programming bootcamp. I've been a professional web developer since 2015,
      across all parts of the web stack. That means I know just enough SQL to be
      dangerous, but I'd rather work on the front end. <span
        role="img"
        aria-label="winking face">&#128521;</span
      >
    </p>

    <p class="mb-3">
      Currently, I'm a senior software developer at <a
        href="https://agile6.com/">Agile6</a
      >, working on the modernization effort for
      <a href="https://va.gov">VA.gov</a> serving millions of veterans nationwide.
    </p>

    <p>
      Previously: <a href="https://www.instrument.com/">Instrument</a>,
      <a href="https://www.phase2technology.com/">Phase2</a>
    </p>
  </Slice>

  <GetInTouch />
</section>
