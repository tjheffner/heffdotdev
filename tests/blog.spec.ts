import { test, expect, generateReport, goto } from './utils'

test('blog page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/blog')

  await expect(page).toHaveTitle(/Posts | heffner.dev/)
  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    const { errors } = generateReport(accessibilityScanResults, 'blog')
    console.dir(errors, { depth: 5 })
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

/**
 * A real post, not the index. The index has no .prose, so nothing above
 * covered the things that actually run inside post content: the lightboxGroup
 * triggers and the shiki -> CodeBlock upgrade.
 */
const POST = '/accessibility-testing-with-playwright'

test('blog post renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, POST)
  await expect(page.locator('.prose')).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    const { errors } = generateReport(accessibilityScanResults, 'blog-post')
    console.dir(errors, { depth: 5 })
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

test('code blocks are highlighted server-side and upgraded to CodeBlock', async ({
  page,
}) => {
  await goto(page, POST)

  const block = page.locator('.hz-code-block').first()
  await expect(block).toBeVisible()

  const state = await block.evaluate((el) => {
    const pre = el.querySelector('pre.shiki') as HTMLElement
    return {
      // every shiki <pre> got wrapped; none left loose in the prose
      stray: document.querySelectorAll('.prose > pre.shiki').length,
      highlighted: el.hasAttribute('data-highlighted'),
      // shiki inlines its palette, so the theme yields its own fill
      preBg: getComputedStyle(pre).backgroundColor,
      wrapperBg: getComputedStyle(el).backgroundColor,
      // code scrolls rather than reflowing mid-expression
      whiteSpace: getComputedStyle(pre).whiteSpace,
      // PrismJS is gone, and with it the bogus language-undefined fences
      prismTokens: document.querySelectorAll('.token').length,
      undefinedLang: document.querySelectorAll('[class*="language-undefined"]')
        .length,
    }
  })

  expect(state.stray).toBe(0)
  expect(state.highlighted).toBe(true)
  expect(state.preBg).toBe('rgb(39, 33, 46)')
  expect(state.wrapperBg).toBe('rgba(0, 0, 0, 0)')
  expect(state.whiteSpace).toBe('pre')
  expect(state.prismTokens).toBe(0)
  expect(state.undefinedLang).toBe(0)
})

test('copy button copies the source, not the highlighted markup', async ({
  page,
  context,
  browserName,
}) => {
  // clipboard permissions are a Chromium-only API in Playwright
  test.skip(
    browserName !== 'chromium',
    'clipboard permissions are Chromium-only'
  )
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await goto(page, POST)

  const block = page.locator('.hz-code-block').first()
  await expect(block).toBeVisible()
  await block.getByRole('button', { name: 'Copy' }).click()

  const clip = await page.evaluate(() => navigator.clipboard.readText())
  expect(clip.length).toBeGreaterThan(10)
  // CodeBlock reads `code` from the source text, never from the children markup
  expect(clip).not.toContain('<span')
})

// test('blog filters', async ({ page }) => {

// })

// test('blog search', async ({ page }) => {
//
// })
//
// test('see more posts', async ({ page }) => {
//
// })
//
// test('blog post table of contents', async ({ page }) => {
//
// })
