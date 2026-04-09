<script>
  import './resume.css'
</script>

<head>
  <title>Tanner Heffner's Resume</title>
</head>

<header>
  <h1>Tanner Heffner</h1>
  <p>
    Full-stack engineer and technical lead with a decade at agencies delivering for government, enterprise, and startup clients. Known for on-time delivery, steady execution under pressure, and moving fluidly between prototyping, production delivery, and design system work. Let's build something cool together.
  </p>
</header>

<section>
  <h2>Contact</h2>
  <ul class="contact">
    <li>
      <a data-i="e" href="mailto:tannerjheffner@gmail.com">tannerjheffner@gmail.com</a>
    </li>
    <li>
      <a data-i="t" href="tel:7023380110">(702) 338-0110</a>
    </li>
    <li>
      <a data-i="w" href="https://heffner.dev">https://heffner.dev</a>
    </li>
  </ul>
</section>

<main>
  <div class="list">
    <h2 id="experience">Experience</h2>

    <h3 id="Hyzer">Hyzer</h3>
    <h4>Founder & Principal Engineer</h4>
    <p>June 2025 — Present</p>
    <p>Independent consultancy providing full-stack engineering and design leadership to agencies, startups, and direct clients.</p>
    <ul>
      <li>Shipped three mobile app prototypes for a Fortune 500 client over multiple engagements totaling five-plus months. A 40-person focus group tested the second prototype to strong reception. Stack: SvelteKit, Swift, TypeScript, Postgres, AWS.</li>
      <li>Partnered with an agency on multiple production launches, including a three-week animation-heavy brand rebuild, a B2B marketing site, and realtime messaging and notification features for a social platform.</li>
      <li>Stood up the design system for an early-stage startup over two months, migrating existing code into an accessible navigation system, a consistent type scale, and shared tokens.</li>
    </ul>

    <h3 id="Agile Six TL">Agile Six</h3>
    <h4>Technical Lead</h4>
    <p>June 2023 — May 2025</p>
    <ul>
      <li>Architected the modern headless foundation for <a href="https://va.gov">VA.gov</a>, cutting content publishing times for thousands of editors from hours to under five minutes. Named Key Personnel on the Accelerated Publishing contract.</li>
      <li>Led discovery and technical research for a new Accredited Representatives workflow supporting Veterans through the claims process, coordinating changes across multiple siloed VA departments where legal jurisdiction restricted direct API access. Named Key Personnel on the contract.</li>
      <li>Delivered rapid technical prototypes for two successful government contract bids, VA's SPRUCE and HHS SWIFT, each earning the highest technical marks from government evaluators. For SPRUCE, built a fully-validated example form using the VA design system with external USPS address verification in just five days.</li>
      <li>Prototyped an experimental no-code form builder using Drupal as the source of truth, shipped for evaluation on a separate contract team.</li>
    </ul>

    <h3 id="Coforma">Coforma</h3>
    <h4>Senior Software Engineer</h4>
    <p>January 2023 — June 2023 (Contract)</p>
    <ul>
      <li>Architected the <a href="https://www.cms.gov/medical-bill-rights">Medical Bill Rights</a> portal for CMS.gov in support of the No Surprises Act, shipping under a tight legislative deadline in under six months with fully localized English and Spanish content.</li>
      <li>Owned front-end implementation and mentored junior engineers while building the React form architecture, including localization, field and schema validation, and Salesforce and Drupal integration.</li>
    </ul>

    <h3 id="Agile Six SSE">Agile Six</h3>
    <h4>Senior Software Engineer</h4>
    <p>September 2021 — January 2023</p>
    <ul>
      <li>Led the upgrade of VA.gov's Drupal admin theme from Seven to a VA-branded theme based on Claro, dramatically improving accessibility and day-to-day usability for hundreds of content editors, many of them hospital staff without web admin backgrounds. Built an extensible foundation for custom field widgets and established content modeling standards adopted across three CMS teams.</li>
      <li>Delivered features across the CMS, including email notifications, preview improvements, editor workflow refinements, and updates to the internal editor knowledge base, all reducing editor confusion and support complaints.</li>
      <li>Contributed to benefits claims processing improvements across the VA stack as part of the PACT Act, including accessibility updates to custom React form inputs and Python-based OCR improvements for both scanned claim forms and generated PDFs from digital submissions.</li>
    </ul>

    <h3 id="Instrument">Instrument</h3>
    <h4>Senior Developer</h4>
    <p>October 2019 — March 2021</p>
    <ul>
      <li>Designed a bespoke responsive component library paired with an A/B testing system in Craft CMS for Greenhouse.com, enabling their marketing team to continuously optimize conversions by running tests against every component on every page.</li>
      <li>Prototyped brand explorations in React and Storybook for the former Twitter.com design team.</li>
      <li>Launched custom responsive components for <a href="https://google.org">Google.org</a> using Python and vanilla JavaScript.</li>
      <li>Shipped React components to production for <a href="https://business.pinterest.com/getting-started/">Pinterest Business</a>.</li>
      <li>Contributed to the achievements and social sharing system for the Epic Games launcher, an event-driven React overlay that integrates with game SDKs platform-wide. Worked primarily on the Redux layer managing achievement lifecycle state.</li>
    </ul>

    <h3 id="Phase2">Phase2</h3>
    <h4>Senior Developer</h4>
    <p>June 2015 — August 2019</p>
    <ul>
      <li>Co-maintained our agency's front-end toolkit, enabling the rapid stand-up of new sites with atomic design principles and consistent processes.</li>
      <li>Contributed to Drupal 7 to Drupal 8 migrations for at least five enterprise organizations, including Al Jazeera, Weight Watchers, and Memorial Sloan Kettering Cancer Center.</li>
      <li>Won a Webby Award as part of the team shipping the revamped <a href="https://arsenal.com">Arsenal.com</a>.</li>
    </ul>

    <h2 id="recent-projects">Highlighted Projects</h2>

    <h3 id="later-rebrand">Later.com Rebrand</h3>
    <p>Partnered with <a href="https://wlcr.io">WLCR</a> to deliver Later's rebrand on their existing marketing site, refreshing design system tokens across the board and updating responsive components with new motion and animation treatments. Also built the custom parallax landing page for <em>Made You Look</em>, a flagship creator campaign featuring original films, immersive scroll interactions, and multiple creator story panels.</p>
    <p>
      <a href="https://later.com/made-you-look/">later.com/made-you-look</a>
    </p>

    <h3 id="va.gov">VA.gov</h3>
    <p>Architected a Next.js build system on top of an existing headless Drupal installation to dramatically improve publishing times for VA editors. With over 55,000 pieces of content and growing daily, timely publishing is critical. The legacy system took a minimum of 45 minutes per build, sometimes closer to two hours. The new approach gets content live in under five minutes and gives editors the ability to preview their work exactly as it will appear on VA.gov <em>before publishing</em>, addressing a major pain point of the prior workflow.</p>
    <p>
      <a href="https://va.gov">VA.gov</a>
    </p>

    <h3 id="medical-bill-rights">Medical Bill Rights</h3>
    <p>Built in support of the No Surprises Act, this CMS.gov portal gives citizens the information they need to understand their rights around medical billing, whether or not they use Medicare/Medicaid. The site includes 26 fact pages localized in two languages (with support for more), a React-based wizard that helps users find the relevant fact page for their situation, and a multi-page form with client and server-side validation that routes submissions to a CRM for claims processing by CMS agents.</p>
    <p><a href="https://www.cms.gov/medical-bill-rights">cms.gov/medical-bill-rights</a></p>
  </div>
</main>

<section>
  <h2>Skills & Tools</h2>
  <ul class="tags">
    <li>TypeScript</li>
    <li>JavaScript</li>
    <li>Swift</li>
    <li>PHP</li>
    <li>Python</li>
    <li>Ruby</li>
    <li>React</li>
    <li>Next.js</li>
    <li>Svelte/SvelteKit</li>
    <li>Node</li>
    <li>Drupal</li>
    <li>Design Systems</li>
    <li>Accessibility</li>
    <li>Figma</li>
    <li>Storybook</li>
  </ul>
</section>
