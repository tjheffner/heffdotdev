import { visit } from 'unist-util-visit'
import { selectAll } from 'hast-util-select'
import { fromSelector } from 'hast-util-from-selector'

export default function rehypeZoomImages(options = { selector: 'img' }) {
  return (tree) => {
    for (const match of selectAll(options.selector, tree)) {
      visit(tree, match, (node, i, parent) => {
        node.properties.loading = 'lazy'
        // add class for bg color before loading
        node.properties.class = 'lazy-image'
        // needs height and width defined for lazy loading
        node.properties.height = '100%'
        node.properties.width = '100%'

        // copy alt to title for caption on hover
        node.properties.title = node.properties.alt

        // wrap in a focusable button so the image can be opened in the
        // lightbox dialog by both pointer and keyboard. The interactive
        // behavior is wired up client-side by the `lightbox` action.
        const trigger = fromSelector('button.zoom-trigger')
        trigger.properties.type = 'button'
        trigger.properties['aria-label'] = node.properties.alt
          ? `Enlarge image: ${node.properties.alt}`
          : 'Enlarge image'

        trigger.children = [node]
        parent.children[i] = trigger
      })
    }
  }
}
