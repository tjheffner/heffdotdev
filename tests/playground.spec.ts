import { test, expect, generateReport, goto } from './utils'

// Playground routes live under the (nowrapper) layout group, which never sets
// `body.started`. Skip waiting for it or the page-load helper times out.
const gotoPlayground = (page, url: string) =>
  goto(page, url, { waitForStarted: false })

test('Playground index renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await gotoPlayground(page, '/playground')

  await expect(page).toHaveTitle('Playground | heffner.dev')
  await expect(
    page.getByRole('heading', { name: 'Playground', level: 1 })
  ).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'playground')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

// The immersive experiments share PlaygroundShell: the title renders as a
// clickable chip, and the visualization mounts into a full-bleed `preview`. A
// <canvas> for the canvas playgrounds, DOM gradient divs for Glowfield.
const experiments = [
  { name: 'Mosaic', path: '/playground/mosaic', preview: 'canvas' },
  { name: 'Plotter', path: '/playground/plotter', preview: 'canvas' },
  { name: 'Feather', path: '/playground/feather', preview: 'canvas' },
  { name: 'Poolside', path: '/playground/poolside', preview: 'canvas' },
  { name: 'Kaleidoscope', path: '/playground/kaleidoscope', preview: 'canvas' },
  { name: 'Shatter', path: '/playground/triangles', preview: 'canvas' },
  { name: 'Glowfield', path: '/playground/glowfield', preview: '.glow-field' },
] as const

for (const x of experiments) {
  const slug = x.path.split('/').pop() as string

  test(`${x.name} playground renders without a11y errors`, async ({
    page,
    makeAxeBuilder,
  }) => {
    await gotoPlayground(page, x.path)

    await expect(page).toHaveTitle(`${x.name} | heffner.dev`)
    // The title chip is both the page's <h1> and a disclosure button.
    await expect(
      page.getByRole('heading', { name: x.name, level: 1 })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: x.name })).toBeVisible()
    await expect(page.locator(x.preview).first()).toBeVisible()

    const accessibilityScanResults = await makeAxeBuilder().analyze()

    if (accessibilityScanResults.violations.length > 0) {
      generateReport(accessibilityScanResults, `playground-${slug}`)
    }

    expect(accessibilityScanResults.violations.length).toEqual(0)
  })
}
