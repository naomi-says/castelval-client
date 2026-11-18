import { Fragment, useEffect, useRef, useState } from 'react'
import { P, NAV, SUBS, IC, TIP, EYE, EYX, COLLAPSE_IC, LOGOUT_IC, R, D, N, MAIL, MAIL_OBJ, RDV_OBJ, setLang } from './data'
import tr from './i18n'
import { Ic, kv, tb, Sel } from './ui'
import View from './views'
import { useBranding } from './branding'

/* Same initial state as init() in the original script */
const initState = () => ({
  p: 0,
  r: 'home',
  t: 0,
  ai: 0,
  sort: [0, -1],
  adv: false,
  hide: true,
  rev: false,
  nav: [],
  arr: true,
  sp: [0, 1],
  si: ['Castelval', 'Hors Castelval'],
  man: [],
  mi: -1,
  step: 0,
  tf: {},
  cx: 0,
  acts: {},
  lims: P.map(q => ({
    payment: [...((q.card && q.card.lims && q.card.lims.payment) || [5000, 10000, 15000])],
    withdrawal: [...((q.card && q.card.lims && q.card.lims.withdrawal) || [2000, 2000, 4000])]
  })),
  cs: { on: true, nfc: true, blk: false, opp: false },
  ben: P.map(x => x.b.map(b => [...b])),
  tog: { a: true, c: true, d: false, e: true, f: true, g: true, h: false },
  err: ''
})

/* dialogs that share the narrow frame and the demonstration footer */
const MID_KINDS = [
  'activate',
  'virtual',
  'mobilepay',
  'block',
  'unblock',
  'plim',
  'internet',
  'contactless',
  'assurances',
  'cassur',
  'cassist',
  'd-stm',
  'd-other',
  'd-send',
  'd-sign',
  'rib',
  'conn'
]

/* dialogs that carry their own divider and buttons */
const PLAIN_KINDS = ['pts', 'cbx', 'spend', 'msg', 'tel', 'rdv']

/* text preview of a message body, used in the sent and draft lists */
const cut = s => {
  const t = (s || '').replace(/\s+/g, ' ').trim()
  return t.length > 92 ? t.slice(0, 92).trimEnd() + '…' : t
}

