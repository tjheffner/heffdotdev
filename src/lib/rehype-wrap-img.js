import { visit } from 'unist-util-visit'
import { selectAll } from 'hast-util-select'
import { fromSelector } from 'hast-util-from-selector'

export default function rehypeZoomImages(options = { selector: 'img' }) {
  return (tree) => {
    for (const match of selectAll(options.selector, tree)) {
      visit(tree, match, (node, i, parent) => {
        const wrapper = fromSelector('div.zoom ')
        const label = fromSelector('label')
        const checkbox = fromSelector('input[type="checkbox"]')

        node.properties.loading = "lazy"

        // needs height and width defined for lazy loading
        node.properties.height = "100%"
        node.properties.width = "100%"
        node.properties.class = "lazy-image"

        label.children = [checkbox, node]
        wrapper.children = [label]
        parent.children[i] = wrapper
      })
    }
  }
}
