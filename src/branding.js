/* Branding (logo, name, colours): defaults, colour maths, the live store, and the CSS-variable bridge.
 *
 * The portal stylesheet reads --th-* variables whose fallbacks equal the original Castelval look,
 * so when nothing is customised the page is pixel-identical to before. Only customised colours are
 * written onto <html>.
 */
import { useSyncExternalStore } from 'react'
import { LOGO } from './data'

export const STUDIO_PATH = '/admin/branding'
const CACHE_KEY = 'cv-branding-v1'

export const DEFAULT_COLORS = {
  header: '#0f2a4d',
  button: '#0f2a4d',
  background: '#ffffff',
  light: '#eaf1fb',
  highlight: '#c9a227',
  title: '#163965'
}

export const DEFAULT_BRANDING = {
  name: 'CASTELVAL',
  tagline: 'FINANCE',
  showLogo: true,
  showName: true,
  logoScale: 1,
  logoTone: 'auto',
  preset: 'castelval',
  colors: { header: null, button: null, background: null, light: null, highlight: null, title: null },
  logoUrl: null
}

/* ---------- colour maths ---------- */
export const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const hex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
export const mix = (a, b, t) => {
  const x = rgb(a)
  const y = rgb(b)
  return hex(x.map((v, i) => v + (y[i] - v) * t))
}
export const luminance = h => {
  const [r, g, b] = rgb(h).map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}
/* readable text colour for a given background */
export const inkOn = bg => (contrast(bg, '#ffffff') >= contrast(bg, '#0f1b2d') ? '#ffffff' : '#0f1b2d')

/* ---------- presets & swatches ---------- */
export const PRESETS = [
  { id: 'castelval', label: 'Castelval (default)', colors: { header: null, button: null, background: null, light: null, highlight: null, title: null } },
  { id: 'ocean', label: 'Ocean', colors: { header: '#0b4f6c', button: '#0b4f6c', background: '#ffffff', light: '#e6f3f8', highlight: '#f0a500', title: '#0b4f6c' } },
  { id: 'emerald', label: 'Emerald', colors: { header: '#0f4c3a', button: '#0f6b4f', background: '#ffffff', light: '#e7f5ee', highlight: '#d4a017', title: '#0f4c3a' } },
  { id: 'burgundy', label: 'Burgundy', colors: { header: '#5b1a2b', button: '#7a1f3a', background: '#fffafb', light: '#f8ebee', highlight: '#c9a227', title: '#5b1a2b' } },
  { id: 'violet', label: 'Royal violet', colors: { header: '#3b2a6b', button: '#5a3fa0', background: '#ffffff', light: '#efeafa', highlight: '#e0a526', title: '#3b2a6b' } },
  { id: 'terracotta', label: 'Terracotta', colors: { header: '#7a3b1d', button: '#b4531f', background: '#fffaf5', light: '#fbeee3', highlight: '#1f6f78', title: '#7a3b1d' } },
  { id: 'slate', label: 'Slate', colors: { header: '#263238', button: '#37474f', background: '#ffffff', light: '#eceff1', highlight: '#ff8f00', title: '#263238' } },
  { id: 'clean', label: 'Clean light', colors: { header: '#ffffff', button: '#163965', background: '#f7f9fc', light: '#e8eef7', highlight: '#c9a227', title: '#163965' } }
]

export const SWATCHES = {
  header: ['#0f2a4d', '#163965', '#1e3a8a', '#0b4f6c', '#0e7490', '#0f4c3a', '#166534', '#5b1a2b', '#9f1239', '#3b2a6b', '#7a3b1d', '#263238', '#111827', '#ffffff'],
  button: ['#0f2a4d', '#163965', '#1f5fbf', '#0b4f6c', '#0f6b4f', '#166534', '#7a1f3a', '#be123c', '#5a3fa0', '#b4531f', '#37474f', '#111827'],
  title: ['#163965', '#0f2a4d', '#1e3a8a', '#0b4f6c', '#0f4c3a', '#5b1a2b', '#3b2a6b', '#7a3b1d', '#263238', '#111827'],
  highlight: ['#c9a227', '#f0a500', '#d97706', '#e0a526', '#1f5fbf', '#0ea5a4', '#16a34a', '#e11d48', '#7c3aed', '#be185d'],
  background: ['#ffffff', '#fafafa', '#f8f9fb', '#f4f7fc', '#f2f8f9', '#f5f8f5', '#f7f4fb', '#fdf4f6', '#fdf8f3', '#fff9f0', '#fbfaf7', '#f6f1e7'],
  light: ['#eaf1fb', '#e6f3f8', '#e7f5ee', '#e9f7f1', '#eef2f7', '#eceff1', '#efeafa', '#f8ebee', '#fbeee3', '#fff4d6', '#fdecc8', '#f3eee2', '#e8f0e0', '#e4f1f2', '#f6e8f3', '#e9ecff']
}

export const COLOR_FIELDS = [
  { key: 'header', label: 'Header colour', hint: 'Top bar and the login panel.' },
  { key: 'button', label: 'Button colour', hint: 'Buttons, active menu item, selected options.' },
  { key: 'background', label: 'Background colour', hint: 'Page background. Light colours only.', light: true },
  { key: 'light', label: 'Light colour', hint: 'Hover, selected rows, soft panels. Light colours only.', light: true },
  { key: 'highlight', label: 'Highlight colour', hint: 'Underlines and small accents.' },
  { key: 'title', label: 'Title & link colour', hint: 'Headings, links and icons.' }
]

