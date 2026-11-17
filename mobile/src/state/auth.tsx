import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState, View } from 'react-native'
import * as auth from '../services/auth'

type Status = 'loading' | 'out' | 'in'
interface Ctx {
  status: Status
  session: auth.Session | null
  /** Set when the session ended because of inactivity, so the login screen can say why. */
  expired: boolean
  signIn(id: string, pw: string): Promise<void>
  signOut(): Promise<void>
  clearExpired(): void
}
const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children, onSignedIn, onSignedOut }: { children: React.ReactNode; onSignedIn: () => void; onSignedOut?: () => void }) {
  const [status, setStatus] = useState<Status>('loading')
  const [session, setSession] = useState<auth.Session | null>(null)
  const [expired, setExpired] = useState(false)
  const sRef = useRef<auth.Session | null>(null)
  sRef.current = session

  useEffect(() => {
    auth.restore().then(s => {
      setSession(s)
      setStatus(s ? 'in' : 'out')
    })
  }, [])

  const signOut = useCallback(async () => {
    await auth.logout()
    setSession(null)
    setStatus('out')
    onSignedOut?.()
  }, [onSignedOut])

  const expire = useCallback(async () => {
    setExpired(true)
    await signOut()
  }, [signOut])

  /* inactivity timeout: checked on a timer and whenever the app returns to the foreground */
  useEffect(() => {
    if (status !== 'in') return
    const check = () => {
      const s = sRef.current
      if (s && auth.isExpired(s)) expire()
    }
    const id = setInterval(check, 30000)
    const sub = AppState.addEventListener('change', st => st === 'active' && check())
    return () => {
      clearInterval(id)
      sub.remove()
    }
  }, [status, expire])

  const signIn = useCallback(
    async (id: string, pw: string) => {
      const s = await auth.login(id, pw)
      onSignedIn()
      setExpired(false)
      setSession(s)
      setStatus('in')
    },
    [onSignedIn]
  )

  /* any touch counts as activity */
  const onTouch = useCallback(() => {
    const s = sRef.current
    if (s) auth.touch(s).then(n => (sRef.current = n))
  }, [])

  return (
    <AuthCtx.Provider value={{ status, session, expired, signIn, signOut, clearExpired: () => setExpired(false) }}>
      <View style={{ flex: 1 }} onTouchStart={onTouch}>
        {children}
      </View>
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}
