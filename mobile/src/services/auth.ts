import * as Crypto from 'expo-crypto'
import { secure } from './storage'

/* The website has no authentication backend: its login form accepts whatever is typed
   (pre-filled with the demo credentials) and shows the portal. The mobile app keeps that
   behaviour but wraps it in a real session: an opaque token kept in the device keystore, an
   inactivity timeout, and a single place (this file) to swap for a real identity provider. */

const KEY = 'castelval.session.v1'
export const SESSION_TTL_MS = 30 * 60 * 1000 // inactivity timeout

export interface Session {
  token: string
  userId: string
  createdAt: number
  lastActive: number
}

const isValid = (s: Session | null): s is Session =>
  !!s && typeof s.token === 'string' && Date.now() - s.lastActive < SESSION_TTL_MS

export async function login(userId: string, _secret: string): Promise<Session> {
  const now = Date.now()
  const s: Session = { token: Crypto.randomUUID(), userId: userId.trim() || 'DEMO2026', createdAt: now, lastActive: now }
  await secure.set(KEY, JSON.stringify(s))
  return s
}

export async function restore(): Promise<Session | null> {
  const raw = await secure.get(KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Session
    if (isValid(s)) return s
  } catch {
    /* corrupted entry */
  }
  await secure.del(KEY)
  return null
}

let lastWrite = 0
/** Record user activity (throttled) so the inactivity timeout restarts. */
export async function touch(s: Session): Promise<Session> {
  const now = Date.now()
  const next = { ...s, lastActive: now }
  if (now - lastWrite > 15000) {
    lastWrite = now
    await secure.set(KEY, JSON.stringify(next))
  }
  return next
}

export const isExpired = (s: Session) => Date.now() - s.lastActive >= SESSION_TTL_MS
export const logout = () => secure.del(KEY)
