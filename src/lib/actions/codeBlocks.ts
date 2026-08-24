import { mount, unmount } from 'svelte'
import ProseCodeBlock from '$lib/components/ProseCodeBlock.svelte'

/**
 * Upgrade every shiki-highlighted <pre> inside a container to hyzer's
 * CodeBlock: header bar, language chip, copy button.
 *
 * Written as a Svelte attachment, `{@attach codeBlocks()}`, the same shape
 * lightboxGroup takes. Post content arrives as one `{@html}` blob, so there is
 * no markup to put a component in. The library ships a lightboxGroup for
 * images but no equivalent for code, so this is the mount layer.
 *
 * Highlighting happens elsewhere. Shiki runs server-side in the rehype
 * pipeline (see content/utils.ts), so a block is already colored on first
 * paint and stays readable with no JS. This only adds the chrome around it.
 */
export function codeBlocks() {
  return (node: Element) => {
    // attachments are client-only, but guard against SSR anyway
    if (typeof document === 'undefined') return () => {}

    const mounted: {
      app: Record<string, unknown>
      holder: HTMLElement
      original: Element
    }[] = []

    for (const pre of Array.from(node.querySelectorAll('pre.shiki'))) {
      const codeEl = pre.querySelector('code')
      if (!codeEl) continue

      // copy and the line-count gutter read `code`, so it has to be the plain
      // text rather than the highlighted markup. CodeBlock never falls back to
      // `children` for this.
      const code = codeEl.textContent ?? ''
      const language = codeEl.className.match(/language-(\S+)/)?.[1]

      const holder = document.createElement('div')
      pre.replaceWith(holder)
      mounted.push({
        app: mount(ProseCodeBlock, {
          target: holder,
          props: { code, language, html: pre.outerHTML },
        }),
        holder,
        original: pre,
      })
    }

    return () => {
      for (const m of mounted) {
        unmount(m.app)
        // put the untouched <pre> back, so a re-attach starts from the markup
        // the server sent rather than from our own wrapper
        m.holder.replaceWith(m.original)
      }
    }
  }
}
