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
export function OpsTable({ rows, sort, onSort, E, onRow, adv = false, variant }) {
  const [c, d] = sort
  const scheduled = variant === 'scheduled'
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
  /* Scheduled transfers add a Type column before the amount and the row status.
     Amount keeps the shared sort id 2 so switching pages never leaves a stale column. */
  const cols = scheduled
    ? [
        { label: 'Date opération', short: 'Date', sort: 0, value: r => r[0], cell: r => D(r[0]) },
        { label: 'Libellé', sort: 1, value: r => r[1], cell: r => r[1] },
        { label: 'Type', cell: r => r[2] },
        { label: 'Montant', sort: 2, value: r => r[3], money: true, cell: r => E(r[3]) },
        { label: 'Statut', cell: r => <span className="tag">{r[4]}</span> }
      ]
    : [
        { label: 'Date opération', short: 'Date', sort: 0, value: r => r[0], cell: r => D(r[0]) },
        { label: 'Libellé', sort: 1, value: r => r[1], cell: r => r[1] },
        { label: 'Montant', sort: 2, value: r => r[2], money: true, cell: r => E(r[2]) },
        ...(adv ? [{ label: 'Statut', cell: () => <span className="tag">Comptabilisée</span> }] : [])
      ]
  const sorter = cols.find(col => col.sort === c)
  const r = [...rows].sort((x, y) => {
    const a = sorter ? sorter.value(x) : x[c]
    const b = sorter ? sorter.value(y) : y[c]
    return (a > b ? 1 : a < b ? -1 : 0) * d
  })
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
        aria-label={scheduled ? 'Liste défilante des opérations à venir' : 'Historique défilant des opérations'}
      >
        <table
          className={
            'cv-transaction-table' +
            (adv ? ' cv-transaction-table--adv' : '') +
            (scheduled ? ' cv-transaction-table--sched' : '')
          }
        >
          <caption className="cv-sr-only">
            {scheduled ? 'Virements et prélèvements à venir' : 'Historique des opérations du compte'}
          </caption>
          <thead>
            <tr>
              {cols.map((col, i) => {
                if (col.sort === undefined) {
                  return (
                    <th key={i} scope="col" className="cv-th">
                      {col.label}
                    </th>
                  )
                }
                const active = c === col.sort
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
                      onClick={() => onSort(col.sort)}
                      aria-label={`Trier par ${sortName(col.sort)}, ordre ${active && d > 0 ? 'décroissant' : 'croissant'}`}
                    >
                      <span className={'cv-sort-label' + (active ? ' is-active' : '')} aria-current={active ? 'true' : undefined}>
                        {col.short ? (
                          <>
                            <span className="cv-sort-label-wide">{col.label}</span>
                            <span className="cv-sort-label-narrow">{col.short}</span>
                          </>
                        ) : (
                          col.label
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
                <td className="cv-td" colSpan={cols.length}>
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
                {cols.map((col, j) => (
                  <td key={j} className={'cv-td' + (col.money ? ' cv-money' : '')}>
                    {col.cell(row)}
                  </td>
                ))}
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
