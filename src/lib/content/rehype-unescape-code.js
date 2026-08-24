import { visit } from 'unist-util-visit'

/**
 * Undo mdsvex's escaping inside code fences, just before shiki runs.
 *
 * mdsvex escapes `{`, `}`, `<` and `>` so Svelte can't read a code sample as
 * template syntax. Prism passed the entities through and the browser decoded
 * them on parse. Shiki instead highlights them as source, splitting `&gt;`
 * into three spans the browser can no longer decode, so the entity shows up as
 * literal text in the block.
 *
 * Shiki re-escapes whatever is HTML-significant when it serializes, so the
 * output is correct either way. The braces it leaves bare are safe because
 * this content is only injected with `{@html}`, never compiled as Svelte.
 */
const ENTITIES = {
  '&#123;': '{',
  '&#125;': '}',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

export default function rehypeUnescapeCode() {
  return (tree) => {
    visit(tree, { type: 'element', tagName: 'code' }, (node) => {
      visit(node, 'text', (text) => {
        text.value = text.value
          .replace(/&#123;|&#125;|&lt;|&gt;|&quot;|&#39;/g, (m) => ENTITIES[m])
          // last, so a literal "&amp;lt;" decodes to "&lt;" and not to "<"
          .replace(/&amp;/g, '&')
      })
    })
  }
}
