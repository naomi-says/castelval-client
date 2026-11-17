import { useState } from 'react'
import Login from './Login'
import Portal from './Portal'

export default function App() {
  const [logged, setLogged] = useState(false)
  const [run, setRun] = useState(0)

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
