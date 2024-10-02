import 'simplebar-react/dist/simplebar.min.css'
import '@/styles/global.scss'
import Script from 'next/script'

export default function App({ Component, pageProps, ...rest }) {
  return (
    <>
      <Component {...pageProps} />
      <Script
        defer
        data-cf-beacon='{"token": "d10df4b8bf7e4025adf218621ad18736"}'
        src='https://static.cloudflareinsights.com/beacon.min.js' />
    </>
  )
}
