const remarkDirective = require('remark-directive')
const transformer = require('./transformer')

module.exports = ({ markdownAST }) => {
  transformer(markdownAST)
  return markdownAST
}

module.exports.setParserPlugins = () => [[remarkDirective]]
