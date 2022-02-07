const path = require('path')
const fs = require('fs')

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  const result = await graphql(
    `
      query {
        allMarkdownRemark {
          edges {
            node {
              id
              slug
            }
          }
        }
      }
    `
  )
  
  if (result.errors) {
    reporter.panicOnBuild('Error while running GraphQL query.')
    return
  }
  
  result.data.allMarkdownRemark.edges.forEach(({ node: { slug, id } }) => {
    createPage({
      path: `/${slug}`,
      component: path.resolve('src/templates/docs.js'),
      context: { id },
    })
  })
}

exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions
  const typeDef = schema.buildObjectType({
    name: 'PageOrder',
    fields: {
      items: {
        type: 'JSON',
        args: {
          from: {
            type: 'String'
          }
        },
        resolve(_, { from }) {
          return fs.readFileSync(from, 'utf-8')
            .split('\n')
            .map((p) => p.trim())
            .filter((p) => !!p)
            .reduce((acc, item, idx) => (acc[item] = idx, acc), {})
        }
      }
    },
    interfaces: [`Node`],
  })
  createTypes([typeDef])
}

exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  actions.createNode({
    id: createNodeId('PageOrder'),
    parent: null,
    children: [],
    internal: {
      type: 'PageOrder',
      content: '',
      contentDigest: createContentDigest('')
    }
  })
}

exports.createResolvers = ({ createResolvers }) => {
  createResolvers({
    MarkdownRemark: {
      slug: {
        type: 'String',
        resolve(source) {
          const relPath = path.relative(path.resolve('src/docs/'), source.fileAbsolutePath).replace(/\.md$/, '')
          if (/^__/.test(relPath)) return `${relPath}/`
          return `${relPath.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}/`
        }
      }
    }
  })
}

exports.onCreateWebpackConfig = ({ actions, stage }) => {
  const webpack = require('webpack')
  actions.setWebpackConfig({
    resolve: {
      fallback: stage === 'build-html'
        ? require('module').builtinModules.reduce((acc, mod) => (acc[mod] = false, acc), {})
        : {}
    },
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /canvas/,
        contextRegExp: /jsdom$/
      }),
      new webpack.DefinePlugin({
        SSR_MODE: stage === 'build-html'
      })
    ]
  })
}

const replacePath = path => (path === '/' ? path : path.replace(/\/$/, ''))
exports.onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions
  const oldPage = Object.assign({}, page)
  page.path = replacePath(page.path)
  if (page.path !== oldPage.path) {
    deletePage(oldPage)
    createPage(page)
  }
}
