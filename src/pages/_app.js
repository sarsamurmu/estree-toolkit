import 'simplebar-react/dist/simplebar.min.css'
import '@/styles/global.scss'

export default function App({ Component, pageProps, ...rest }) {
  return <Component {...pageProps} />
}
