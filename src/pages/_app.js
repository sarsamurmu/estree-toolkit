import 'simplebar-react/dist/simplebar.min.css'
import '@/styles/prism-theme.css'
import '@/styles/docs.scss'

export default function App({ Component, pageProps, ...rest }) {
  return <Component {...pageProps} />
}
