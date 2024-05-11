import { unified } from 'unified'
import rehypeStringify from 'rehype-stringify'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkFM from 'remark-frontmatter'
import remarkDirective from 'remark-directive'
import { matter } from 'vfile-matter'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import {h} from 'hastscript'
import rehypeShiki from '@shikijs/rehype'

import fs from 'fs'

import { DocsPage } from '@/components/docs-page'

function addID(node, nodes, headers) {
  const id = toString(node)
  nodes[id] = (nodes[id] || 0) + 1
  node.data = node.data || {
    hProperties: {
      id: `${id}${nodes[id] > 1 ? ` ${nodes[id] - 1}` : ''}`
        .replace(/[^a-zA-Z\d\s-]/g, '')
        .split(' ')
        .join('-')
        .toLowerCase(),
    },
  }
  headers.push(node.data.hProperties.id)
}

function transformNode(node, output, indexMap) {
  const transformedNode = {
    title: toString(node),
    depth: node.depth,
    url: '#' + node.data.hProperties.id,
    items: [],
  }

  if (node.depth === 2) {
    output.push(transformedNode)
    indexMap[node.depth] = transformedNode
  } else {
    const parent = indexMap[node.depth - 1]
    if (parent) {
      parent.items.push(transformedNode)
      indexMap[node.depth] = transformedNode
    }
  }
}

function getHeadings(root) {
  const headers = []
  const nodes = {}
  const output = []
  const indexMap = {}

  visit(root, 'heading', (node) => {
    addID(node, nodes, headers)
    transformNode(node, output, indexMap)
  })

  return { headers, items: output }
}

function headingTree() {
  return (node, file) => {
    file.data.toc = getHeadings(node)
  }
}

function powerUp() {
  return (tree) => {
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
  }
}

export async function getStaticPaths() {
  try {
    const paths = fs.readdirSync('src/_mds')
      .filter(f => !f.startsWith('__'))
      .map((fileName) => ({
        params: {
          slug: fileName.replace('.md', '')
        }
      }))

    return {
      paths,
      fallback: false
    };
  } catch (error) {
    console.error(error)

    return {
      paths: [],
      fallback: false
    }
  }
}

async function getFM(filePath) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkFM, ['yaml'])
    .use(() => (t, f) => matter(f))
    .use(remarkStringify)
    .process(fs.readFileSync(filePath, 'utf-8'))

  return file.data.matter
}

export async function getStaticProps({ params: { slug } }) {
  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkFM, ['yaml'])
      .use(() => (t, f) => matter(f))
      .use(headingTree)
      .use(remarkDirective)
      .use(powerUp)
      .use(remarkRehype)
      .use(rehypeShiki, {
        theme: 'dark-plus',
        addLanguageClass: true,
        parseMetaString(metaString, node, tree) {
          return { title: metaString }
        }
      })
      .use(rehypeStringify)
      .process(fs.readFileSync(`src/_mds/${slug}.md`, 'utf-8'))

    const pages = fs.readFileSync('src/_mds/__order.txt', 'utf-8')
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => !!p)
      .map(async (p) => ({
        title: (await getFM(`src/_mds/${p}.md`)).title,
        slug: p,
        current: slug === p
      }))

    return {
      props: {
        frontmatter: file.data.matter,
        content: String(file),
        toc: file.data.toc,
        pages: await Promise.all(pages),
        site: {
          title: 'estree-toolkit',
          metaTitle: 'estree-toolkit - Tools for working with ESTree AST',
          url: 'https://estree-toolkit.netlify.app/' + slug
        }
      }
    };
  } catch (error) {
    console.error(error)

    return {
      props: {}
    }
  }
};

export default DocsPage