/* errors block saving; warnings are advice only. Both are { fieldKey: message }. */
export function validate(b) {
  const errors = {}
  const warnings = {}
  const c = b.colors
  for (const f of COLOR_FIELDS) {
    const v = c[f.key]
    if (v == null) continue
    if (!isHex(v)) errors[f.key] = 'Enter a valid colour such as #1a2b3c.'
    else if (f.light && luminance(v) < 0.55) errors[f.key] = 'Too dark — pick a lighter colour so text stays readable.'
  }
  const title = isHex(c.title) ? c.title : DEFAULT_COLORS.title
  const bg = isHex(c.background) && !errors.background ? c.background : DEFAULT_COLORS.background
  if (!errors.title && contrast(title, bg) < 4.5) warnings.title = 'Low contrast with the background — titles may be hard to read.'
  return { errors, warnings }
}

/* ---------- CSS variables ---------- */
const VAR_NAMES = [
  '--th-hdr', '--th-hdr-ink', '--th-hdr-dim', '--th-hdr-dim2', '--th-hdr-hover', '--th-btn', '--th-btn-hover', '--th-btn-deep', '--th-btn-ink', '--accent',
  '--th-bg', '--th-lf', '--th-soft', '--th-tint', '--th-line0', '--th-line', '--th-line2', '--gold', '--th-title', '--th-deep',
  '--th-logo-scale', '--th-logo-filter'
]

export function computeVars(b) {
  const c = b.colors || {}
  const v = {}
  if (isHex(c.header)) {
    v['--th-hdr'] = c.header
    const ink = inkOn(c.header)
    v['--th-hdr-ink'] = ink
    v['--th-hdr-dim'] = mix(ink, c.header, 0.28)
    v['--th-hdr-dim2'] = mix(ink, c.header, 0.4)
    v['--th-hdr-hover'] = ink + '24'
  }
  if (isHex(c.button)) {
    const dark = luminance(c.button) < 0.04
    v['--th-btn'] = c.button
    v['--th-btn-hover'] = dark ? mix(c.button, '#ffffff', 0.16) : mix(c.button, '#000000', 0.16)
    v['--th-btn-deep'] = mix(c.button, '#000000', 0.32)
    v['--th-btn-ink'] = inkOn(c.button)
    v['--accent'] = mix(c.button, '#ffffff', 0.12)
  }
  if (isHex(c.background)) {
    v['--th-bg'] = c.background
    v['--th-lf'] = c.background
  }
  if (isHex(c.light)) {
    const t = isHex(c.title) ? c.title : DEFAULT_COLORS.title
    v['--th-soft'] = c.light
    v['--th-tint'] = mix(c.light, '#ffffff', 0.55)
    v['--th-line0'] = mix(c.light, t, 0.08)
    v['--th-line'] = mix(c.light, t, 0.14)
    v['--th-line2'] = mix(c.light, t, 0.26)
  }
  if (isHex(c.highlight)) v['--gold'] = c.highlight
  if (isHex(c.title)) {
    v['--th-title'] = c.title
    v['--th-deep'] = mix(c.title, '#000000', 0.3)
  }
  const scale = Number(b.logoScale)
  if (Number.isFinite(scale) && scale !== 1) v['--th-logo-scale'] = String(scale)
  if (b.logoTone === 'original') v['--th-logo-filter'] = 'none'
  else if (isHex(c.header)) v['--th-logo-filter'] = luminance(c.header) < 0.45 ? 'brightness(0) invert(1)' : 'brightness(0)'
  return v
}

export function applyBranding(b, doc = document) {
  const root = doc.documentElement
  const vars = computeVars(b)
  for (const n of VAR_NAMES) {
    if (n in vars) root.style.setProperty(n, vars[n])
    else root.style.removeProperty(n)
  }
  const customName = b.name && b.name !== DEFAULT_BRANDING.name
  doc.title = customName ? `${b.name} – Espace client` : 'Castelval Finance – Espace client'
  let icon = doc.querySelector('link[rel="icon"]')
  if (b.logoUrl) {
    if (!icon) {
      icon = doc.createElement('link')
      icon.rel = 'icon'
      doc.head.appendChild(icon)
    }
    icon.href = b.logoUrl
  } else if (icon) icon.remove()
}

/* ---------- live store ---------- */
const merge = src => ({
  ...DEFAULT_BRANDING,
  ...(src || {}),
  colors: { ...DEFAULT_BRANDING.colors, ...((src && src.colors) || {}) }
})

let state = merge(null)
const subs = new Set()
export const getBranding = () => state
const notify = () => subs.forEach(f => f())

export function setBranding(next, { persist = true } = {}) {
  state = merge(next)
  applyBranding(state)
  if (persist) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable — fine */
    }
  }
  notify()
}

export function useBranding() {
  const b = useSyncExternalStore(
    cb => (subs.add(cb), () => subs.delete(cb)),
    getBranding
  )
  return { ...b, logoSrc: b.logoUrl || LOGO }
}

export const isPreviewFrame = () => {
  try {
    return window.self !== window.top && new URLSearchParams(location.search).has('preview')
  } catch {
    return true
  }
}

export async function fetchBranding() {
  const r = await fetch('/api/branding', { cache: 'no-store' })
  if (!r.ok) throw new Error('branding ' + r.status)
  return r.json()
}

/* Called once before React renders: apply the cached copy immediately (no flash of the old look),
   then refresh from the server. A missing/unreachable backend simply keeps the defaults. */
export function initBranding() {
  if (isPreviewFrame()) {
    // preview iframe: the studio streams its unsaved draft in; never touch the saved cache
    window.addEventListener('message', e => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'cv-preview') return
      setBranding(e.data.branding, { persist: false })
    })
    window.parent.postMessage({ type: 'cv-preview-ready' }, location.origin)
    return
  }
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached) setBranding(cached, { persist: false })
  } catch {
    /* ignore */
  }
  fetchBranding()
    .then(b => setBranding(b))
    .catch(() => {})
}
