// import "@/styles/globals.css";

import React, { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Interweave } from 'interweave'
import * as Octicons from '@primer/octicons-react'
import SimpleBar from 'simplebar-react'
import * as InterweaveSSR from 'interweave-ssr'

InterweaveSSR.polyfill()

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
      {copied ? <Octicons.CheckIcon fill="#07bd5f" /> : <Octicons.CopyIcon />}
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
    <span className='icon'><Octicons.InfoIcon size={24} /></span>
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
    case 'pre': {
      if (node.getAttribute('class').includes('shiki')) {
        const title = node.getAttribute('title')
        return <CodeWrapper title={title}>{children[0]}</CodeWrapper>
      }
      break
    }

    case 'alert': {
      return <Alert>{children}</Alert>
    }

    case 'tabs': {
      return <Tabs>{children}</Tabs>
    }

    case 'tab': {
      const name = children.shift()
      return <TabItem name={name}>{children}</TabItem>
    }
  }
}

const Ctx = React.createContext({
  toc: false,
  sidenav: false,
  openSidenav() { },
  closeToc() { },
  closeSidenav() { }
});

const ThemeButton = ({ toggleTheme, isDarkTheme }) => {
  const onEnter = React.useCallback(() => document.body.classList.add('no-transition'), [])
  const onLeave = React.useCallback(() => document.body.classList.remove('no-transition'), []);

  return (
    <button
      className='btn-circular theme-btn'
      onClick={toggleTheme}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-label='Toggle theme'>
      {isDarkTheme ? <Octicons.MoonIcon size={20} /> : <Octicons.SunIcon size={20} />}
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
          <Icon size={18} />
          {name}
        </a>
      </li>
    ))}
  </ul>
)

const Header = ({ title }) => {
  const { openSidenav } = React.useContext(Ctx)
  const [theme, setTheme] = React.useState('light')
  const [themeLoaded, setThemeLoaded] = React.useState(false)
  const toggleTheme = React.useCallback(() => setTheme((t) => t === 'light' ? 'dark' : 'light'), [])

  React.useEffect(() => {
    console.log('Theme LOADED', window.localStorage.getItem('theme'))
    if (!themeLoaded) {
      setTheme(window.localStorage.getItem('theme') || 'light')
      setThemeLoaded(true)
    }
  }, [themeLoaded])

  React.useEffect(() => {
    console.log('Theme SET', theme)
    if (!themeLoaded) return
    document.documentElement.setAttribute('theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme, themeLoaded])

  return (
    <header>
      <button className='btn-circular menu-btn' onClick={openSidenav} aria-label='Open navigation menu'>
        <Octicons.ThreeBarsIcon size={20} />
      </button>
      <Link href='/' className='title'>{title}</Link>
      <i className='divider' />
      <OtherLinks />
      <ThemeButton {...{ toggleTheme, isDarkTheme: theme === 'dark' }} />
    </header>
  )
}

const Footer = ({ pages }) => {
  const { prev, next } = React.useMemo(() => {
    const currIdx = pages.findIndex(({ current }) => current)
    return {
      prev: pages[currIdx - 1],
      next: pages[currIdx + 1]
    }
  }, [pages])

  return (
    <footer>
      <div className='next-prev-container'>
        {[['Previous', prev], ['Next', next]].map(([type, item], idx) => (
          <Link
            className={(item ? '' : 'hidden') + (prev && next ? 'joined' : '')}
            href={item ? ('../' + item.slug) : '#'}
            key={type}>
            <div>
              <span>{type}</span>
              <span>{item ? item.title : ''}</span>
            </div>
            {idx === 0 ? <Octicons.ArrowLeftIcon size={26} /> : <Octicons.ArrowRightIcon size={26} />}
          </Link>
        ))}
      </div>
      <hr />
      <p>© Copyright 2024 Sarsa Murmu. All rights reserved.</p>
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
            <Link {...(current ? { className: 'current' } : {})} href={'../' + slug}>{title}</Link>
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

const TOCList = ({ items, headers }) => {
  const activeHeader = useActiveHeader(headers)

  return renderTocList('', items, activeHeader)
}

const TOC = ({ tree }) => {
  const { toc: isOpen, closeToc } = React.useContext(Ctx)

  return (
    <div className={`toc ${isOpen ? 'open' : ''}`}>
      <span>Table of Contents</span>
      <button className='toc-closer btn-circular' onClick={closeToc} aria-label='Close table of contents side menu'>
        <Octicons.XIcon size={18} />
      </button>
      <SimpleBar className='toc-list-wrapper'>
        <TOCList {...tree} />
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

export function DocsPage({ frontmatter, content, site, toc, pages }) {
  const [isTocOpen, setTocOpen] = React.useState(false)
  const [isSidenavOpen, setSidenavOpen] = React.useState(false)
  const openToc = React.useCallback(() => setTocOpen(true), [])
  const providerValue = {
    toc: isTocOpen,
    sidenav: isSidenavOpen,
    openSidenav() { setSidenavOpen(true) },
    closeToc() { isTocOpen && setTocOpen(false) },
    closeSidenav() { setSidenavOpen(false) }
  }
  const metaTitle = `${frontmatter.title} | ${site.metaTitle}`

  return (
    <>
      <Head>
        <meta charSet='utf-8' />
        <title>{metaTitle}</title>
        {/* <meta name='description' content={site.description} /> */}
        <link rel='canonical' href={site.url} />
        <meta name='robots' content='index, follow' />

        <meta property='og:type' content='documentation' />
        <meta property='og:title' content={metaTitle} />
        {/* <meta property='og:description' content={site.description} /> */}
        {/* <meta property='og:image' content='LINK TO THE IMAGE FILE' /> */}
        <meta property='og:url' content={site.url} />
        <meta property='og:site_name' content={site.metaTitle} />
      </Head>

      <Ctx.Provider value={providerValue}>
        <Header title={site.title} />
        <Sidenav items={pages} />
        <TOC tree={toc} />
        <Dimmer />

        <div className='md-content'>
          <h1>{frontmatter.title}</h1>
          <Interweave content={content} transform={interweaveTransform} />
          <Footer pages={pages} />
          <button className='toc-opener btn-circular' onClick={openToc} aria-label='Open table of contents side menu'>
            <Octicons.QuoteIcon size={18} />
          </button>
        </div>
      </Ctx.Provider>
    </>
  )
}
