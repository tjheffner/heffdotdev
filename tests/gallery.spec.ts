import { test, expect, generateReport, goto } from './utils'

test('Gallery page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/gallery')

  await expect(page).toHaveTitle(/Gallery | heffner.dev/)

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'gallery')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

test('Loaded images drop the grey placeholder, broken ones keep it', async ({
  page,
}) => {
  await goto(page, '/gallery')

  // Every image that actually painted is stamped by the root layout, so the
  // `img:not([data-loaded])` grey in global.css stops applying — that is what
  // keeps a transparent PNG off a grey card.
  const img = page.locator('.gallery-image').first()
  await expect(img).toHaveAttribute('data-loaded', '')
  await expect(img).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')

  // A broken image never fires load, so it must keep the placeholder — the
  // defensive-CSS case the grey exists for in the first place.
  const brokenStaysGrey = await page.evaluate(async () => {
    const el = document.createElement('img')
    el.src = '/definitely-not-a-real-image.png'
    document.body.append(el)
    await new Promise((resolve) =>
      el.addEventListener('error', resolve, { once: true })
    )
    const stamped = el.dataset.loaded !== undefined
    el.remove()
    return !stamped
  })
  expect(brokenStaysGrey).toBe(true)
})
