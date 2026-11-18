import { lazy, Suspense, useState } from 'react'
import Login from './Login'
import Portal from './Portal'
import { STUDIO_PATH, isPreviewFrame } from './branding'

// The brand studio is a separate chunk: portal visitors never download it.
const BrandStudio = lazy(() => import('./BrandStudio'))

/* Hidden settings page: /admin/branding (or #/admin/branding on hosts without SPA fallback). */
const isStudioRoute = () =>
  location.pathname.replace(/\/+$/, '') === STUDIO_PATH || location.hash.replace(/\/+$/, '') === '#' + STUDIO_PATH

export default function App() {
  const studio = isStudioRoute()
  // inside the studio's preview iframe, ?preview=portal skips the login screen
  const preview = isPreviewFrame() ? new URLSearchParams(location.search).get('preview') : null
  const [logged, setLogged] = useState(preview === 'portal')
  const [run, setRun] = useState(0)

  if (studio) {
    return (
      <Suspense fallback={null}>
        <BrandStudio />
      </Suspense>
    )
  }

  if (!logged) {
    return (
      <Login
        onLogin={() => {
          setRun(r => r + 1)
          setLogged(true)
        }}
      />
    )
  }

  return <Portal key={run} onLogout={() => setLogged(false)} />
}
