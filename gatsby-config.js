module.exports = {
  siteMetadata: {
    title: 'estree-toolkit',
    metaTitle: 'estree-toolkit - Tools for working with ESTree AST',
    url: 'https://estree-toolkit.netlify.app'
  },
  trailingSlash: 'never',
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'docs',
        path: `${__dirname}/src/docs/`,
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        gfm: true,
        plugins: ['gatsby-remark-powerup']
      }
    },
    'gatsby-plugin-sass',
    'gatsby-plugin-react-helmet'
  ]
}
