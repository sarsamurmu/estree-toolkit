import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          key='$script$'
          dangerouslySetInnerHTML={{
            __html: `
            (() => {
              const theme = localStorage.getItem('theme') || 'light'

              document.documentElement.setAttribute('theme', theme)
            })()
          `
          }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
