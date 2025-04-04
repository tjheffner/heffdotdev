<script>
  import './resume.css'
</script>

<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400..700&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>

<body>
  <header>
    <h1>Tanner Heffner</h1>
    <p>
      I am a full-stack engineer with a record of delivering successful projects at scale for organizations in a variety of industries. I am a big advocate for accessible design systems and responsive component libraries. Let's build something cool together.
    </p>
  </header>

  <section>
    <h2>Contact</h2>
    <ul class="contact">
      <li>
        <a data-i="t" href="tel:7023380110">(702) 338-0110</a>
      </li>
      <li>
        <a data-i="e" href="mailto:tannerjheffner@gmail.com">tannerjheffner@gmail.com</a>
      </li>
      <li>
        <a data-i="w" href="https://heffner.dev">https://heffner.dev</a>
      </li>
    </ul>
  </section>

  <section>
    <h2>Skills & Tools</h2>
    <ul class="tags">
      <li>Typescript</li>
      <li>Design Systems</li>
      <li>Accessibility</li>
      <li>UX</li>
      <li>DevOps</li>
      <li>Node</li>
      <li>HTML</li>
      <li>CSS</li>
      <li>React</li>
      <li>Svelte</li>
      <li>PHP</li>
      <li>Drupal</li>
      <li>AWS</li>
      <li>Python</li>
      <li>Ruby</li>
      <li>Public Speaking</li>
      <li>Cypress</li>
      <li>Playwright</li>
      <li>Storybook</li>
      <li>Figma</li>
    </ul>
  </section>

  <main>
    <div class="list">
      <h2 id="experience">Experience</h2>
      <h3 id="Agile Six">Agile Six</h3>
      <h4 id="tech lead">Technical Lead, Senior Developer</h4>
      <p>October 2021 — present</p>
      <ul>
        <li><strong>Architected the modern headless foundation</strong> for <a href="https://va.gov">VA.gov</a>, reducing publishing times for thousands of editors from hours down to sub five minutes.</li>
        <li>Assisted with <strong>benefits claims processing improvements across the VA stack</strong> as part of the PACT Act. Including but not limited to: <strong>accessibility updates</strong> to custom React form inputs, improving <strong>OCR processing</strong> of PDF claim data in Python, and <strong>adding new features in React and Ruby</strong> for Accredited Representatives helping Veterans with the claims process.</li>
        <li>Quick <strong>prototyping of technical solutions</strong> leading to SWIFT and SPRUCE contract vehicle wins, <strong>receiving highest technical marks</strong> from government evaluators.</li>
      </ul>

      <h3 id="Coforma">Coforma</h3>
      <h4 id="senior dev 2">Senior Developer, Tech Lead</h4>
      <p>January 2023 — June 2023</p>
      <ul>
        <li>For the No Surprises Act, <strong>architected the <a href="https://www.cms.gov/medical-bill-rights">Medical Bill Rights</a> sub-site</strong> for CMS.gov with localized content in English and Spanish.</li>
        <li><strong>Led front-end implementation</strong>, providing direction to junior team members and actively building out the React form architecture including <strong>localization, field and schema validations, plus Salesforce and Drupal integration.</strong>.</li>
      </ul>

      <h3 id="Instrument">Instrument</h3>
      <h4 id="senior dev 1">Senior Developer</h4>
      <p>October 2019 — March 2021</p>
      <ul>
        <li>Developed a bespoke <strong>responsive component library</strong> combined with an <strong>A/B testing system</strong> with Craft CMS, allowing site builders to continously optimize with confidence.</li>
        <li>Rapidly <strong>prototyped brand explorations</strong> with React and Storybook for the former Twitter.com design team.</li>
        <li>Created <strong>custom responsive components</strong> for <a href="https://google.org">Google.org</a> using Python and vanilla Javascript.</li>
        <li><strong>Built new React components</strong> for <a href="https://business.pinterest.com/getting-started/">Pinterest Business</a>.</li>
        <li>Helped <strong>implement the achievements functionality for games and social sharing</strong> across the Epic Games platform.</li>
      </ul>

      <h3 id="Phase2">Phase2</h3>
      <h4 id="intern to senior">Senior Developer</h4>
      <p>June 2015 — August 2019</p>
      <ul>
        <li><strong>Co-maintained the agency front-end tooling</strong>, enabling the rapid stand-up of new sites with atomic design principles & consistent processes.</li>
        <li>Helped <strong>multiple enterprise organizations</strong> migrate from Drupal 7 to Drupal 8 efficiently.</li>
        <li><strong>Won a Webby award</strong> as part of the team shipping the revamped <a href="https://arsenal.com">Arsenal.com</a>.</li>
      </ul>

      <h2 id="recent-projects">Recent Projects</h2>
      <h3 id="va.gov">VA.gov</h3>
      <p>Architected a Next.js build system for an existing headless Drupal installation to improve publishing times for VA Editors. With >55,000 pieces of content, growing daily, timely publishing is key. The legacy system's build times took a minimum of 45 minutes, sometimes closer to two hours! This new approach enables rapid publishing of content in under five minutes. It also provides editors the capability to preview their content exactly as it appears before publishing, a major pain point of the prior process.</p>
      <p>
        <a href="https://va.gov">VA.gov</a>
      </p>

      <h3 id="medical-bill-rights">Medical Bill Rights</h3>
      <p>For the No Surprises Act, this portal has all the information citizens need for understanding their newly enshrined rights around medical billing, whether they are using Medicare/Medicaid or not. There are 26 different fact pages (localized in two languages, with support for more) and two separate React apps, also with localization support: a wizard to help users find the relevant fact page for their situation, and a multi-page form with client and server side validation that sends submissions off to a CRM for claims processing by CMS agents.</p>
      <p><a href="https://www.cms.gov/medical-bill-rights">cms.gov/medical-bill-rights</a></p>

      <h3 id="greenhouse">Greenhouse</h3>
      <p>A bespoke marketing website for a leading hiring solutions company. Using Craft CMS, Twig and vanilla JavaScript, I wrote most of the responsive components, the A/B testing harness, as well as the accessibility handling sitewide for things like keyboard and focus handling, lazy loading images, etc.</p>
      <p><a href="https://greenhouse.com">greenhouse.com</a></p>
     </div>
   </main>
 </body>
