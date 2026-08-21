import { visit } from 'unist-util-visit'
import { cdnImage, cdnSrcset } from '$lib/image'

/**
 * Route every content image through the CDN and make it responsive.
 *
 * This used to also wrap each image in a `button.zoom-trigger` for the
 * hand-rolled lightbox action. Both are gone: @hyzer-labs/ui's lightboxGroup
 * enhances the `<img>` in place, and in fact skips any image inside a
 * `<button>`, so the wrapper would have opted these images out of the viewer.
 * What is left is purely the image pipeline, which is why this is no longer
 * named for wrapping or zooming.
 */
export default function rehypeCdnImages() {
  return (tree) => {
    visit(tree, { type: 'element', tagName: 'img' }, (node) => {
      // resize through the image CDN — these pages are very image heavy and
      // the raw GitHub attachments are full-size camera output.
      // data-lightbox-src is @hyzer-labs/ui's full-size override: it holds
      // the large variant lightboxGroup should open, so the viewer doesn't
      // enlarge whichever thumbnail srcset happened to pick.
      const original = node.properties.src
      const srcset = cdnSrcset(original)
      node.properties.src = cdnImage(original, 1200)
      if (srcset) {
        node.properties.srcset = srcset
        node.properties.sizes = '(min-width: 900px) 900px, 100vw'
      }
      node.properties['data-lightbox-src'] = cdnImage(original, 1600)

      node.properties.loading = 'lazy'
      // needs height and width defined for lazy loading
      node.properties.height = '100%'
      node.properties.width = '100%'

      // copy alt to title for caption on hover
      node.properties.title = node.properties.alt
    })
  }
}
