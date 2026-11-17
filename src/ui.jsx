import { Children, isValidElement, useEffect, useRef, useState } from 'react'
import { D, TABS, SUBS } from './data'

export const Ic = ({ d, cls = 'ic' }) => (
  <svg className={cls} viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: d }} />
)

export function hd(x, title, limit) {
  const all = TABS[x.S.r]
  const tabs = all && limit ? all.slice(0, limit) : all
  /* these sections keep their sub-sections in the left navigation */
  const inNav = !!SUBS[x.S.r]
  return (
    <>
      <h1 className={tabs && !inNav ? 'tabbed' : undefined}>{title}</h1>
      {tabs && !inNav && (
        <div className="tabs">
          {tabs.map((name, i) => (
            <button key={i} className={x.S.t === i ? 'on' : ''} onClick={() => x.A.tab(i)}>
              {name}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export const kv = rows =>
  rows.map(([k, v], i) => (
    <div className="row" key={i}>
      <span>{k}</span>
      <b>{v}</b>
    </div>
  ))

export const tb = (h, rows) => (
  <div className="wrap">
    <table>
      <thead>
        <tr>{h.map((x, i) => <th key={i}>{x}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={h.length}>Aucune donnée.</td>
          </tr>
        ) : (
          rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)
        )}
      </tbody>
    </table>
  </div>
)

export const bar = (u, l) => (
  <div className="bar"><div style={{ width: Math.min(100, (u / l) * 100) + '%' }} /></div>
)

export const swRow = (label, checked, onChange) => (
  <div className="row">
    <span>{label}</span>
    <label className="sw">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-label={label} />
    </label>
  </div>
)

/* Operation list — Castelval "Mes opérations" design:
   sticky header, gold sort marks, a 338 px scrolling viewport and edge jumps. */
export function OpsTable({ rows, sort, onSort, E, onRow, adv = false }) {
  const [c, d] = sort
  const r = [...rows].sort((x, y) => (x[c] > y[c] ? 1 : x[c] < y[c] ? -1 : 0) * d)
  const view = useRef(null)
  const [edge, setEdge] = useState({ top: false, bottom: false })

  const measure = () => {
    const v = view.current
    if (!v) return
    const scrollable = v.scrollHeight > v.clientHeight + 2
    const top = scrollable && v.scrollTop > 4
    const bottom = scrollable && v.scrollTop + v.clientHeight < v.scrollHeight - 4
    setEdge(e => (e.top === top && e.bottom === bottom ? e : { top, bottom }))
  }

  useEffect(() => {
    const v = view.current
    if (!v) return
    measure()
    const sync = () => measure()
    v.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(sync)
      ro.observe(v)
      if (v.firstElementChild) ro.observe(v.firstElementChild)
    }
    return () => {
      v.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      if (ro) ro.disconnect()
    }
  }, [])

  useEffect(() => {
    measure()
  }, [rows, c, d])

  const jump = delta => view.current && view.current.scrollBy({ top: delta, behavior: 'smooth' })
  const head = adv ? ['Date opération', 'Libellé', 'Montant', 'Statut'] : ['Date opération', 'Libellé', 'Montant']
  const sortName = i => (i === 0 ? "date d'opération" : i === 1 ? 'libellé' : 'montant')

  return (
    <div className="cv-table-shell">
      <div className="cv-scroll-edge cv-scroll-edge--top" hidden={!edge.top}>
        <button type="button" onClick={() => jump(-190)} aria-label="Voir les opérations plus récentes">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div
        className="cv-table-viewport"
        ref={view}
        tabIndex={0}
        role="region"
        aria-label="Historique défilant des opérations"
      >
        <table className={'cv-transaction-table' + (adv ? ' cv-transaction-table--adv' : '')}>
          <caption className="cv-sr-only">Historique des opérations du compte</caption>
          <thead>
            <tr>
              {head.map((name, i) => {
                if (i > 2) {
                  return (
                    <th key={i} scope="col" className="cv-th">
                      {name}
                    </th>
                  )
                }
                const active = c === i
                return (
                  <th
                    key={i}
                    scope="col"
                    className="cv-th"
                    aria-sort={active ? (d > 0 ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      className="cv-sort"
                      onClick={() => onSort(i)}
                      aria-label={`Trier par ${sortName(i)}, ordre ${active && d > 0 ? 'décroissant' : 'croissant'}`}
                    >
                      <span className={'cv-sort-label' + (active ? ' is-active' : '')} aria-current={active ? 'true' : undefined}>
                        {i === 0 ? (
                          <>
                            <span className="cv-sort-label-wide">Date opération</span>
                            <span className="cv-sort-label-narrow">Date</span>
                          </>
                        ) : (
                          name
                        )}
                      </span>
                      <span className="cv-sort-slot" aria-hidden="true">
                        {active && (
                          <svg className="cv-sort-triangle" viewBox="0 0 12 12">
                            <path d={d > 0 ? 'M1 9 L11 9 L6 3 Z' : 'M1 3 L11 3 L6 9 Z'} />
                          </svg>
                        )}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {r.length === 0 && (
              <tr>
                <td className="cv-td" colSpan={head.length}>
                  Aucune donnée.
                </td>
              </tr>
            )}
            {r.map((row, i) => (
              <tr
                key={i}
                className={onRow ? 'cv-row-link' : undefined}
                onClick={onRow ? () => onRow(row) : undefined}
              >
                <td className="cv-td">{D(row[0])}</td>
                <td className="cv-td">{row[1]}</td>
                <td className="cv-td cv-money">{E(row[2])}</td>
                {adv && (
                  <td className="cv-td">
                    <span className="tag">Comptabilisée</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cv-scroll-edge cv-scroll-edge--bottom" hidden={!edge.bottom}>
        <button type="button" onClick={() => jump(190)} aria-label="Voir les opérations plus anciennes">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export const upl = (p, E) =>
  tb(
    ['Date', 'Libellé', 'Type', 'Montant', 'Statut'],
    p.up.map(u => [D(u[0]), u[1], u[2], E(u[3]), <span className="tag">{u[4]}</span>])
  )

/* Custom dropdown: a native <select> popup cannot be styled, so the options are
   rendered in the app's own menu (rounded white panel, pill highlight). */
export function Sel({ id, value, onChange, children, className = '', ariaLabel }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const opts = Children.toArray(children)
    .filter(c => isValidElement(c) && c.type === 'option')
    .map(c => ({ v: String(c.props.value ?? ''), t: c.props.children }))
  const cur = opts.find(o => o.v === String(value))

  useEffect(() => {
    if (!open) return
    const away = e => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    const esc = e => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div className={`sel${open ? ' open' : ''}${className ? ' ' + className : ''}`} ref={box}>
      <button
        type="button"
        id={id}
        className="sel-btn"
        aria-haspopup="listbox"
        aria-expanded={String(open)}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
      >
        <span className="sel-val">{cur ? cur.t : ''}</span>
        <svg className="sel-chev" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="sel-menu" role="listbox" aria-labelledby={id}>
          {opts.map(o => (
            <button
              key={o.v}
              type="button"
              role="option"
              aria-selected={String(o.v === String(value))}
              className={o.v === String(value) ? 'on' : ''}
              onClick={() => {
                onChange(o.v)
                setOpen(false)
              }}
            >
              {o.t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
