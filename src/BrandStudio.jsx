/* Brand studio — the hidden admin page at /admin/branding.
 * Edit the logo, the name and the colours; a live preview (the real portal in an iframe) follows
 * every change; "Publish" saves to the backend and the portal picks it up for every visitor.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './BrandStudio.css'
import {
  COLOR_FIELDS,
  DEFAULT_BRANDING,
  DEFAULT_COLORS,
  PRESETS,
  SWATCHES,
  computeVars,
  fetchBranding,
  isHex,
  setBranding,
  validate
} from './branding'
import { LOGO } from './data'

const TOKEN_KEY = 'cv-studio-token'
const MAX_LOGO = 2 * 1024 * 1024
const LOGO_OK = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

/* ---------- API ---------- */
async function api(path, { method = 'GET', body, token, raw } = {}) {
  const headers = {}
  if (token) headers['X-Studio-Token'] = token // not Authorization: the browser uses that for the site login
  let payload
  if (raw) {
    payload = raw
    headers['Content-Type'] = raw.type || 'application/octet-stream'
  } else if (body !== undefined) {
    payload = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }
  let r
  try {
    r = await fetch('/api/branding' + path, { method, headers, body: payload })
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Is the backend running?'), { status: 0 })
  }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed (' + r.status + ')'), { status: r.status })
  return data
}

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}
const writeToken = t => {
  try {
    t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/* ---------- draft helpers ---------- */
const toDraft = s => ({
  name: s.name,
  tagline: s.tagline,
  showLogo: s.showLogo,
  showName: s.showName,
  logoScale: s.logoScale,
  logoTone: s.logoTone,
  colors: { ...DEFAULT_BRANDING.colors, ...s.colors },
  logoFile: null,
  logoRemoved: false
})
const plain = d => JSON.stringify({ ...d, logoFile: null })
const sameColors = (a, b) => Object.keys(DEFAULT_BRANDING.colors).every(k => (a[k] || null) === (b[k] || null))

/* ================================================================== */
export default function BrandStudio() {
  const [token, setToken] = useState(readToken)

  useEffect(() => {
    const prev = document.title
    document.title = 'Brand studio'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.appendChild(meta)
    return () => {
      document.title = prev
      meta.remove()
    }
  }, [])

  return (
    <div className="bs">
      {token ? (
        <Studio
          token={token}
          onSignOut={() => {
            writeToken('')
            setToken('')
          }}
        />
      ) : (
        <Gate
          onToken={t => {
            writeToken(t)
            setToken(t)
          }}
        />
      )}
    </div>
  )
}

/* ---------- sign-in ---------- */
function Gate({ onToken }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const { token } = await api('/login', { method: 'POST', body: { password: pw } })
      onToken(token)
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="bs-gate">
      <form className="bs-gate-card" onSubmit={submit}>
        <span className="bs-badge">Restricted area</span>
        <h1>Brand studio</h1>
        <p>Sign in to change the portal logo, name and colours.</p>
        <label htmlFor="bs-pw">Studio password</label>
        <input id="bs-pw" type="password" autoFocus autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} />
        {err && (
          <p className="bs-error" role="alert">
            {err}
          </p>
        )}
        <button className="bs-btn bs-primary" disabled={busy || !pw}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <small>
          The password is set with the <code>BRAND_ADMIN_PASSWORD</code> environment variable, or shown in the server console the first time it starts.
        </small>
      </form>
    </main>
  )
}

