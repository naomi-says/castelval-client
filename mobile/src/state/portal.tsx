import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Beneficiary, MAIL, P, Profile, UpcomingRow, CardLims } from '../data/data'
import { Lang, makeFormatters, translate } from '../i18n'
import {
  MailItem, ManualItem, TransferDraft, buildManual, clampLimit, cut, inboxFrom, newBeneficiary, parseAmount,
  transferReference, validateBeneficiary, validateMail, validateManual, validateTransferAmount, LimitFamily,
  DEFAULT_EXEC_DATE, defaultCredit, creditOptions
} from '../services/rules'
import { kv } from '../services/storage'

/* The website keeps this in Portal's useState (initState()). Same shape here, plus what a
   phone needs to keep: form drafts survive navigation and app restarts. */

export interface CardState { on: boolean; nfc: boolean; blk: boolean; opp: boolean }
export interface Attachment { name: string; uri: string; size?: number; mime?: string }
export interface Compose { obj: string; body: string; file?: Attachment | null; replyTo?: string }

export interface PortalState {
  p: number
  hide: boolean
  rev: boolean
  avatar: string | null
  ai: number
  cx: number
  sp: number[]
  si: string[]
  man: ManualItem[]
  tog: Record<string, boolean>
  arr: boolean
  lims: CardLims[]
  cs: CardState[]
  acts: boolean[]
  ben: Beneficiary[][]
  up: UpcomingRow[][]
  tf: TransferDraft
  lastRef: string
  sent: MailItem[]
  drafts: MailItem[]
  read: number[]
  compose: Compose
  rdvObj: string
  transferCount: number
}

const initState = (): PortalState => ({
  p: 0,
  hide: true,
  rev: false,
  avatar: null,
  ai: 0,
  cx: 0,
  sp: [0, 1],
  si: ['Castelval', 'Hors Castelval'],
  man: [],
  tog: { a: true, c: true, d: false, e: true, f: true, g: true, h: false },
  arr: true,
  lims: P.map(q => ({
    payment: [...((q.card && q.card.lims && q.card.lims.payment) || [5000, 10000, 15000])],
    withdrawal: [...((q.card && q.card.lims && q.card.lims.withdrawal) || [2000, 2000, 4000])]
  })),
  cs: P.map(() => ({ on: true, nfc: true, blk: false, opp: false })),
  acts: P.map(() => false),
  ben: P.map(x => x.b.map(b => [...b] as Beneficiary)),
  up: P.map(x => x.up.map(u => [...u] as UpcomingRow)),
  tf: {},
  lastRef: '',
  sent: [],
  drafts: [],
  read: [],
  compose: { obj: '', body: '', file: null },
  rdvObj: '',
  transferCount: 0
})

const STATE_KEY = 'castelval.portal.v1'
const LANG_KEY = 'castelval.lang'
export const INBOX: MailItem[] = inboxFrom(MAIL)
/* The website shows "Messages 1": the welcome message is the unread one. */
const INITIAL_UNREAD = [0]

type Res = string | null // French error message, or null on success

interface Actions {
  reset(): void
  setLang(l: Lang): void
  toggleHide(): void
  toggleReveal(): void
  setAvatar(uri: string | null): void
  switchProfile(i: number): void
  setAccountIndex(i: number): void
  setCardSelector(i: number): void
  setTf(patch: Partial<TransferDraft>): void
  resetTf(): void
  validateTfAmount(raw: string): Res
  approveTransfer(): string
  addBeneficiary(holder: string, usual: string, iban: string, bic: string): Res
  saveManual(editing: number, v: { profile: number; cat: string; label: string; amountRaw: string }): Res
  deleteManual(k: number): void
  setAgg(key: 'si' | 'sp', vals: (string | number)[]): void
  setTog(k: string, v: boolean): void
  setLimit(family: LimitFamily, days: number, v: number): void
  activateCard(): void
  setBlocked(b: boolean): void
  toggleCardOption(k: 'on' | 'nfc'): void
  setOpposition(): void
  setCompose(patch: Partial<Compose>): void
  startReply(m: MailItem): void
  clearCompose(): void
  saveDraft(): Res
  sendMail(): Res
  deleteDraft(i: number): void
  markRead(i: number): void
  setRdvObj(v: string): void
}

