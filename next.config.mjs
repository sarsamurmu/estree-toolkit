import createMDX from '@next/mdx'
import remarkFM from 'remark-frontmatter'
import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: true,
  output: 'export'
}

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [remarkFM],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
