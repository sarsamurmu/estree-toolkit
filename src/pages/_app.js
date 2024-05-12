import 'simplebar-react/dist/simplebar.min.css'
import '@/styles/docs.scss'

export default function App({ Component, pageProps, ...rest }) {
  return <Component {...pageProps} />
}