interface Ctx {
  S: PortalState
  p: Profile
  ready: boolean
  lang: Lang
  A: Actions
  fmt: ReturnType<typeof makeFormatters>
  t: (s: string) => string
  unread: number
}
const PortalCtx = createContext<Ctx | null>(null)

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [S, setS] = useState<PortalState>(initState)
  const [lang, setLangState] = useState<Lang>('fr')
  const [ready, setReady] = useState(false)
  const ref = useRef(S)
  ref.current = S

  /* hydrate persisted state + language once */
  useEffect(() => {
    ;(async () => {
      const [raw, l] = await Promise.all([kv.get(STATE_KEY), kv.get(LANG_KEY)])
      if (l === 'en' || l === 'fr') setLangState(l)
      if (raw) {
        try {
          setS({ ...initState(), ...JSON.parse(raw) })
        } catch {
          /* ignore corrupted snapshot */
        }
      }
      setReady(true)
    })()
  }, [])

  /* persist (debounced) */
  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => kv.set(STATE_KEY, JSON.stringify(S)), 400)
    return () => clearTimeout(id)
  }, [S, ready])

  const upd = useCallback((patch: Partial<PortalState> | ((s: PortalState) => Partial<PortalState>)) => {
    setS(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  }, [])

  const fmt = useMemo(() => makeFormatters(lang, S.hide), [lang, S.hide])
  const t = useCallback((s: string) => translate(lang, s), [lang])

  const A: Actions = useMemo(
    () => ({
      reset() {
        const s = initState()
        setS(s)
        kv.del(STATE_KEY)
      },
      setLang(l) {
        setLangState(l)
        kv.set(LANG_KEY, l)
      },
      toggleHide: () => upd(s => ({ hide: !s.hide })),
      toggleReveal: () => upd(s => ({ rev: !s.rev })),
      setAvatar: uri => upd({ avatar: uri }),
      switchProfile: i => upd({ p: i, ai: 0, cx: 0, tf: {} }),
      setAccountIndex: i => upd({ ai: i }),
      setCardSelector: i => upd({ cx: i }),
      setTf: patch => upd(s => ({ tf: { ...s.tf, ...patch } })),
      resetTf: () => upd({ tf: {} }),

      validateTfAmount(raw) {
        const s = ref.current
        const f = s.tf
        const m = parseAmount(raw)
        const err = validateTransferAmount(P[s.p], s.ben[s.p], f, m, x => makeFormatters(lang, false).R(x))
        if (err) return err
        upd(st => ({ tf: { ...st.tf, m } }))
        return null
      },
      approveTransfer() {
        const s = ref.current
        const f = s.tf
        const dt = f.dt || DEFAULT_EXEC_DATE
        const ref_ = transferReference(dt, s.transferCount)
        const row: UpcomingRow = [dt, 'Virement — ' + (f.mo || 'sans motif'), 'Virement', -(f.m || 0), 'En attente']
        upd(st => ({
          up: st.up.map((u, i) => (i === st.p ? [...u, row] : u)),
          lastRef: ref_,
          transferCount: st.transferCount + 1
        }))
        return ref_
      },

      addBeneficiary(holder, usual, iban, bic) {
        const err = validateBeneficiary(holder, usual, iban)
        if (err) return err
        const entry = newBeneficiary(holder, usual, iban, bic)
        upd(s => ({ ben: s.ben.map((arr, i) => (i === s.p ? [...arr, entry] : arr)) }))
        return null
      },

      saveManual(editing, v) {
        const s = ref.current
        const amount = parseAmount(v.amountRaw)
        const err = validateManual({ profile: v.profile, cat: v.cat, label: v.label, amount, items: s.man, editing })
        if (err) return err
        const it = buildManual(v.profile, v.cat, v.label, amount)
        upd(st => ({ man: editing < 0 ? [...st.man, it] : st.man.map((y, k) => (k === editing ? it : y)) }))
        return null
      },
      deleteManual: k => upd(s => ({ man: s.man.filter((_, i) => i !== k) })),

      setAgg: (key, vals) => upd({ [key]: [...vals] } as Partial<PortalState>),
      setTog: (k, v) => upd(s => ({ tog: { ...s.tog, [k]: v }, ...(k === 'b' ? { arr: v } : {}) })),

      setLimit(family, days, v) {
        const val = clampLimit(v, family)
        upd(s => ({
          lims: s.lims.map((l, i) =>
            i === s.p ? { ...l, [family]: l[family].map((x, k) => (k === days ? val : x)) } : l
          )
        }))
      },
      activateCard: () => upd(s => ({ acts: s.acts.map((a, i) => (i === s.p ? true : a)) })),
      setBlocked: b => upd(s => ({ cs: s.cs.map((c, i) => (i === s.p ? { ...c, blk: b } : c)) })),
      toggleCardOption: k => upd(s => ({ cs: s.cs.map((c, i) => (i === s.p ? { ...c, [k]: !c[k] } : c)) })),
      setOpposition: () => upd(s => ({ cs: s.cs.map((c, i) => (i === s.p ? { ...c, opp: true } : c)) })),

      setCompose: patch => upd(s => ({ compose: { ...s.compose, ...patch } })),
      startReply: m => upd({ compose: { obj: 'Réponse : ' + m.subject, body: '', file: null, replyTo: m.subject } }),
      clearCompose: () => upd({ compose: { obj: '', body: '', file: null } }),
      saveDraft() {
        const c = ref.current.compose
        const err = validateMail(c.obj, c.body, false)
        if (err) return err
        const entry: MailItem = {
          date: new Date().toISOString().slice(0, 10),
          from: 'Mon Conseiller',
          subject: c.obj || 'Sans objet',
          preview: cut(c.body),
          body: c.body,
          file: c.file?.name
        }
        upd(s => ({ drafts: [entry, ...s.drafts], compose: { obj: '', body: '', file: null } }))
        return null
      },
      sendMail() {
        const c = ref.current.compose
        const err = validateMail(c.obj, c.body, true)
        if (err) return err
        const entry: MailItem = {
          date: new Date().toISOString().slice(0, 10),
          from: 'Mon Conseiller',
          subject: c.obj,
          preview: cut(c.body),
          body: c.body,
          file: c.file?.name
        }
        upd(s => ({ sent: [entry, ...s.sent], compose: { obj: '', body: '', file: null } }))
        return null
      },
      deleteDraft: i => upd(s => ({ drafts: s.drafts.filter((_, k) => k !== i) })),
      markRead: i => upd(s => (s.read.includes(i) ? {} : { read: [...s.read, i] })),
      setRdvObj: v => upd({ rdvObj: v })
    }),
    [upd, lang]
  )

  const unread = INITIAL_UNREAD.filter(i => !S.read.includes(i)).length
  const value: Ctx = { S, p: P[S.p], ready, lang, A, fmt, t, unread }
  return <PortalCtx.Provider value={value}>{children}</PortalCtx.Provider>
}

export function usePortal() {
  const c = useContext(PortalCtx)
  if (!c) throw new Error('usePortal outside PortalProvider')
  return c
}

export { defaultCredit, creditOptions }
