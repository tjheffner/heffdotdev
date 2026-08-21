import { visit } from 'unist-util-visit'
import { selectAll } from 'hast-util-select'
import { cdnImage, cdnSrcset } from '$lib/image'

export default function rehypeZoomImages(options = { selector: 'img' }) {
  return (tree) => {
    for (const match of selectAll(options.selector, tree)) {
      visit(tree, match, (node) => {
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
        // add class for bg color before loading
        node.properties.class = 'lazy-image'
        // needs height and width defined for lazy loading
        node.properties.height = '100%'
        node.properties.width = '100%'

        // copy alt to title for caption on hover
        node.properties.title = node.properties.alt
      })
    }
  }
}
