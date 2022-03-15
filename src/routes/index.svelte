<script context="module">
	import {
		SITE_URL,
		REPO_URL,
		SITE_TITLE,
		SITE_DESCRIPTION,
		DEFAULT_OG_IMAGE,
		MY_TWITTER_HANDLE
	} from '$lib/siteConfig';
	export const prerender = true; // index page is most visited, lets prerender
</script>

<script>
	import Slice from '../components/Slice.svelte';
</script>

<svelte:head>
	<title>{SITE_TITLE}</title>
	<link rel="canonical" href={SITE_URL} />
	<link rel="alternate" type="application/rss+xml" href={SITE_URL + '/api/rss.xml'} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={SITE_TITLE} />
	<meta name="Description" content={SITE_DESCRIPTION} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:image" content={DEFAULT_OG_IMAGE} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:creator" content={'@' + MY_TWITTER_HANDLE} />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<div
	class="mx-auto flex max-w-2xl flex-col items-start justify-center border-gray-200 px-4 pb-16 dark:border-gray-700 sm:px-8"
>
	<section>
		<Slice>
			<h1 class="mb-3 text-3xl font-bold tracking-tight text-black dark:text-white md:text-5xl">
				<span
					class="relative ml-2 inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-red-500
								 hover:before:-skew-y-0 hover:before:-skew-x-3 hover:before:bg-teal-500
					"
				>
					<span class="relative skew-y-3 text-yellow-400">Tanner Heffner</span>
				</span>
			</h1>
		</Slice>

		<Slice title="Mission Statement">
			<h3 class="mb-3">I'm passionate about design systems, responsive web design and web accessibility.</h3>

			<p class="mb-3">I believe the web should be enjoyable for all. What that means to me is that websites should load quickly with minimal page bloat (no unnecessary tracking, etc.), be usable for all users regardless of their manner of access (sighted or screenreaders, navigable by keyboard, mouse or touch, etc.), and at the bare minimum pass WCAG-AA accessibility guidelines.</p>

			<p class="font-bold">The web can be so much more than it is. Let's make it better.</p>
		</Slice>

		<Slice title="Expertise & Skillset">
			<p class="mb-3">I have helped launch websites and apps at scale, public and internal for a number of Fortune 500 clients across industries as well as various government departments across the tech stack.</p>

			<p class="mb-3">I have designed and architected design systems and component libraries in close collaboration with designers as well as build and maintain agency-wide front-end tooling for consistently delivering best practices to clients and stakeholders.</p>

			<p class="mb-3">I mentor new and junior developers and perform duties as a front-end tech lead.</p>

			<p class="mb-1">Select Clients:</p>
			<ul class="list-disc ml-6">
				<li>US Department of Veterans Affairs</li>
				<li>Twitter Brand Studio</li>
				<li>Google.org</li>
				<li>Pinterest Business</li>
				<li>Greenhouse</li>
				<li>Crohn's & Colitis Foundation</li>
				<li>Memorial Sloan Kettering Cancer Hospital</li>
				<li>University of the Arts</li>
				<li>Arsenal Football Club</li>
				<li>Al Jazeera</li>
			</ul>
		</Slice>

		<Slice title="Background">
			<p class="mb-3"> I hacked together my first CSS file at age 12 customizing a phpBB forum theme. Years later in a college art class, I was exposed to the Processing language and rediscovered how magical that feeling of creation through code was. After graduating with a degree in advertising, I attended a four-month programming bootcamp and leaned all the way in. I've been a professional web developer since 2015, across all parts of the web stack. That means I know just enough SQL to be dangerous, but I'd rather work on the front end. ;)</p>

			<p class="mb-3">Currently, I'm a senior software developer at <a href="https://agile6.com/">Agile6</a>, working on the modernization effort for <a href="https://va.gov">VA.gov</a> serving millions of veterans nationwide.</p>

			<p class="mb-3">Prior: <a href="https://www.instrument.com/">Instrument</a>, <a href="https://www.phase2technology.com/">Phase2</a></p>
		</Slice>

		<Slice title="Get in touch">
			<p class="mb-3">If this jives with you, or you just want to say hello, feel free to send me an <a href="mailto:tannerjheffner@gmail.com">email</a> or <a href="">linkedin</a>.</p>

			<p>Please no recruiters. I will ignore you. I'm happy where I'm at. :)</p>
		</Slice>
	</section>
</div>
