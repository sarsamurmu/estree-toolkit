import React from 'react'
import { navigate, graphql } from 'gatsby'
import Helmet from 'react-helmet'

export default function Index({ data: { site: { siteMetadata: site } } }) {
  React.useEffect(() => { navigate('/welcome') }, [])

  return (
    <Helmet>
      <meta charSet='utf-8' />
      <title>{site.metaTitle}</title>
      {/* <meta name='description' content={site.description} /> */}
      <link rel='canonical' href={site.url} />
      <meta name='robots' content='index, follow' />

      <meta property='og:type' content='documentation' />
      <meta property='og:title' content={site.metaTitle} />
      {/* <meta property='og:description' content={site.description} /> */}
      {/* <meta property='og:image' content='LINK TO THE IMAGE FILE' /> */}
      <meta property='og:url' content={site.url} />
      <meta property='og:site_name' content={site.metaTitle} />
    </Helmet>
  )
}

export const pageQuery = graphql`
  query IndexPageQuery {
    site {
      siteMetadata {
        title
        metaTitle
        url
      }
    }
  }
`
