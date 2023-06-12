import React from 'react'
import { graphql } from 'gatsby'
import { Interweave } from 'interweave'
import { Link } from 'gatsby'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { javascript } from 'react-syntax-highlighter/dist/esm/languages/prism'
import { Helmet } from 'react-helmet'
import * as Octicons from '@primer/octicons-react'
import SimpleBar from 'simplebar-react'

import 'simplebar-react/dist/simplebar.min.css'
import './prism-theme.css'
import './docs.scss'

SyntaxHighlighter.registerLanguage('js', javascript)

/* global SSR_MODE */

if (SSR_MODE) {
  const { JSDOM } = require('jsdom')
  global.window = (new JSDOM('', { url: 'http://localhost' })).window
  global.document = global.window.document
}

const CopyButton = () => {
  const [copied, setCopied] = React.useState(false)
  
  const onClick = (e) => {
    const codeText = e.nativeEvent.target.closest('.inner').querySelector('code').innerText
    try {
      window.navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1300)
    } catch (e) {
      setCopied(false)
    }
  }

  return (
    <button className='copy-button' onClick={onClick} aria-label='Copy code block content'>
      {SSR_MODE ? 'COPY' : (copied ? <Octicons.CheckIcon fill="#07bd5f" /> : <Octicons.CopyIcon />)}
    </button>
  )
}

const CodeWrapper = ({ children, title }) => {
  return (
    <div className='code-block'>
      {title && <span>{title}</span>}
      <div className='inner'>
        <CopyButton />
        <div className='wrapper'>
          {children}
        </div>
      </div>
    </div>
  )
}

const Alert = ({ children }) => (
  <div className='alert fromDirective'>
    <div className='wrapper'>{children}</div>
    <span className='icon'>{!SSR_MODE && <Octicons.InfoIcon size={24} />}</span>
  </div>
)

const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = React.useState(children[0].props.name);

  return (
    <div className='tabs fromDirective'>
      <ul>
        {children.map(({ props: { name } }) => (
          <li
            key={name}
            onClick={() => setActiveTab(name)}
            {...(name === activeTab ? { className: 'active' } : {})}>
              {name}
          </li>
        ))}
      </ul>
      <div className='content'>
        {children.find(({ props: { name } }) => activeTab === name).props.children}
      </div>
    </div>
  )
}

const TabItem = ({ children }) => <div>{children}</div>

const interweaveTransform = (node, children) => {
  switch (node.tagName.toLowerCase()) {
    case 'code': {
      const match = /(?:language|lang)-(\w+)/.exec(node.className || '')
      const title = node.dataset.meta
      if (match) {
        return (
          SSR_MODE ? (
            <CodeWrapper title={title}>
              <code className={node.className}>{children}</code>
            </CodeWrapper>
          ) : (
              <SyntaxHighlighter
                language={match[1]}
                PreTag={CodeWrapper}
                useInlineStyles={false}
                children={children[0].trim()}
                title={title} />
          )
        )
      }
      break
    }

    case 'alert': {
      return <Alert children={children} />
    }

    case 'tabs': {
      return <Tabs children={children} />
    }
    
    case 'tab': {
      return <TabItem name={children.shift()} children={children} />
    }
  }
}

const Ctx = React.createContext({
  toc: false,
  sidenav: false,
  openSidenav() {},
  closeToc() {},
  closeSidenav() {}
});

const ThemeButton = ({ toggleTheme, isDarkTheme }) => {
  const [loaded, setLoaded] = React.useState(false)
  const onEnter = React.useCallback(() => document.body.classList.add('no-transition'), [])
  const onLeave = React.useCallback(() => document.body.classList.remove('no-transition'), []);

  React.useLayoutEffect(() => setLoaded(true), [])

  return (
    <button
      className='btn-circular theme-btn'
      onClick={toggleTheme}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-label='Toggle theme'>
      {loaded && (isDarkTheme ? <Octicons.MoonIcon size={20} /> : <Octicons.SunIcon size={20} />)}
    </button>
  )
}

const OtherLinks = () => (
  <ul className='links'>
    {[
      ['GitHub', Octicons.MarkGithubIcon, 'https://github.com/sarsamurmu/estree-toolkit'],
      ['npm', Octicons.PackageIcon, 'https://www.npmjs.com/package/estree-toolkit']
    ].map(([name, Icon, url]) => (
      <li key={name}>
        <a href={url} target='_blank' rel='noopener noreferrer'>
          {!SSR_MODE && <Icon size={18} />}
          {name}
        </a>
      </li>
    ))}
  </ul>
)

