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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Lexend+Deca:wght@100..900&family=Sora:wght@100..800&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
