import { test, expect, generateReport, goto } from './utils'
import { contrastRatio } from '@hyzer-labs/ui/utils'
import { CODE_COLORS, CODE_SURFACE } from '../src/lib/content/shiki-theme.js'

/**
 * The axe scan below only grades hues that happen to appear in the sample
 * post. This grades the whole hand-rolled palette, so a color added to
 * shiki-theme.js cannot slip in below the bar just because no post uses it
 * yet.
 */
test('every syntax color clears AA on the code surface', () => {
  for (const color of CODE_COLORS) {
    expect(
      contrastRatio(color, CODE_SURFACE),
      `${color} on ${CODE_SURFACE}`
    ).toBeGreaterThanOrEqual(4.5)
  }
})

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
      // the CodeBlock theme yields its own fill under [data-highlighted], so
      // what paints is --hz-color-surface-muted from code-block.css
      preBg: getComputedStyle(pre).backgroundColor,
      wrapperBg: getComputedStyle(el).backgroundColor,
      // code scrolls rather than reflowing mid-expression
      whiteSpace: getComputedStyle(pre).whiteSpace,
      // PrismJS is gone, and with it the bogus language-undefined fences
      prismTokens: document.querySelectorAll('.token').length,
      // the surface is ours, not shiki's: a transformer strips its inline
      // background so --hz-color-surface-muted can paint the block
      inlineBg: /background/.test(
        document.querySelector('pre.shiki')?.getAttribute('style') ?? ''
      ),
      // mdsvex escapes { } < > in fences so Svelte can't read a sample as
      // template syntax. Shiki highlights whatever text it is handed, so
      // without a decode pass first it tokenizes `&gt;` into three spans and
      // the browser can no longer parse it back into a character.
      entityLeak: /&#12[35];|&gt;|&lt;|&amp;/.test(
        document.querySelector('pre.shiki')?.textContent ?? ''
      ),
      undefinedLang: document.querySelectorAll('[class*="language-undefined"]')
        .length,
    }
  })

  expect(state.stray).toBe(0)
  expect(state.highlighted).toBe(true)
  expect(state.preBg).toBe('rgb(255, 255, 255)') // --hz-color-surface-muted
  expect(state.wrapperBg).toBe('rgba(0, 0, 0, 0)')
  expect(state.whiteSpace).toBe('pre')
  expect(state.prismTokens).toBe(0)
  expect(state.undefinedLang).toBe(0)
  expect(state.entityLeak).toBe(false)
  expect(state.inlineBg).toBe(false)
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