const Header = ({ title }) => {
  const { openSidenav } = React.useContext(Ctx)
  const [theme, setTheme] = React.useState(window.localStorage.getItem('theme') || 'light')
  const toggleTheme = React.useCallback(() => setTheme((t) => t === 'light' ? 'dark' : 'light'), [])

  React.useEffect(() => {
    document.documentElement.setAttribute('theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <header>
      <button className='btn-circular menu-btn' onClick={openSidenav} aria-label='Open navigation menu'>
        {!SSR_MODE && <Octicons.ThreeBarsIcon size={20} />}
      </button>
      <Link to='/' className='title'>{title}</Link>
      <i className='divider' />
      <OtherLinks />
      <ThemeButton {...{ toggleTheme, isDarkTheme: theme === 'dark' }} />
    </header>
  )
}

const Footer = ({ pageOrder }) => {
  const { prev, next } = React.useMemo(() => {
    const currIdx = pageOrder.findIndex(({ current }) => current)
    return {
      prev: pageOrder[currIdx - 1],
      next: pageOrder[currIdx + 1]
    }
  }, [pageOrder])

  return (
    <footer>
      <div className='next-prev-container'>
        {[['Previous', prev], ['Next', next]].map(([type, item], idx) => (
          <Link
            className={(item ? '' : 'hidden') + (prev && next ? 'joined' : '')}
            to={item ? ('../' + item.slug) : '#'}
            key={type}>
            <div>
              <span>{type}</span>
              <span>{item && item.title}</span>
            </div>
            {!SSR_MODE && (idx === 0 ? <Octicons.ArrowLeftIcon size={26} /> : <Octicons.ArrowRightIcon size={26} />)}
          </Link>
        ))}
      </div>
      <hr />
      <p>© Copyright 2023 Sarsa Murmu. All rights reserved.</p>
    </footer>
  )
}

const Sidenav = ({ items }) => {
  const { sidenav } = React.useContext(Ctx);

  return (
    <div className={`sidenav ${sidenav ? 'open' : ''}`}>
      <ul>
        {items.map(({ title, slug, current }) => (
          <li key={slug}>
            <Link {...(current ? { className: 'current' } : {})} to={'../' + slug}>{title}</Link>
          </li>
        ))}
      </ul>
      <OtherLinks />
    </div>
  )
}

const useActiveHeader = (headers) => {
  const [activeHeader, setActiveHeader] = React.useState(headers[0])

  React.useEffect(() => {
    const checkCurrentHeader = () => {
      for (let i = 0; i < headers.length; i++) {
        const el = document.getElementById(headers[i]);
        if (el == null) continue
        const rect = el.getBoundingClientRect()
        if (rect.top < 200 && rect.top > 10) {
          if (activeHeader !== headers[i]) {
            const container = document.querySelector('.toc .simplebar-content-wrapper');
            const containerRect = container.getBoundingClientRect();
            const tocItem = document.getElementById(`toc-item-${headers[i]}`);
            const tocItemPos = tocItem.getBoundingClientRect().top;
            
            const isContentUp = tocItemPos < (containerRect.top + 100);
            const isContentDown = tocItemPos > (containerRect.bottom - 150);

            if (isContentUp || isContentDown) {
              container.scrollBy({
                top: isContentUp
                  ? (tocItemPos - containerRect.top) - 100 : (tocItemPos - containerRect.bottom) + 150,
                behavior: 'smooth'
              });
            }

            setActiveHeader(headers[i])
          }
          break
        }
      }
    }

    setTimeout(() => checkCurrentHeader(), 1000)

    window.addEventListener('scroll', checkCurrentHeader)

    return () => {
      window.removeEventListener('scroll', checkCurrentHeader)
    }
  }, [headers, activeHeader]);

  return activeHeader
}

const renderTocList = (parentUrl, items, activeHeader) => (
  <ul className={parentUrl === '' ? 'top-ul' : ''}>
    {items.map((item) => (
      <li
        key={parentUrl + item.url}
        {...(activeHeader === item.url.slice(1) ? { className: 'active' } : {})}
        id={`toc-item-${item.url.slice(1)}`}>
        <a href={item.url} {...(item.isCode ? { className: 'code' } : {})}>
          {item.title}
        </a>
        {item.items && renderTocList(item.url, item.items, activeHeader)}
      </li>
    ))}
  </ul>
)

const TocList = ({ items, headers }) => {
  const activeHeader = useActiveHeader(headers)
  
  return renderTocList('', items, activeHeader)
}

const Toc = ({ content }) => {
  const { toc: isOpen, closeToc } = React.useContext(Ctx)
  const tocListProps = React.useMemo(() => {
    const headers = []
    const html = new window.DOMParser().parseFromString(content, 'text/html')

    const collectItems = (el) => {
      if (el == null) return []
      const collection = []
      el.querySelectorAll('li').forEach((li) => {
        if (li.parentElement !== el) return
        const a = li.querySelector('a')
        const ul = li.querySelector('ul')
        collection.push({
          title: a.textContent,
          isCode: a.firstChild.tagName === 'CODE',
          url: a.getAttribute('href'),
          items: ul ? collectItems(ul) : null
        })
        headers.push(a.getAttribute('href').slice(1))
      })
      return collection
    }

    return {
      headers,
      items: collectItems(html.querySelector('ul'))
    }
  }, [content])

  return (
    <div className={`toc ${isOpen ? 'open' : ''}`}>
      <span>Table of Contents</span>
      <button className='toc-closer btn-circular' onClick={closeToc} aria-label='Close table of contents side menu'>
        {!SSR_MODE && <Octicons.XIcon size={18} />}
      </button>
      <SimpleBar className='toc-list-wrapper'>
        <TocList {...tocListProps} />
      </SimpleBar>
    </div>
  )
}

const Dimmer = () => {
  const { toc, sidenav, closeToc, closeSidenav } = React.useContext(Ctx)

  return (
    <div
      className={`dimmer ${toc || sidenav ? 'active' : ''}`}
      onClick={() => toc ? closeToc() : closeSidenav()} />
  )
}

export default function Documentation({ 
  data: { markdownRemark, allMarkdownRemark, pageOrder: pageOrderData, site: { siteMetadata: site } }
}) {
  const [isTocOpen, setTocOpen] = React.useState(false)
  const [isSidenavOpen, setSidenavOpen] = React.useState(false)
  const openToc = React.useCallback(() => setTocOpen(true), [])
  const pageOrder = React.useMemo(() => (
    allMarkdownRemark.edges
      .map(({ node: { id, slug, frontmatter: { title } } }) => ({ title, slug, current: id === markdownRemark.id }))
      .filter(({ slug }) => {
        if (process.env.NODE_ENV === 'production') {
          return !(/^__/.test(slug))
        }
        return true
      })
      .sort((a, b) => {
        const orderOf = ({ title }) => pageOrderData.items[title] || -1;

        [a, b].forEach(({ title }) => {
          if (!(title in pageOrderData.items)) {
            console.error(`${title} has not been added to __order.txt`)
          }
        })

        return orderOf(a) - orderOf(b)
      })
  ), [pageOrderData, allMarkdownRemark, markdownRemark]);
  const providerValue = {
    toc: isTocOpen,
    sidenav: isSidenavOpen,
    openSidenav() { setSidenavOpen(true) },
    closeToc() { isTocOpen && setTocOpen(false) },
    closeSidenav() { setSidenavOpen(false) }
  }
  const metaTitle = `${markdownRemark.frontmatter.title} | ${site.metaTitle}`
  const pageUrl = new window.URL(markdownRemark.slug, site.url).toString()

  return (
    <div>
      <Helmet>
        <html lang='en' />
        <meta charSet='utf-8' />
        <title>{metaTitle}</title>
        {/* <meta name='description' content={site.description} /> */}
        <link rel='canonical' href={pageUrl} />
        <meta name='robots' content='index, follow' />

        <meta property='og:type' content='documentation' />
        <meta property='og:title' content={metaTitle} />
        {/* <meta property='og:description' content={site.description} /> */}
        {/* <meta property='og:image' content='LINK TO THE IMAGE FILE' /> */}
        <meta property='og:url' content={pageUrl} />
        <meta property='og:site_name' content={site.metaTitle} />
      </Helmet>

      <Ctx.Provider value={providerValue}>
        <Header title={site.title} />
        <Sidenav items={pageOrder} />
        <Toc content={markdownRemark.tableOfContents} />
        <Dimmer />

        <div className='md-content'>
          <h1>{markdownRemark.frontmatter.title}</h1>
          <Interweave content={markdownRemark.html} transform={interweaveTransform} />
          <Footer pageOrder={pageOrder} />
          <button className='toc-opener btn-circular' onClick={openToc} aria-label='Open table of contents side menu'>
            {!SSR_MODE && <Octicons.QuoteIcon size={18} />}
          </button>
        </div>
      </Ctx.Provider>
    </div>
  )
}

export const pageQuery = graphql`
  query DocPageQuery($id: String) {
    site {
      siteMetadata {
        title
        metaTitle
        url
      }
    }

    pageOrder {
      items(from: "src/docs/__order.txt")
    }

    markdownRemark(id: { eq: $id }) {
      id
      html
      tableOfContents
      slug
      frontmatter {
        title
      }
    }

    allMarkdownRemark {
      edges {
        node {
          id
          slug
          frontmatter {
            title
          }
        }
      }
    }
  }
`
