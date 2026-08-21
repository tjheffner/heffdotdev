import { visit } from 'unist-util-visit'

/**
 * Undo mdsvex's escaping inside code fences, immediately before shiki runs.
 *
 * mdsvex escapes `{`, `}`, `<` and `>` in the markdown source so Svelte can't
 * read a code sample as template syntax. PrismJS never minded — it passed the
 * entities through untouched and the browser turned them back into characters
 * on parse. Shiki does mind: it highlights the escaped text as source, so
 * `&gt;` is tokenized into three separate spans (`&`, `gt`, `;`) and the
 * browser can no longer parse it back, leaving the entity visible as literal
 * text in the block.
 *
 * Decoding here hands shiki the real characters. It re-escapes whatever is
 * HTML-significant on its own when it serializes, so the output is correct
 * either way; the braces it leaves bare are safe because this content is only
 * ever injected with `{@html}`, never compiled as Svelte.
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