/* ---------- main editor ---------- */
function Studio({ token, onSignOut }) {
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) // {kind:'ok'|'err', text}
  const [logoUrl, setLogoUrl] = useState(null) // object URL of a not-yet-published logo

  useEffect(() => {
    fetchBranding()
      .then(s => {
        setSaved(s)
        setDraft(toDraft(s))
      })
      .catch(() => setLoadErr('Cannot load the current branding. Is the backend running?'))
  }, [])

  useEffect(() => () => logoUrl && URL.revokeObjectURL(logoUrl), [logoUrl])

  const patch = useCallback(p => setDraft(d => ({ ...d, ...p })), [])
  const patchColor = useCallback((k, v) => setDraft(d => ({ ...d, colors: { ...d.colors, [k]: v } })), [])

  const dirty = useMemo(
    () => !!draft && !!saved && (plain(draft) !== plain(toDraft(saved)) || !!draft.logoFile || draft.logoRemoved),
    [draft, saved]
  )

  /* what the preview and the logo tile should render */
  const effective = useMemo(() => {
    if (!draft || !saved) return null
    const matched = PRESETS.find(p => sameColors(p.colors, draft.colors))
    return {
      ...DEFAULT_BRANDING,
      ...draft,
      preset: matched ? matched.id : 'custom',
      logoFile: undefined,
      logoUrl: logoUrl || (draft.logoRemoved ? null : saved.logoUrl)
    }
  }, [draft, saved, logoUrl])

  const { errors, warnings } = useMemo(() => (draft ? validate(draft) : { errors: {}, warnings: {} }), [draft])
  const visErr = draft && !draft.showLogo && !(draft.showName && draft.name.trim()) ? 'Show the logo or the name — the header cannot be empty.' : ''
  const blocked = Object.keys(errors).length > 0 || !!visErr

  useEffect(() => {
    if (!dirty) return
    const f = e => e.preventDefault()
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [dirty])

  const pickLogo = file => {
    if (!file) return
    if (!LOGO_OK.includes(file.type)) return setNotice({ kind: 'err', text: 'Unsupported file. Use PNG, JPG, WEBP, GIF or SVG.' })
    if (file.size > MAX_LOGO) return setNotice({ kind: 'err', text: 'File too large — 2 MB maximum.' })
    setNotice(null)
    setLogoUrl(URL.createObjectURL(file))
    patch({ logoFile: file, logoRemoved: false, showLogo: true, logoTone: 'original' })
  }

  const removeLogo = () => {
    setLogoUrl(null)
    patch({ logoFile: null, logoRemoved: true, logoTone: 'auto' })
  }

  const reset = () => {
    setLogoUrl(null)
    setDraft({
      ...toDraft(DEFAULT_BRANDING),
      logoRemoved: !!saved.logoUrl
    })
    setNotice(null)
  }

  const discard = () => {
    setLogoUrl(null)
    setDraft(toDraft(saved))
    setNotice(null)
  }

  const publish = async () => {
    setBusy(true)
    setNotice(null)
    try {
      if (draft.logoFile) await api('/logo', { method: 'POST', token, raw: draft.logoFile })
      else if (draft.logoRemoved && saved.logoUrl) await api('/logo', { method: 'DELETE', token })
      const body = {
        name: draft.name.trim(),
        tagline: draft.tagline.trim(),
        showLogo: draft.showLogo,
        showName: draft.showName,
        logoScale: draft.logoScale,
        logoTone: draft.logoTone,
        preset: effective.preset,
        colors: draft.colors
      }
      const next = await api('', { method: 'PUT', token, body })
      setLogoUrl(null)
      setSaved(next)
      setDraft(toDraft(next))
      setBranding(next) // this tab's portal + the local cache follow immediately
      setNotice({ kind: 'ok', text: 'Published — the live portal now uses this branding.' })
    } catch (x) {
      if (x.status === 401) {
        onSignOut()
        return
      }
      setNotice({ kind: 'err', text: x.message })
    } finally {
      setBusy(false)
    }
  }

  if (loadErr)
    return (
      <main className="bs-gate">
        <div className="bs-gate-card">
          <h1>Brand studio</h1>
          <p className="bs-error">{loadErr}</p>
          <button className="bs-btn" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
      </main>
    )
  if (!draft) return <p className="bs-loading">Loading…</p>

  return (
    <>
      <header className="bs-top">
        <div>
          <h1>Brand studio</h1>
          <p>Logo, name and colours of the client portal.</p>
        </div>
        <div className="bs-top-actions">
          <a className="bs-btn" href="/" target="_blank" rel="noreferrer">
            View portal ↗
          </a>
          <button className="bs-btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="bs-layout">
        <div className="bs-controls">
          <LogoCard draft={draft} effective={effective} patch={patch} pickLogo={pickLogo} removeLogo={removeLogo} />
          <NameCard draft={draft} patch={patch} error={visErr} />
          <ThemeCard draft={draft} patch={patch} setDraft={setDraft} />
          <ColorsCard draft={draft} patchColor={patchColor} errors={errors} warnings={warnings} />
          <div className="bs-card bs-reset">
            <div>
              <h2>Start over</h2>
              <p>Go back to the original Castelval logo, name and colours (not published until you press Publish).</p>
            </div>
            <button className="bs-btn" onClick={reset}>
              Reset to Castelval defaults
            </button>
          </div>
        </div>

        <Preview branding={effective} />
      </div>

      <div className="bs-bar" role="region" aria-label="Publish changes">
        <span className={'bs-status' + (dirty ? ' dirty' : '')}>
          {notice ? (
            <b className={notice.kind === 'ok' ? 'ok' : 'err'} role="status">
              {notice.text}
            </b>
          ) : dirty ? (
            'Unpublished changes'
          ) : (
            'All changes published'
          )}
        </span>
        <button className="bs-btn" onClick={discard} disabled={!dirty || busy}>
          Discard
        </button>
        <button className="bs-btn bs-primary" onClick={publish} disabled={!dirty || busy || blocked}>
          {busy ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </>
  )
}

/* ---------- logo ---------- */
function LogoCard({ draft, effective, patch, pickLogo, removeLogo }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const src = effective.logoUrl || LOGO
  const custom = !!effective.logoUrl
  const vars = computeVars(effective)
  const hdr = effective.colors.header || DEFAULT_COLORS.header
  const filter = vars['--th-logo-filter'] || 'brightness(0) invert(1)'
  const ink = vars['--th-hdr-ink'] || '#ffffff'
  const scale = draft.logoScale

  return (
    <section className="bs-card">
      <h2>Logo</h2>
      <p className="bs-sub">Shown in the header, on the login screen and on the card artwork. Transparent PNG or SVG works best.</p>

      <div className="bs-stage" style={{ background: hdr, color: ink }} aria-label="Logo as it appears in the header">
        <div className="bs-stage-brand">
          {draft.showLogo && <img src={src} alt="" style={{ width: 52 * scale, filter: draft.logoTone === 'original' ? 'none' : filter }} />}
          {draft.showName && draft.name && <span>{draft.name}</span>}
        </div>
        <small>Header preview · actual size</small>
      </div>

      <div
        className={'bs-drop' + (over ? ' over' : '')}
        onDragOver={e => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={e => {
          e.preventDefault()
          setOver(false)
          pickLogo(e.dataTransfer.files[0])
        }}
      >
        <input ref={input} type="file" accept={LOGO_OK.join(',')} hidden onChange={e => (pickLogo(e.target.files[0]), (e.target.value = ''))} />
        <button className="bs-btn bs-primary" onClick={() => input.current.click()}>
          {custom ? 'Replace logo' : 'Upload logo'}
        </button>
        {custom && (
          <button className="bs-btn bs-danger" onClick={removeLogo}>
            Delete custom logo
          </button>
        )}
        <span>…or drop an image here · PNG, JPG, WEBP, GIF, SVG · 2 MB max</span>
      </div>

      <div className="bs-field">
        <div className="bs-field-head">
          <label htmlFor="bs-zoom">Zoom</label>
          <output>{Math.round(scale * 100)}%</output>
        </div>
        <div className="bs-zoom">
          <button className="bs-icon" aria-label="Zoom out" onClick={() => patch({ logoScale: Math.max(0.4, +(scale - 0.05).toFixed(2)) })}>
            −
          </button>
          <input id="bs-zoom" type="range" min="40" max="250" step="5" value={Math.round(scale * 100)} onChange={e => patch({ logoScale: +e.target.value / 100 })} />
          <button className="bs-icon" aria-label="Zoom in" onClick={() => patch({ logoScale: Math.min(2.5, +(scale + 0.05).toFixed(2)) })}>
            +
          </button>
          <button className="bs-link" onClick={() => patch({ logoScale: 1 })} disabled={scale === 1}>
            Reset
          </button>
        </div>
      </div>

      <div className="bs-row">
        <Toggle checked={draft.showLogo} onChange={v => patch({ showLogo: v })} label="Show the logo" />
      </div>

      <fieldset className="bs-seg">
        <legend>Logo colours</legend>
        <label className={draft.logoTone === 'original' ? 'on' : ''}>
          <input type="radio" name="tone" checked={draft.logoTone === 'original'} onChange={() => patch({ logoTone: 'original' })} />
          Keep original colours
        </label>
        <label className={draft.logoTone === 'auto' ? 'on' : ''}>
          <input type="radio" name="tone" checked={draft.logoTone === 'auto'} onChange={() => patch({ logoTone: 'auto' })} />
          Single colour (matches the header)
        </label>
      </fieldset>
    </section>
  )
}

/* ---------- name ---------- */
function NameCard({ draft, patch, error }) {
  return (
    <section className="bs-card">
      <h2>Name</h2>
      <p className="bs-sub">The name next to the logo. It also names the browser tab and the page footer.</p>
      <div className="bs-field">
        <div className="bs-field-head">
          <label htmlFor="bs-name">Name beside the logo</label>
          <output>{draft.name.length}/40</output>
        </div>
        <input id="bs-name" maxLength={40} value={draft.name} onChange={e => patch({ name: e.target.value })} />
      </div>
      <div className="bs-field">
        <div className="bs-field-head">
          <label htmlFor="bs-tag">Tagline on the login screen</label>
          <output>{draft.tagline.length}/40</output>
        </div>
        <input id="bs-tag" maxLength={40} value={draft.tagline} onChange={e => patch({ tagline: e.target.value })} />
      </div>
      <div className="bs-row">
        <Toggle checked={draft.showName} onChange={v => patch({ showName: v })} label="Show the name" />
      </div>
      {error && (
        <p className="bs-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

/* ---------- presets ---------- */
function ThemeCard({ draft, setDraft }) {
  return (
    <section className="bs-card">
      <h2>Ready-made themes</h2>
      <p className="bs-sub">Start from a theme, then fine-tune any colour below.</p>
      <div className="bs-presets">
        {PRESETS.map(p => {
          const c = { ...DEFAULT_COLORS, ...Object.fromEntries(Object.entries(p.colors).filter(([, v]) => v)) }
          const on = sameColors(p.colors, draft.colors)
          return (
            <button key={p.id} className={'bs-preset' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setDraft(d => ({ ...d, colors: { ...p.colors } }))}>
              <span className="bs-mini" style={{ background: c.background }}>
                <i style={{ background: c.header }} />
                <b style={{ background: c.button }} />
                <em style={{ background: c.light }} />
                <u style={{ background: c.highlight }} />
              </span>
              <span>{p.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- colours ---------- */
function ColorsCard({ draft, patchColor, errors, warnings }) {
  return (
    <section className="bs-card">
      <h2>Colours</h2>
      <p className="bs-sub">Pick a swatch or any custom colour. Text on the header and on buttons switches to black or white automatically.</p>
      {COLOR_FIELDS.map(f => (
        <ColorField key={f.key} field={f} value={draft.colors[f.key]} onChange={v => patchColor(f.key, v)} error={errors[f.key]} warning={warnings[f.key]} />
      ))}
    </section>
  )
}

function ColorField({ field, value, onChange, error, warning }) {
  const fallback = DEFAULT_COLORS[field.key]
  const shown = isHex(value) ? value : fallback
  const [text, setText] = useState(shown)
  useEffect(() => setText(value == null ? fallback : value), [value, fallback])

  const commit = t => {
    setText(t)
    const v = t.startsWith('#') ? t : '#' + t
    if (isHex(v)) onChange(v.toLowerCase() === fallback ? null : v.toLowerCase())
    else if (t === '') onChange(null)
  }
  const id = 'bs-c-' + field.key

  return (
    <div className="bs-color">
      <div className="bs-field-head">
        <label htmlFor={id}>{field.label}</label>
        <span className="bs-def">{value == null ? 'Default' : ''}</span>
        {value != null && (
          <button className="bs-link" onClick={() => onChange(null)}>
            Reset
          </button>
        )}
      </div>
      <p className="bs-hint">{field.hint}</p>
      <div className="bs-swatches" role="group" aria-label={field.label + ' swatches'}>
        {SWATCHES[field.key].map(c => (
          <button
            key={c}
            className={'bs-sw' + (c.toLowerCase() === shown.toLowerCase() ? ' on' : '')}
            style={{ background: c }}
            aria-label={c}
            aria-pressed={c.toLowerCase() === shown.toLowerCase()}
            title={c}
            onClick={() => onChange(c.toLowerCase() === fallback ? null : c)}
          />
        ))}
      </div>
      <div className="bs-custom">
        <input type="color" id={id} value={shown} onChange={e => onChange(e.target.value === fallback ? null : e.target.value)} aria-label={field.label + ' custom colour'} />
        <input className="bs-hex" value={text} maxLength={7} spellCheck={false} onChange={e => commit(e.target.value)} aria-label={field.label + ' hex value'} />
      </div>
      {error && (
        <p className="bs-error" role="alert">
          {error}
        </p>
      )}
      {!error && warning && <p className="bs-warn">{warning}</p>}
    </div>
  )
}

/* ---------- toggle ---------- */
function Toggle({ checked, onChange, label }) {
  return (
    <label className="bs-toggle">
      <input type="checkbox" role="switch" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="bs-track" aria-hidden="true" />
      {label}
    </label>
  )
}

/* ---------- live preview (the real portal in an iframe) ---------- */
const DEVICES = { desktop: { w: 1280, h: 820, label: 'Desktop' }, mobile: { w: 390, h: 780, label: 'Mobile' } }

function Preview({ branding }) {
  const [screen, setScreen] = useState('portal')
  const [device, setDevice] = useState('desktop')
  const frame = useRef(null)
  const box = useRef(null)
  const [width, setWidth] = useState(600)
  const latest = useRef(branding)
  latest.current = branding

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'cv-preview', branding: latest.current }, location.origin)
  }, [])

  useEffect(() => {
    const onMsg = e => {
      if (e.origin === location.origin && e.source === frame.current?.contentWindow && e.data?.type === 'cv-preview-ready') send()
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [send])

  useEffect(send, [branding, send])

  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])

  const d = DEVICES[device]
  const scale = Math.min(1, width / d.w, device === 'mobile' ? 0.9 : 1)
  const shellW = d.w * scale

  return (
    <aside className="bs-preview" aria-label="Live preview">
      <div className="bs-pv-head">
        <div>
          <h2>Live preview</h2>
          <p>Updates as you edit. Click around — it is the real portal.</p>
        </div>
        <div className="bs-pv-ctl">
          <div className="bs-tabs" role="tablist" aria-label="Screen">
            {[
              ['portal', 'Portal'],
              ['login', 'Login']
            ].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={screen === k} className={screen === k ? 'on' : ''} onClick={() => setScreen(k)}>
                {l}
              </button>
            ))}
          </div>
          <div className="bs-tabs" role="tablist" aria-label="Device">
            {Object.entries(DEVICES).map(([k, v]) => (
              <button key={k} role="tab" aria-selected={device === k} className={device === k ? 'on' : ''} onClick={() => setDevice(k)}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bs-pv-box" ref={box}>
        <div className={'bs-pv-shell ' + device} style={{ width: shellW, height: d.h * scale }}>
          <iframe
            ref={frame}
            key={screen}
            title="Portal preview"
            src={`/?preview=${screen}`}
            style={{ width: d.w, height: d.h, transform: `scale(${scale})` }}
            onLoad={send}
          />
        </div>
      </div>
    </aside>
  )
}
