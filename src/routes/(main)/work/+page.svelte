<script>
  import { SITE_TITLE } from '$lib/siteConfig'
  import Slice from '$lib/components/Slice.svelte'
  import ProjectItem from '$lib/components/ProjectItem.svelte'
  import GetInTouch from '$lib/components/GetInTouch.svelte'

  export let data
  export let resume = {
    slug: '/resume',
    name: 'Resume',
    description: ''
  }
  export let gallery = {
    slug: '/gallery',
    name: 'gallery',
    description: 'photos, drawings, etc.'
  }
</script>

<svelte:head>
  <title>{SITE_TITLE} | Work</title>
  <meta
    property="og:image"
    content={`https://heffner.dev/og?message=heffner.dev%20|%20work`}
  />
  <meta name="twitter:card" content={'summary'} />
  <meta
    name="twitter:image"
    content={`https://heffner.dev/og?message=heffner.dev%20|%20work`}
  />
</svelte:head>

<section class="mx-auto flex w-full flex-col items-start px-4 sm:p-0">
  <Slice>
    <h1 class="mb-6 text-3xl font-bold tracking-tight text-accent md:text-5xl">
      Past work
    </h1>
    <p class="text-xl font-semibold text-accent">
      A selection of previously completed projects, personal and professional.
    </p>
  </Slice>

  <Slice title="Professional" prose={false}>
    <ul class="list-none">
      {#each data.items as project}
        {#if project.type === 'professional'}
          <li>
            <ProjectItem item={project} prefix={true} />
          </li>
        {/if}
      {/each}
    </ul>
    <p class="text-lg font-bold text-orange-600 dark:text-lime-500">
      Other clients
    </p>
    <p class="mb-8 text-slate-800 dark:text-gray-400">
      Department of Veterans Affairs, Epic Games, Crossfit, Norwegian Cruise
      Line, PGA Tour, Weight Watchers, Urban Institute, Wilson Center
    </p>

    <ProjectItem item={resume} />
  </Slice>

  <Slice title="Personal" prose={false}>
    <ul class="list-none">
      {#each data.items as project}
        {#if project.type === 'personal'}
          <li>
            <ProjectItem item={project} prefix={true} />
          </li>
        {/if}
      {/each}
      <li>
        <ProjectItem item={gallery} />
      </li>
    </ul>
  </Slice>

  <GetInTouch />
</section>
