const visit = require('unist-util-visit')
const h = require('hastscript')
const remarkSlug = require('remark-slug')

module.exports = (tree) => {
  visit(tree, 'containerDirective', (node) => {
    if (
      node.type === 'textDirective' ||
      node.type === 'leafDirective' ||
      node.type === 'containerDirective'
    ) {
      const data = node.data || (node.data = {})
      const hast = h(node.name, node.attributes)

      data.hName = hast.tagName
      data.hProperties = hast.properties
    }
  })

  remarkSlug()(tree)
}