export default function Portal({ onLogout }) {
  const brand = useBranding()
  const [S, setS] = useState(initState)
  const [dialog, setDialog] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const [menu, setMenu] = useState(false)
  const [sbOpen, setSbOpen] = useState(false)
  const [col, setCol] = useState(false)
  const [en, setEn] = useState(false)
  const [merr, setMerr] = useState('')
  const [plv, setPlv] = useState(0)
  const [docAcct, setDocAcct] = useState(0)
  const [rdvObj, setRdvObj] = useState('')
  const [avatar, setAvatar] = useState('')
  const [mail, setMail] = useState({
    tab: 0,
    view: 'list',
    open: null,
    q: '',
    obj: '',
    body: '',
    file: '',
    err: '',
    sent: [],
    drafts: []
  })

  const tf0 = useRef(null)
  const tf1 = useRef(null)
  const tf2 = useRef(null)
  const tf3 = useRef(null)
  const tf4 = useRef(null)
  const b1 = useRef(null)
  const b2 = useRef(null)
  const b3 = useRef(null)
  const b4 = useRef(null)
  const ml = useRef(null)
  const mm = useRef(null)
  const toastTimer = useRef(null)

  const refs = { tf0, tf1, tf2, tf3, tf4, b1, b2, b3, b4, ml, mm }

  /* amounts, dates and numbers follow the selected language */
  setLang(en ? 'en' : 'fr')

  const p = P[S.p]
  const E = n => (S.hide ? '••••• €' : R(n))

  /* up() == the original render(): any state change repaints and clears #err */
  const up = patch => setS(s => ({ ...s, err: '', ...patch }))
  const fail = msg => setS(s => ({ ...s, err: msg }))
  const top = () => window.scrollTo(0, 0)
  const toast = m => {
    setToastMsg(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600)
  }

  const A = {
    go(r, t, ai) {
      const patch = { r, t: t || 0, step: 0 }
      /* sections with a sidebar group open it; other pages close the groups */
      patch.nav = SUBS[r] ? [r] : []
      if (ai != null) patch.ai = ai
      up(patch)
      setSbOpen(false)
      top()
    },
    nav(k) {
      const open = S.nav.includes(k)
      up({ nav: open ? [] : [k], r: k, t: 0, step: 0 })
      setSbOpen(false)
      top()
    },
    navOnly(k) {
      const open = S.nav.includes(k)
      up({ nav: open ? S.nav.filter(x => x !== k) : [...S.nav, k] })
      setSbOpen(false)
    },
    loan(l) {
      setDialog({ kind: 'loan', l, tab: false })
    },
    ltab() {
      setDialog(d => (d && d.kind === 'loan' ? { ...d, tab: !d.tab } : d))
    },
    doc(kind) {
      setMerr('')
      setDocAcct(0)
      setDialog({ kind })
    },
    rib() {
      setDialog({ kind: 'rib' })
    },
    tab(i) {
      up({ t: i, step: 0 })
    },
    sel(key, v) {
      up({ [key]: +v })
    },
    tg() {
      up({ hide: !S.hide })
    },
    rev() {
      up({ rev: !S.rev })
    },
    pic(file) {
      if (!file) return
      if (!/^image\//.test(file.type)) return toast('Choisissez une image (JPG ou PNG).')
      const r = new FileReader()
      r.onload = () => {
        setAvatar(String(r.result))
        toast('Votre photo de profil a été mise à jour.')
      }
      r.readAsDataURL(file)
    },
    sort(c) {
      /* date and amount open newest / largest first; labels open A → Z */
      up({ sort: S.sort[0] === c ? [c, -S.sort[1]] : [c, c === 1 ? 1 : -1] })
    },
    op(row) {
      const l = p.loan.find(l => row[1].startsWith(l.n))
      setDialog(l ? { kind: 'loan', l, tab: false } : { kind: 'op', row })
    },
    adv(v) {
      up({ adv: v })
    },
    cx(v) {
      up({ cx: v })
    },
    block() {
      setDialog({ kind: S.cs.blk ? 'unblock' : 'block' })
    },
    block2() {
      up({ cs: { ...S.cs, blk: true } })
      setDialog(null)
      toast('Votre carte de démonstration est bloquée temporairement.')
    },
    unblock() {
      up({ cs: { ...S.cs, blk: false } })
      setDialog(null)
      toast('Votre carte est débloquée.')
    },
    opt(k) {
      setDialog({ kind: k })
    },
    opt2(k) {
      const key = k === 'internet' ? 'on' : 'nfc'
      up({ cs: { ...S.cs, [key]: !S.cs[key] } })
      setDialog(null)
      toast('La modification sera confirmée sur votre téléphone de confiance.')
    },
    plim(family, days) {
      setPlv(S.lims[S.p][family][days])
      setDialog({ kind: 'plim', family, days })
    },
    plimSave() {
      const max = dialog.family === 'payment' ? 15000 : 5000
      const v = Math.min(max, Math.max(0, Math.round(plv / 500) * 500))
      up({
        lims: S.lims.map((l, i) =>
          i === S.p ? { ...l, [dialog.family]: l[dialog.family].map((x, k) => (k === dialog.days ? v : x)) } : l
        )
      })
      setDialog(null)
      toast('Plafond de carte mis à jour.')
    },
    act() {
      up({ acts: { ...S.acts, [S.p]: true } })
      setDialog(null)
      toast('Votre carte est activée.')
    },
    say(m) {
      toast(m)
    },
    saveContact() {
      toast('Vos préférences de contact ont été enregistrées (démonstration).')
    },
    agg(key, vals) {
      up({ [key]: [...vals] })
    },
    chk(kind, val, checked) {
      const v = kind === 'sp' ? +val : val
      up({ [kind]: checked ? [...S[kind], v] : S[kind].filter(x => x !== v) })
    },
    tog(k, v) {
      up({ tog: { ...S.tog, [k]: v }, ...(k === 'b' ? { arr: v } : {}) })
    },
    cs(k, v) {
      up({ cs: { ...S.cs, [k]: v } })
    },
    open(kind) {
      setMerr('')
      setDialog({ kind })
    },
    modal(k) {
      setMerr('')
      if (k === 'msg') setMail(m => ({ ...m, tab: 0, view: 'list', open: null, q: '', err: '' }))
      if (k === 'rdv') setRdvObj('')
      setDialog({ kind: k })
    },
    close() {
      setDialog(null)
    },
    rdv(k) {
      setRdvObj(k)
    },
    mailTab(i) {
      setMail(m => ({ ...m, tab: i, view: 'list', open: null, err: '' }))
    },
    mailOpen(m) {
      setMail(x => ({ ...x, view: 'read', open: m }))
    },
    mailBack() {
      setMail(x => ({ ...x, view: 'list', open: null, err: '' }))
    },
    mailNew() {
      setMail(x => ({ ...x, view: 'new', open: null, obj: '', body: '', file: '', err: '' }))
    },
    mailReply() {
      if (!mail.open) return
      setMail(x => ({ ...x, view: 'new', obj: 'Réponse : ' + x.open.subject, body: '', file: '', err: '' }))
    },
    mailObj(v) {
      setMail(x => ({ ...x, obj: v }))
    },
    mailBody(e) {
      setMail(x => ({ ...x, body: e.target.value }))
    },
    mailQ(e) {
      setMail(x => ({ ...x, q: e.target.value }))
    },
    mailFile() {
      setMail(x => ({ ...x, file: x.file ? '' : 'Relevé_octobre_2026.pdf' }))
    },
    mailSave() {
      if (!mail.obj && !mail.body.trim()) {
        setMail(x => ({ ...x, err: 'Choisissez un objet ou saisissez votre message.' }))
        return
      }
      const d = new Date().toISOString().slice(0, 10)
      const entry = [d, 'Mon Conseiller', mail.obj || 'Sans objet', cut(mail.body), mail.body]
      setMail(x => ({
        ...x,
        drafts: [entry, ...x.drafts],
        view: 'list',
        tab: 2,
        obj: '',
        body: '',
        file: '',
        err: ''
      }))
      toast('Brouillon enregistré.')
    },
    mailSend() {
      if (!mail.obj || !mail.body.trim()) {
        setMail(x => ({ ...x, err: 'Choisissez un objet et saisissez votre message.' }))
        return
      }
      const d = new Date().toISOString().slice(0, 10)
      const entry = [d, 'Mon Conseiller', mail.obj, cut(mail.body), mail.body]
      setMail(x => ({
        ...x,
        sent: [entry, ...x.sent],
        view: 'list',
        tab: 1,
        obj: '',
        body: '',
        file: '',
        err: ''
      }))
      toast('Message envoyé (démonstration).')
    },
    exp() {
      toast('Export généré avec source, date, profil et périmètre (démonstration).')
    },
    stm() {
      toast('Relevé en cours de génération (démonstration).')
    },
    conn() {
      setDialog({ kind: 'conn' })
    },
    sub() {
      toast('Demande transmise : votre conseiller vous recontacte.')
    },
    lang() {
      setEn(v => !v)
    },
    colBtn() {
      setCol(c => !c)
    },
    mb() {
      setSbOpen(o => !o)
    },
    sw(i) {
      up({ p: i, r: 'home', t: 0, ai: 0, step: 0, tf: {}, cx: 0 })
      top()
    },
    tfs() {
      up({ tf: { d: S.ai }, r: 'virements', t: 0, step: 0, nav: ['virements'] })
      top()
    },
    tfAcc(v) {
      up({ tf: { ...S.tf, d: v } })
    },
    tfBen(v) {
      up({ tf: { ...S.tf, c: v } })
    },
    newtf() {
      up({ tf: {}, step: 0 })
    },
    back() {
      up({ step: S.step - 1 })
    },
    stepTo(i) {
      if (i < 0 || i > 4 || i === S.step) return
      const f = { ...S.tf }
      /* keep what was typed on the amount step when jumping ahead */
      if (S.step === 2) {
        if (refs.tf2.current) {
          const m = parseFloat(refs.tf2.current.value.replace(',', '.'))
          if (m > 0) f.m = m
        }
        if (refs.tf3.current && refs.tf3.current.value) f.dt = refs.tf3.current.value
        if (refs.tf4.current) f.mo = refs.tf4.current.value
      }
      const d = f.d !== undefined ? +f.d : 0
      const c = f.c || 'a' + (d === 0 ? 1 : 0)
      const tf = { ...f, d, c, dt: f.dt || '2026-10-15' }
      if (i >= 3 && tf.m === undefined) tf.m = 500
      up({ step: i, tf, err: '' })
    },
    next() {
      const f = S.tf
      if (S.step === 0) {
        const d = f.d !== undefined ? +f.d : 0
        up({ step: 1, tf: { ...f, d } })
      } else if (S.step === 1) {
        const c = f.c || 'a' + ((f.d || 0) === 0 ? 1 : 0)
        if (!c) {
          fail('Aucun compte à créditer : ajoutez d’abord un bénéficiaire vérifié.')
          return
        }
        up({ step: 2, tf: { ...f, c } })
      } else if (S.step === 2) {
        const m = parseFloat(tf2.current.value.replace(',', '.'))
        if (!(m > 0)) {
          fail('Saisissez un montant supérieur à zéro.')
          return
        }
        if (m > p.acc[f.d || 0][2]) {
          fail('Le montant dépasse le solde disponible.')
          return
        }
        if (m > 5000) {
          fail('Le montant dépasse le plafond par virement (5 000 €).')
          return
        }
        if (f.c && f.c[0] === 'b') {
          const b = S.ben[S.p].filter(x => x[4] === 'Vérifié')[f.c.slice(1)]
          if (b && b[5] != null && m > b[5]) {
            fail(`Le montant saisi dépasse le plafond de virement de ${b[0]}. Montant disponible : ${R(b[5])}.`)
            return
          }
        }
        up({ step: 3, tf: { ...f, m, dt: tf3.current.value, mo: tf4.current.value } })
      }
    },
    appr2() {
      const f = S.tf
      P[S.p].up.push([f.dt, 'Virement — ' + (f.mo || 'sans motif'), 'Virement', -f.m, 'En attente'])
      setDialog(null)
      up({ step: 4 })
    },
    bd(i) {
      setDialog({ kind: 'bd', b: S.ben[S.p][i] })
    },
    addb() {
      const v = i => refs[i].current.value.trim()
      const ib = v('b3').toUpperCase()
      if (!v('b1') || !v('b2') || !/^[A-Z]{2}\d{2}[A-Z0-9 ]{11,30}$/.test(ib)) {
        fail('Renseignez le titulaire, le nom usuel et un IBAN valide.')
        return
      }
      const entry = [v('b2'), v('b1'), ib, v('b4') || '—', 'En attente de vérification']
      up({
        ben: S.ben.map((arr, i) => (i === S.p ? [...arr, entry] : arr))
      })
      ;[b1, b2, b3, b4].forEach(r => {
        if (r.current) r.current.value = ''
      })
    },
    opp2() {
      up({ cs: { ...S.cs, opp: true } })
      setDialog(null)
    },
    upm2() {
      setDialog(null)
      toast('Demande transmise. Statut : en attente d’approbation.')
    },
    mand(k) {
      up({ man: S.man.filter((_, idx) => idx !== k) })
    },
    man(d) {
      const k = d.i != null ? +d.i : -1
      const x = k >= 0 ? S.man[k] : { p: S.p, c: d.c || 'fin', l: '', m: '' }
      /* opening a dialog does not repaint the main area in the original, so #err is kept */
      setS(s => ({ ...s, mi: k }))
      setMerr('')
      setDialog({ kind: 'man', k, x, p: x.p, c: x.f ? 'imm-p' : x.c })
    },
    manP(v) {
      setDialog(d => (d && d.kind === 'man' ? { ...d, p: +v } : d))
    },
    manC(v) {
      setDialog(d => (d && d.kind === 'man' ? { ...d, c: v } : d))
    },
    mans() {
      const q = +dialog.p
      const c = dialog.c
      const l = ml.current.value.trim()
      const m = parseFloat(mm.current.value.replace(',', '.'))
      const f1 = c === 'imm-p'
      if (!l || !(m > 0)) {
        setMerr('Renseignez un intitulé et un montant positif.')
        return
      }
      if (
        f1 &&
        P[q].t === 'Personne physique' &&
        (P[q].w.some(y => y[0] === 'Résidence principale') ||
          S.man.some((y, k) => y.p === q && y.f && k !== S.mi))
      ) {
        setMerr(
          'Une résidence principale est déjà déclarée pour ce profil : une seule est possible pour une personne physique.'
        )
        return
      }
      const it = { p: q, c: f1 ? 'imm' : c, f: f1, l, m, i: 'Hors Castelval' }
      up({ man: S.mi < 0 ? [...S.man, it] : S.man.map((y, k) => (k === S.mi ? it : y)) })
      setDialog(null)
      setMerr('')
    }
  }

  /* tooltips: identical rules to tips() in the original script */
  useEffect(() => {
    const root = document.getElementById('app')
    if (!root) return
    root.querySelectorAll('button').forEach(b => {
      const k = (
        b.dataset.fr ||
        [...b.childNodes]
          .map(n => (n.nodeType === 3 || n.tagName === 'SPAN' ? n.textContent : ''))
          .join('')
      )
        .trim()
        .replace(/\s+\d+$/, '')
      const inSn = !!b.closest('#sn')
      b.title = (en ? TIP[k] : inSn ? k : '') || ''
    })
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    return () => clearTimeout(toastTimer.current)
  }, [])

  /* mobile drawer: scroll lock behind the scrim and Escape to close */
  useEffect(() => {
    document.body.classList.toggle('sb-lock', sbOpen)
    if (!sbOpen) return
    const esc = e => {
      if (e.key === 'Escape') setSbOpen(false)
    }
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.classList.remove('sb-lock')
    }
  }, [sbOpen])

  /* widening to the desktop layout dismisses the drawer */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 992px)')
    const sync = () => mq.matches && setSbOpen(false)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const x = { S, p, E, A, err: S.err, refs, en, rev: S.rev, avatar }

  const dialogBody = () => {
    const spec = dialog
    switch (spec.kind) {
      case 'msg': {
        const md = d =>
          new Date(d).toLocaleDateString(en ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        const sim = <p className="mail-sim">Simulation. Aucun message réel n’est envoyé.</p>

        if (mail.view === 'read' && mail.open) {
          const m = mail.open
          return (
            <>
              <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
              <div className="mail-top">
                <h3>{m.subject}</h3>
                <button className="mail-out" onClick={A.mailReply}>
                  Répondre
                </button>
              </div>
              <div className="mail-meta">
                <div>
                  <span>Date</span>
                  <b>{md(m.date)}</b>
                </div>
                <div>
                  <span>De</span>
                  <b>{m.from}</b>
                </div>
                <div>
                  <span>Objet</span>
                  <b>{m.subject}</b>
                </div>
              </div>
              <p className="mail-body">{m.body}</p>
              <button className="mail-out" onClick={A.mailBack}>
                Retour aux messages
              </button>
              {sim}
            </>
          )
        }

        if (mail.view === 'new') {
          const opts = mail.obj && !MAIL_OBJ.includes(mail.obj) ? [mail.obj, ...MAIL_OBJ] : MAIL_OBJ
          return (
            <>
              <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
              <h3>Nouveau message</h3>
              <label className="dlg-label" htmlFor="mobj">
                Objet du message
              </label>
              <Sel id="mobj" value={mail.obj} onChange={A.mailObj}>
                <option value="">Choisir un objet</option>
                {opts.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Sel>
              <div className="mail-file">
                <button className="mail-out" onClick={A.mailFile}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 6" />
                  </svg>
                  Joindre un document
                </button>
                {mail.file && (
                  <span className="mail-att">
                    <b>{mail.file}</b>
                    <button aria-label="Retirer la pièce jointe" onClick={A.mailFile}>
                      ×
                    </button>
                  </span>
                )}
              </div>
              <label className="dlg-label" htmlFor="mbody">
                Votre message
              </label>
              <textarea id="mbody" className="mail-text" value={mail.body} onChange={A.mailBody} />
              {mail.err && (
                <p className="neg" role="alert">
                  {mail.err}
                </p>
              )}
              <div className="mail-acts">
                <button className="mail-out" onClick={A.mailBack}>
                  Retour
                </button>
                <button className="mail-out" onClick={A.mailSave}>
                  Enregistrer le brouillon
                </button>
                <button className="mail-send" onClick={A.mailSend}>
                  Envoyer
                </button>
              </div>
              {sim}
            </>
          )
        }

        const src = mail.tab === 0 ? MAIL : mail.tab === 1 ? mail.sent : mail.drafts
        const q = mail.q.trim().toLowerCase()
        const rows = src
          .map((m, i) => ({ k: i, date: m[0], from: m[1], subject: m[2], preview: m[3], body: m[4] }))
          .filter(m => !q || [md(m.date), m.from, m.subject, m.preview].join(' ').toLowerCase().includes(q))
        const empty = q
          ? 'Aucun message ne correspond à votre recherche.'
          : mail.tab === 0
          ? 'Aucun message reçu.'
          : mail.tab === 1
          ? 'Aucun message envoyé.'
          : 'Aucun brouillon.'

        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <div className="mail-top">
              <h3>Ma messagerie</h3>
              <button className="mail-new" onClick={A.mailNew}>
                Nouveau message
              </button>
            </div>
            <div className="mail-tabs" role="tablist">
              {['Reçu', 'Envoyé', 'Brouillon'].map((t, i) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={String(mail.tab === i)}
                  className={mail.tab === i ? 'on' : ''}
                  onClick={() => A.mailTab(i)}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              className="mail-search"
              type="search"
              placeholder="Rechercher des messages"
              aria-label="Rechercher des messages"
              value={mail.q}
              onChange={A.mailQ}
            />
            {rows.length === 0 ? (
              <p className="mail-empty">{empty}</p>
            ) : (
              <>
                <div className="mail-head" aria-hidden="true">
                  <span>Date ↓</span>
                  <span>{mail.tab === 0 ? 'De' : 'À'}</span>
                  <span>Objet</span>
                </div>
                <div className="mail-list">
                  {rows.map(m => (
                    <button className="mail-row" key={m.k} onClick={() => A.mailOpen(m)}>
                      <span className="mail-date">{md(m.date)}</span>
                      <span className="mail-from">{m.from}</span>
                      <span className="mail-sub">
                        <b>{m.subject}</b>
                        <small>{m.preview}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {sim}
          </>
        )
      }
      case 'tel':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Nous contacter</h3>
            <div className="ct-grid">
              {[
                {
                  h: 'Castelval',
                  n: 'Mme Laurence MARTIN',
                  a: ['18 rue Vignon', '75009 Paris'],
                  t: '01 400 600 21'
                },
                {
                  h: 'Mon conseiller',
                  n: 'Mme Jeanne DURAND · Capital Conseil',
                  a: ['24 rue du Conseil', '75008 Paris'],
                  note: 'Adresse fictive de démonstration',
                  t: '06 01 02 03 04'
                }
              ].map(c => (
                <div className="ct-card" key={c.h}>
                  <h4>{c.h}</h4>
                  <p className="ct-name">{c.n}</p>
                  <p className="ct-adr">
                    {c.a.map(l => (
                      <span key={l}>{l}</span>
                    ))}
                    {c.note && <span className="ct-note">{c.note}</span>}
                  </p>
                  <p className="ct-tel">{c.t}</p>
                  <div className="ct-sec">Appel sécurisé dans l’application</div>
                  <div className="ct-acts">
                    <button
                      aria-label={`Appeler ${c.t}`}
                      onClick={() => A.say('Cette démonstration ne prend pas en charge les appels.')}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />
                      </svg>
                    </button>
                    <button
                      aria-label={`Visioconférence avec ${c.n}`}
                      onClick={() => A.say('Cette démonstration ne prend pas en charge les visioconférences.')}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="6" width="12" height="12" rx="2" />
                        <path d="M15 10l6-3v10l-6-3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="ct-foot">Cette démonstration ne prend pas en charge les appels.</p>
            <p className="ct-demo">Démonstration</p>
          </>
        )
      case 'rdv':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Prendre rendez-vous</h3>
            <label className="dlg-label rdv-label" htmlFor="rdvobj">
              Objet du RDV
            </label>
            <Sel id="rdvobj" className="rdv-select" value={rdvObj} onChange={A.rdv}>
              <option value="">Choisir un objet</option>
              {RDV_OBJ.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Sel>
            <p className="rdv-sim">Simulation. Aucun rendez-vous réel n’est réservé.</p>
          </>
        )
      case 'profile':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Changer de profil</h3>
            <p>Choisissez l’espace que vous souhaitez consulter.</p>
            <div className="popts">
              {P.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === S.p ? 'popt on' : 'popt'}
                  onClick={() => {
                    A.close()
                    A.sw(i)
                  }}
                >
                  <b>{q.n}</b>
                  <small>
                    {q.t === 'Personne physique' ? 'Mon espace personnel' : 'Espace de la holding · Procuration'}
                  </small>
                </button>
              ))}
            </div>
            <p className="pcur">{p.n} · Espace actuel</p>
            <button className="pret" type="button" onClick={A.close}>
              Retour
            </button>
          </>
        )
      case 'loan': {
        const l = spec.l
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Détail du crédit</h3>
            <div className="dlg-card">
              <div className="lhead">
                <div>
                  <h4>{l.n}</h4>
                  <p>{p.n}</p>
                  <p>
                    Montant emprunté : <b>{R(l.principal || 0)}</b>
                  </p>
                  <p>Prochaine échéance : {l.next ? D(l.next) : '—'}</p>
                  <p>
                    Montant de l’échéance : <b>{R(l.mens)}</b>
                  </p>
                </div>
                <div className="lcap">
                  <span>Capital restant dû</span>
                  <b>{E(l.cap)}</b>
                </div>
              </div>
            </div>
            <div className="acts ldc">
              <button onClick={A.exp}>Télécharger le tableau d’amortissement</button>
              <button onClick={A.ltab}>{spec.tab ? 'Masquer le tableau' : 'Consulter le tableau'}</button>
            </div>
            <div className="dlg-card">
              <h4>Remboursement</h4>
              {kv([
                ['Taux fixe', String(l.rate).replace('.', ',') + ' %'],
                ['Capital déjà remboursé', E((l.principal || 0) - l.cap)],
                ['Périodicité', 'Mensuelle'],
                ['Échéances remboursées', (l.paid || 0) + ' / ' + ((l.paid || 0) + l.m)]
              ])}
            </div>
            <div className="dlg-card">
              <h4>Caractéristiques</h4>
              {kv([
                ['Type', l.n],
                ['Compte de prélèvement', p.n + ' · ' + (l.account || 'Compte de paiement')],
                ['IBAN', p.acc[0][1]],
                ['Durée totale', (l.paid || 0) + l.m + ' mois'],
                ['Date de début', l.start ? D(l.start) : '—'],
                ['Date de fin', l.end ? D(l.end) : '—']
              ])}
            </div>
            {spec.tab && (
              <div className="dlg-card">
                <h4>Tableau d’amortissement</h4>
                {tb(
                  ['Échéance', 'Intérêts', 'Capital', 'Capital restant dû'],
                  (() => {
                    let c = l.cap
                    return [1, 2, 3, 4, 5, 6].map(i => {
                      const it = (c * l.rate) / 1200
                      const pr = l.mens - it
                      c -= pr
                      return [i, E(it), E(pr), E(c)]
                    })
                  })()
                )}
              </div>
            )}
            <button className="gbtn gbtn-dark" onClick={A.upm2}>
              Gérer le prélèvement
            </button>
            <small>Mensualités hors assurance. Capital restant dû après l’échéance du 12 octobre 2026. Données fictives.</small>
          </>
        )
      }
      case 'op':
        return (
          <>
            <h3>Détail de l’opération</h3>
            {kv([
              ['Date', D(spec.row[0])],
              ['Libellé', spec.row[1]],
              ['Montant', E(spec.row[2])],
              ['Statut', 'Comptabilisée'],
              ['Source', 'Système Castelval · 14/10/2026']
            ])}
          </>
        )
      case 'lim':
        return (
          <>
            <h3>Modifier un plafond</h3>
            <p>Toute modification de plafond demande une validation forte. Règles de hausse et de baisse : à définir.</p>
          </>
        )
      case 'opp':
        return (
          <>
            <h3>Faire opposition</h3>
            <p>La carte sera définitivement bloquée et remplacée.</p>
            <button className="btn cta" style={{ width: 'auto' }} onClick={A.opp2}>
              Confirmer l’opposition
            </button>
          </>
        )
      case 'appr3':
        return (
          <>
            <h3>Validation sur votre téléphone de confiance</h3>
            <p>Parcours de référence : aucune notification réelle n’est envoyée.</p>
          </>
        )
      case 'appr':
        return (
          <>
            <h3>Validation sur votre téléphone de confiance</h3>
            <p>Parcours de référence : aucune notification réelle n’est envoyée.</p>
            <button className="btn cta" style={{ width: 'auto' }} onClick={A.appr2}>
              J’ai validé (simulation)
            </button>
          </>
        )
      case 'bd':
        return (
          <>
            <h3>{spec.b[0]}</h3>
            {kv([
              ['Titulaire', spec.b[1]],
              ['IBAN', spec.b[2]],
              ['BIC', spec.b[3]],
              ['Plafond de virement', spec.b[5] == null ? 'Sans limite' : R(spec.b[5])],
              ['Statut', spec.b[4]]
            ])}
            <small>Bénéficiaire fictif. Aucune coordonnée bancaire réelle n’est utilisée.</small>
          </>
        )
      case 'upm':
        return (
          <>
            <h3>Gérer un élément à venir</h3>
            <p>
              Suspendre, modifier ou annuler : la demande prend effet après approbation et sera confirmée par un
              statut.
            </p>
            <button className="btn cta" style={{ width: 'auto' }} onClick={A.upm2}>
              Envoyer la demande
            </button>
          </>
        )
      case 'man':
        return (
          <>
            <h3>{spec.k < 0 ? 'Ajouter' : 'Modifier'} un élément déclaré</h3>
            <label htmlFor="mp">Profil</label>
            <Sel id="mp" value={spec.p} onChange={A.manP}>
              {P.map((q, i) => (
                <option key={i} value={i}>
                  {q.n}
                </option>
              ))}
            </Sel>
            <label htmlFor="mc">Catégorie</label>
            <Sel id="mc" value={spec.c} onChange={A.manC}>
              {[
                ['fin', 'Avoir financier géré ailleurs'],
                ['imm-p', 'Résidence principale'],
                ['imm', 'Autre bien immobilier'],
                ['autre', 'Autre actif'],
                ['dette', 'Crédit externe']
              ].map(o => (
                <option key={o[0]} value={o[0]}>
                  {o[1]}
                </option>
              ))}
            </Sel>
            <label htmlFor="ml">Intitulé</label>
            <input id="ml" ref={ml} defaultValue={spec.x.l} />
            <label htmlFor="mm">Montant (€)</label>
            <input id="mm" ref={mm} inputMode="decimal" defaultValue={spec.x.m} />
            <p id="merr" className="neg" role="alert">
              {merr}
            </p>
            <button className="btn cta" style={{ width: 'auto' }} onClick={A.mans}>
              Enregistrer
            </button>
          </>
        )
      case 'block':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Confirmation blocage carte</h3>
            <p>
              Pour des raisons de sécurité, <b>le déblocage de votre carte s’effectue sur votre téléphone de
              confiance</b> ou avec l’aide de votre conseiller.
            </p>
            <p>
              Souhaitez-vous bloquer temporairement votre carte <b>{p.card.num || '•••• 1842'}</b> ?
            </p>
            <div className="dlg-act2">
              <button onClick={A.close}>Annuler</button>
              <button className="prm" onClick={A.block2}>
                Continuer
              </button>
            </div>
          </>
        )
      case 'unblock':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Débloquer ma carte</h3>
            <p>
              Pour des raisons de sécurité, <b>le déblocage de votre carte s’effectue sur votre téléphone de
              confiance</b> ou avec l’aide de votre conseiller.
            </p>
            <p>Parcours de référence : aucune notification réelle n’est envoyée.</p>
            <div className="dlg-act2">
              <button onClick={A.close}>Annuler</button>
              <button className="prm" onClick={A.unblock}>
                Débloquer ma carte
              </button>
            </div>
          </>
        )
      case 'plim': {
        const pay = spec.family === 'payment'
        const max = pay ? 15000 : 5000
        const period = ['1 jour', '7 jours', '30 jours'][spec.days]
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Modifier mon {pay ? 'plafond de paiement' : 'plafond de retrait'} · {period}</h3>
            <label htmlFor="pl">Choisir mon plafond</label>
            <input
              id="pl"
              type="range"
              min="0"
              max={max}
              step="500"
              value={plv}
              onChange={e => setPlv(+e.target.value)}
            />
            <div className="rng-cap">
              <span>0 €</span>
              <span>{N(max)} €</span>
            </div>
            <label htmlFor="plv">Montant du plafond, en euros (par pas de 500 €)</label>
            <input
              id="plv"
              type="number"
              min="0"
              max={max}
              step="500"
              value={plv}
              onChange={e => setPlv(+e.target.value)}
            />
            <div className="dlg-act2">
              <button onClick={A.close}>Quitter sans modifier</button>
              <button className="prm" onClick={A.plimSave}>
                Modifier le plafond
              </button>
            </div>
          </>
        )
      }
      case 'internet':
      case 'contactless': {
        const on = spec.kind === 'internet' ? S.cs.on : S.cs.nfc
        const label = spec.kind === 'internet' ? 'Paiement Internet' : 'Paiement sans contact'
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>{label}</h3>
            <p>
              {spec.kind === 'internet'
                ? 'Autorisez les paiements sur Internet avec votre carte.'
                : 'Autorisez le paiement sans contact avec votre carte.'}
            </p>
            {kv([['État actuel', on ? 'Activé' : 'Non activé']])}
            <p className="dlg-note">La modification sera confirmée sur votre téléphone de confiance.</p>
            <div className="dlg-act2">
              <button onClick={A.close}>Annuler</button>
              <button className="prm" onClick={() => A.opt2(spec.kind)}>
                {on ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </>
        )
      }
      case 'activate':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Activer ma carte</h3>
            <p>
              Activez votre carte Castelval {p.card.num || '•••• 1842'} pour retrouver vos services.
            </p>
            <div className="dlg-act2">
              <button onClick={A.close}>Annuler</button>
              <button onClick={A.act}>Activer ma carte</button>
            </div>
          </>
        )
      case 'virtual':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Carte de paiement virtuelle</h3>
            {kv([
              ['Carte associée', `Castelval · Visa ${p.card.num || '•••• 1842'}`],
              ['Numéro virtuel', '•••• •••• •••• 4421']
            ])}
            <p className="dlg-note">
              Carte virtuelle d’exemple. Ses coordonnées ne permettent pas d’effectuer un paiement.
            </p>
          </>
        )
      case 'mobilepay':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Paiement mobile</h3>
            <p>
              Ajoutez votre carte à votre portefeuille Apple Pay ou Google Pay depuis votre téléphone compatible.
            </p>
            {kv([['Carte', p.card.num || '•••• 1842']])}
            <p className="dlg-note">
              Cette page présente le service. Aucune carte n’est ajoutée à un portefeuille réel dans la démonstration.
            </p>
          </>
        )
      case 'assurances':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Mes assurances</h3>
            <div className="dlg-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12a9 9 0 0 1 18 0z" />
                <path d="M12 12v6a2 2 0 0 0 4 0" />
              </svg>
              <b>Aucun contrat à afficher</b>
              <p>Aucun contrat d’assurance n’est associé à ce profil de démonstration.</p>
            </div>
          </>
        )
      case 'pts':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Comment gagner des Points Castelval</h3>
            <p>Les Points Castelval récompensent votre fidélité.</p>
            <div className="kv-soft">
              {kv([
                ['Votre abonnement mensuel', '90 Points Castelval chaque mois'],
                ['1 € sur votre compte', '1 Point Castelval chaque mois'],
                ['10 € sur votre épargne', '1 Point Castelval chaque mois']
              ])}
            </div>
            <div className="dlg-foot">
              <button onClick={A.close}>Fermer</button>
            </div>
          </>
        )
      case 'cbx':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Transformer mes Points Castelval en Cashback</h3>
            <p>
              Il vous suffit d’utiliser votre carte. Selon le niveau de vos dépenses et votre niveau de Points
              Castelval, vous bénéficiez d’un niveau de cashback sous forme de Cashback de 0,2 %, 0,5 % ou 1 % de vos
              dépenses, dans certaines limites.
            </p>
            <button className="lnk" onClick={() => A.modal('pts')}>
              Détail
            </button>
            <div className="dlg-foot">
              <button onClick={A.close}>Fermer</button>
            </div>
          </>
        )
      case 'spend':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Dépenser mon Cashback</h3>
            <div className="dlg-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 7.8h.01" />
              </svg>
              <b>En construction</b>
              <p>Cette page sera ajoutée dans une prochaine version.</p>
            </div>
            <div className="cb-center">
              <button onClick={A.close}>Retour aux avantages carte</button>
            </div>
            <div className="dlg-foot">
              <button onClick={A.close}>Fermer</button>
            </div>
          </>
        )
      case 'cassur':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Mes assurances</h3>
            {kv([
              ['Carte', `Castelval · Visa ${(p.card && p.card.num) || '•••• 1842'}`],
              ['Titulaire', (p.card && p.card.holder) || p.n]
            ])}
            <p style={{ marginTop: 14 }}>
              Retrouvez ici les informations relatives aux assurances de votre carte.
            </p>
            <button className="gbtn" onClick={() => A.say('Déclaration de sinistre : service de démonstration.')}>
              Déclarer un sinistre
            </button>
          </>
        )
      case 'cassist':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Mon assistance</h3>
            {kv([
              ['Carte', `Castelval · Visa ${(p.card && p.card.num) || '•••• 1842'}`],
              ['Titulaire', (p.card && p.card.holder) || p.n]
            ])}
            <p className="dlg-note">
              Aperçu du point d’accès à l’attestation. Aucun document d’assurance réel n’est émis par la démonstration.
            </p>
          </>
        )
      case 'd-stm': {
        const sel = p.acc[docAcct] || p.acc[0]
        const stms = p.doc.filter(d => d[0] === sel[0])
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Mes relevés de compte</h3>
            <label className="dlg-label" htmlFor="dacct">
              Compte à consulter
            </label>
            <Sel id="dacct" value={docAcct} onChange={v => setDocAcct(+v)}>
              {p.acc.map((a, i) => (
                <option key={i} value={i}>
                  {a[0] === 'Compte de paiement' ? 'Mon compte de paiement' : a[0]} · {p.n}
                </option>
              ))}
            </Sel>
            <button className="prmbtn stm-print" onClick={A.stm}>
              Imprimer un relevé à aujourd’hui
            </button>
            <div className="stm-list">
              {stms.length === 0 ? (
                <p className="stm-empty">Aucun relevé disponible pour ce compte.</p>
              ) : (
                stms.map((d, i) => (
                  <div className="stm-item" key={i}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 3h7l5 5v13H7zM14 3v5h5" />
                    </svg>
                    <span className="stm-t">
                      <b>{d[1]}</b>
                      <small>{d[0]}</small>
                      <small>{p.n}</small>
                    </span>
                    <button className="stm-pdf" onClick={A.stm}>
                      Télécharger le PDF
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )
      }
      case 'd-other':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Autres documents à disposition</h3>
            <div className="other-row">
              <span>Relevé d’identité bancaire</span>
              <button className="lnk" onClick={A.rib}>
                Consulter
              </button>
            </div>
          </>
        )
      case 'rib':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Relevé d’identité bancaire</h3>
            {kv([
              ['Titulaire', p.n],
              ['IBAN', p.acc[0][1]],
              ['BIC', 'Non renseigné']
            ])}
            <p className="dlg-note">
              Document de démonstration. Ces coordonnées ne permettent aucun virement réel.
            </p>
          </>
        )
      case 'd-send':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Mes documents</h3>
            <div className="dlg-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7h6l2 2h10v11H3z" />
              </svg>
              <b>Votre dossier est à jour</b>
              <p>Aucun document n’est demandé dans ce profil de démonstration.</p>
            </div>
          </>
        )
      case 'd-sign':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Mes contrats</h3>
            <div className="dlg-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3h7l5 5v13H7zM14 3v5h5" />
              </svg>
              <b>Aucune signature en attente</b>
              <p>Vous retrouverez ici les documents nécessitant votre signature.</p>
            </div>
          </>
        )
      case 'code':
        return (
          <>
            <h3>Mon code de carte</h3>
            <p>
              Code de démonstration · carte •••• 1842
            </p>
            <p className="big">1234</p>
            <small>Ce code est fictif et n’est associé à aucune carte réelle.</small>
          </>
        )
      case 'viewcard':
        return (
          <>
            <h3>Voir ma carte</h3>
            {kv([
              ['Titulaire', p.n],
              ['Numéro de démonstration', '0000 0000 0000 1842'],
              ['Date d’expiration', '10/29'],
              ['Cryptogramme de démonstration', '000']
            ])}
            <small>Ces coordonnées sont fictives et ne permettent aucun paiement.</small>
          </>
        )
      case 'conn':
        return (
          <>
            <small className="eyebrow">VOTRE ESPACE CASTELVAL</small>
            <h3>Mes dernières connexions</h3>
            <div className="conn-list">
              {[
                ['6 octobre 2026 à 18:10', 'Navigateur web · Session de démonstration'],
                ['5 octobre 2026 à 15:43', 'Navigateur web · Connexion d’exemple']
              ].map(([d, w]) => (
                <div className="conn-row" key={d}>
                  <span>{d}</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </>
        )
      case 'faq':
        return (
          <>
            <h3>Questions fréquentes</h3>
            <p>
              <strong>Comment revenir à l’accueil ?</strong>
              <br />
              Sélectionnez « Accueil » dans le menu ou cliquez sur le logo Castelval.
            </p>
            <p>
              <strong>Comment parcourir les rubriques ?</strong>
              <br />
              Cliquez sur les menus pour déplier les sous-rubriques, puis sur un élément pour afficher son aperçu.
            </p>
            <p>
              <strong>Est-ce un compte réel ?</strong>
              <br />
              Non. Les actions et les informations servent uniquement à la démonstration.
            </p>
          </>
        )
      case 'legal':
      case 'demo':
        return (
          <>
            <h3>À propos de cette démonstration</h3>
            <p>
              Prototype statique de l’espace client Castelval. Les montants, contrats et opérations sont des exemples.
              Aucun service bancaire ou de paiement n’est exécuté.
            </p>
            <p>
              Les conditions contractuelles et mentions légales du futur service ne sont pas présentées dans ce
              prototype.
            </p>
          </>
        )
      case 'cookies':
        return (
          <>
            <h3>Confidentialité et préférences</h3>
            <p>
              Cette démonstration n’utilise aucun outil de mesure d’audience et n’envoie aucun identifiant saisi.
            </p>
            <p>
              Si vous cochez « Se souvenir de moi », seule cette préférence est enregistrée localement dans votre
              navigateur. Aucun mot de passe n’est demandé.
            </p>
          </>
        )
      case 'a11y':
        return (
          <>
            <h3>Accessibilité</h3>
            <p>
              La démonstration peut être parcourue au clavier. Utilisez Tabulation pour déplacer le focus, Entrée pour
              activer un bouton et Échap pour fermer une fenêtre.
            </p>
            <p>Sur mobile, ouvrez les rubriques à l’aide du bouton de menu en haut à droite.</p>
          </>
        )
      default:
        return null
    }
  }

  return tr(
    <>
      <div id="app" onClick={() => setMenu(false)}>
        <header className="ah">
          <button id="mb" aria-label="Ouvrir le menu" onClick={A.mb}>
            ☰
          </button>
          <div className="brand">
            {brand.showLogo && <img src={brand.logoSrc} alt="" />}
            {brand.showName && <span>{brand.name}</span>}
          </div>
          <button className="hm" onClick={() => A.modal('msg')}>
            Messages <i>1</i>
          </button>
          <button className="hm" onClick={() => A.modal('tel')}>
            Téléphone
          </button>
          <button className="hm" onClick={() => A.modal('rdv')}>
            Rendez-vous
          </button>
          <button
            id="eye"
            aria-label={S.hide ? 'Afficher les montants' : 'Masquer les montants'}
            aria-pressed={String(!S.hide)}
            onClick={A.tg}
          >
            <Ic d={S.hide ? EYE : EYX} />
          </button>
          <div className="pm">
            <button
              id="pb"
              aria-haspopup="true"
              onClick={e => {
                e.stopPropagation()
                setMenu(m => !m)
              }}
            >
              <span id="pn">{p.n}</span>
              {' ▾'}
            </button>
            <div id="pmenu" className={menu ? '' : 'hide'}>
              <button onClick={() => A.go('profil')}>Mon profil</button>
              <button onClick={() => A.modal('profile')}>Changer de profil</button>
              <button onClick={() => A.go('param')}>Paramètres</button>
              <button onClick={onLogout}>Déconnexion</button>
            </div>
          </div>
        </header>

        <div className={`ab${col ? ' col' : ''}`}>
          <div id="sb" className={sbOpen ? 'open' : ''}>
            <button
              id="col"
              className="tog"
              aria-label={col ? 'Développer le menu' : 'Réduire le menu'}
              aria-expanded={String(!col)}
              onClick={A.colBtn}
            >
              <Ic d={COLLAPSE_IC} />
            </button>
            <div id="sn">
              {NAV.map(([k, label]) => {
                if (k === 'assurances') {
                  return (
                    <button key={k} onClick={() => A.modal('assurances')}>
                      <Ic d={IC[k]} />
                      <span>{label}</span>
                    </button>
                  )
                }
                const subs = SUBS[k]
                const open = !!subs && S.nav.includes(k)
                return (
                  <Fragment key={k}>
                    <button
                      className={S.r === k || open ? 'on' : ''}
                      aria-expanded={subs ? String(open) : undefined}
                      onClick={() => (subs ? A.nav(k) : A.go(k))}
                    >
                      <Ic d={IC[k]} />
                      <span>{label}</span>
                      {subs && (
                        <svg className={open ? 'chev up' : 'chev'} viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      )}
                    </button>
                    {open && (
                      <div className="sub">
                        {subs.map(([sl, st, hint]) => {
                          /* "Mes autres comptes" opens the space dialog: that row is the
                             current one while the dialog is up, instead of its tab */
                          const spaces = !!dialog && dialog.kind === 'profile'
                          const on =
                            typeof st === 'number'
                              ? S.r === k && S.t === st && !spaces
                              : st === 'structures' && spaces
                          return (
                            <button
                              key={sl}
                              className={on ? 'subon' : ''}
                              aria-current={on ? 'page' : undefined}
                              onClick={() =>
                                typeof st === 'number'
                                  ? A.go(k, st)
                                  : st === 'structures'
                                  ? A.modal('profile')
                                  : st.indexOf('d-') === 0
                                  ? A.doc(st)
                                  : A.go(st)
                              }
                            >
                              <span>
                                {sl}
                                {hint && <small>{hint}</small>}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </Fragment>
                )
              })}
              {[
                ['msg', 'Messages'],
                ['tel', 'Téléphone'],
                ['rdv', 'Rendez-vous']
              ].map(([k, label]) => (
                <button key={k} className="ms" onClick={() => A.modal(k)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="sf2">
              <button className="lb" onClick={A.lang}>
                {en ? 'Français' : 'English'}
              </button>
              <button id="out2" onClick={onLogout}>
                <Ic d={LOGOUT_IC} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
          {sbOpen && (
            <button
              type="button"
              className="sb-scrim"
              aria-label="Fermer le menu"
              onClick={() => setSbOpen(false)}
            />
          )}
          <div className="am" id="main">
            <View x={x} />
            <div className="af">
              <div className="af-links">
                <button onClick={() => A.modal('faq')}>FAQ</button>
                <button onClick={() => A.go('souscription')}>Notre offre</button>
                <button onClick={() => A.modal('tel')}>Nous contacter</button>
                <button onClick={() => A.modal('legal')}>Mentions légales</button>
                <button onClick={() => A.modal('cookies')}>Politique des cookies</button>
                <button onClick={() => A.modal('a11y')}>Accessibilité</button>
              </div>
              <div className="af-bottom">
                <span>© 2026 {brand.name}</span>
                <span>Votre espace client</span>
              </div>
            </div>
          </div>
        </div>

        <div id="dlg" className={dialog ? '' : 'hide'}>
          {dialog && (
            <div
              role="dialog"
              aria-modal="true"
              className={
                dialog.kind === 'profile'
                  ? 'wide'
                  : dialog.kind === 'loan'
                  ? 'wide loan'
                  : dialog.kind === 'msg'
                  ? 'wide mail'
                  : dialog.kind === 'tel'
                  ? 'wide contact'
                  : dialog.kind === 'rdv'
                  ? 'wide rdv'
                  : MID_KINDS.includes(dialog.kind)
                  ? 'mid'
                  : ''
              }
            >
              <button className="dx" aria-label="Fermer" onClick={A.close}>
                ×
              </button>
              {dialogBody()}
              {MID_KINDS.includes(dialog.kind) ? (
                <div className="dlg-foot">
                  <small>DÉMONSTRATION</small>
                  <button onClick={A.close}>Fermer</button>
                </div>
              ) : dialog.kind !== 'profile' && dialog.kind !== 'loan' && !PLAIN_KINDS.includes(dialog.kind) ? (
                <div className="acts">
                  <button onClick={A.close}>Fermer</button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </>,
    en
  )
}
