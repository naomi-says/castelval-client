/* Business rules ported from the website (Portal.jsx actions + views.jsx computations).
   Pure functions only: they are unit-tested in tests/rules.test.ts. */
import { Beneficiary, LIM, Loan, MailEntry, P, Profile, TxRow } from '../data/data'

export const DEMO_TODAY = '2026-10-06'
export const DEFAULT_EXEC_DATE = '2026-10-15'
export const TRANSFER_CAP = 5000 // "plafond par virement"
export const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9 ]{11,30}$/

export const parseAmount = (s: string): number => parseFloat(String(s).replace(',', '.').replace(/\s/g, ''))

/* ───────── wealth (W() + patrimoine()) ───────── */
export interface ManualItem {
  p: number
  c: 'fin' | 'imm' | 'autre' | 'dette'
  f?: boolean
  l: string
  m: number
  i: string
}
export const MANUAL_CATEGORIES: [string, string][] = [
  ['fin', 'Avoir financier géré ailleurs'],
  ['imm-p', 'Résidence principale'],
  ['imm', 'Autre bien immobilier'],
  ['autre', 'Autre actif'],
  ['dette', 'Crédit externe']
]
export const WEALTH_CATS = ['Comptes de paiement', 'Épargne de précaution', 'Épargne moyen terme', 'Épargne long terme']

export interface WealthScope {
  sp: number[]
  si: string[]
  man: ManualItem[]
}
export function wealth({ sp, si, man }: WealthScope) {
  const manSum = (i: number, c: string) => man.filter(m => m.p === i && m.c === c).reduce((t, m) => t + m.m, 0)
  const products = (i: number, inst: string) => P[i].w.filter(y => y[3] === 'fin' && y[1] === inst)
  const sum = (list: { 2: number }[]) => list.reduce((t, y) => t + y[2], 0)
  const finAgr = (i: number) => sum(products(i, 'Castelval'))
  const finExt = (i: number) => sum(products(i, 'Hors Castelval')) + manSum(i, 'fin')
  const imm = (i: number) => P[i].w.filter(y => y[3] === 'imm').reduce((t, y) => t + y[2], 0) + manSum(i, 'imm')
  const aut = (i: number) => P[i].w.filter(y => y[3] === 'autre').reduce((t, y) => t + y[2], 0) + manSum(i, 'autre')
  const debtOf = (i: number) => P[i].loan.reduce((t, l) => t + l.cap, 0) + manSum(i, 'dette')
  const advOn = si.includes('Castelval')
  const extOn = si.includes('Hors Castelval')
  const advisor = sp.reduce((t, i) => t + finAgr(i), 0)
  const external = sp.reduce((t, i) => t + finExt(i), 0)
  const finTotal = (advOn ? advisor : 0) + (extOn ? external : 0)
  const immTotal = sp.reduce((t, i) => t + imm(i), 0)
  const autTotal = sp.reduce((t, i) => t + aut(i), 0)
  const gross = finTotal + immTotal + autTotal
  const debt = sp.reduce((t, i) => t + debtOf(i), 0)
  return { advOn, extOn, advisor, external, finTotal, immTotal, autTotal, gross, debt, net: gross - debt, products, sum, finAgr, finExt, imm, aut, debtOf }
}

/* ───────── transfers ───────── */
export interface TransferDraft {
  d?: number
  c?: string
  m?: number
  dt?: string
  mo?: string
}
export const verifiedBeneficiaries = (ben: Beneficiary[]) => ben.filter(b => b[4] === 'Vérifié')
export const defaultCredit = (d: number) => 'a' + (d === 0 ? 1 : 0)

export function creditOptions(p: Profile, ben: Beneficiary[], d: number) {
  const own = p.acc.map((y, i) => ({ v: 'a' + i, label: 'Mon ' + y[0].toLowerCase(), i })).filter(o => o.i !== d)
  const ext = verifiedBeneficiaries(ben).map((b, i) => ({ v: 'b' + i, label: `${b[0]} (bénéficiaire)`, i }))
  return [...own, ...ext]
}

/** Amount-step validation of the transfer wizard. Returns the French error or null. */
export function validateTransferAmount(
  p: Profile,
  ben: Beneficiary[],
  f: TransferDraft,
  m: number,
  fmt: (n: number) => string
): string | null {
  if (!(m > 0)) return 'Saisissez un montant supérieur à zéro.'
  if (m > p.acc[f.d || 0][2]) return 'Le montant dépasse le solde disponible.'
  if (m > TRANSFER_CAP) return 'Le montant dépasse le plafond par virement (5 000 €).'
  if (f.c && f.c[0] === 'b') {
    const b = verifiedBeneficiaries(ben)[+f.c.slice(1)]
    if (b && b[5] != null && m > b[5])
      return `Le montant saisi dépasse le plafond de virement de ${b[0]}. Montant disponible : ${fmt(b[5])}.`
  }
  return null
}
export const dailyTransferAvailable = () => LIM[0][1] - LIM[0][2]
export const transferReference = (dt: string, n: number) => `VIR-${dt.replace(/-/g, '')}-${String(42 + n).padStart(4, '0')}`

/* ───────── beneficiaries ───────── */
export function validateBeneficiary(holder: string, usual: string, iban: string): string | null {
  const ib = iban.trim().toUpperCase()
  if (!holder.trim() || !usual.trim() || !IBAN_RE.test(ib)) return 'Renseignez le titulaire, le nom usuel et un IBAN valide.'
  return null
}
export const newBeneficiary = (holder: string, usual: string, iban: string, bic: string): Beneficiary => [
  usual.trim(),
  holder.trim(),
  iban.trim().toUpperCase(),
  bic.trim() || '—',
  'En attente de vérification',
  null
]

/* ───────── manual wealth items ───────── */
export function validateManual(args: {
  profile: number
  cat: string
  label: string
  amount: number
  items: ManualItem[]
  editing: number
}): string | null {
  const { profile, cat, label, amount, items, editing } = args
  if (!label.trim() || !(amount > 0)) return 'Renseignez un intitulé et un montant positif.'
  if (
    cat === 'imm-p' &&
    P[profile].t === 'Personne physique' &&
    (P[profile].w.some(y => y[0] === 'Résidence principale') || items.some((y, k) => y.p === profile && y.f && k !== editing))
  )
    return 'Une résidence principale est déjà déclarée pour ce profil : une seule est possible pour une personne physique.'
  return null
}
export const buildManual = (profile: number, cat: string, label: string, amount: number): ManualItem => ({
  p: profile,
  c: (cat === 'imm-p' ? 'imm' : cat) as ManualItem['c'],
  f: cat === 'imm-p',
  l: label.trim(),
  m: amount,
  i: 'Hors Castelval'
})

/* ───────── card limits ───────── */
export type LimitFamily = 'payment' | 'withdrawal'
export const limitMax = (family: LimitFamily) => (family === 'payment' ? 15000 : 5000)
export const clampLimit = (v: number, family: LimitFamily) =>
  Math.min(limitMax(family), Math.max(0, Math.round((Number(v) || 0) / 500) * 500))
export const cashbackPosition = (pts: number) => {
  const pos = pts >= 100000 ? 2 + Math.min(1, (pts - 100000) / 60000) : pts >= 20000 ? 1 + (pts - 20000) / 80000 : pts / 20000
  return Math.max(3, Math.min(97, (pos / 3) * 100))
}

/* ───────── loans ───────── */
export function amortization(l: Loan, rows = 6) {
  let c = l.cap
  return Array.from({ length: rows }, (_, k) => {
    const interest = (c * l.rate) / 1200
    const principal = l.mens - interest
    c -= principal
    return { n: k + 1, interest, principal, remaining: c }
  })
}
export const loanForOperation = (p: Profile, row: TxRow) => p.loan.find(l => row[1].startsWith(l.n))

/* ───────── operations list ───────── */
export type SortState = [col: 0 | 1 | 2, dir: 1 | -1]
export const nextSort = (cur: SortState, c: 0 | 1 | 2): SortState =>
  cur[0] === c ? [c, (-cur[1]) as 1 | -1] : [c, c === 1 ? 1 : -1]
export function sortRows(rows: TxRow[], [c, d]: SortState): TxRow[] {
  return [...rows].sort((x, y) => (x[c] > y[c] ? 1 : x[c] < y[c] ? -1 : 0) * d)
}
export function filterRows(rows: TxRow[], q: string, from?: string, to?: string): TxRow[] {
  const s = q.trim().toLowerCase()
  return rows.filter(r => (!s || r[1].toLowerCase().includes(s)) && (!from || r[0] >= from) && (!to || r[0] <= to))
}

/* ───────── mail ───────── */
export interface MailItem {
  date: string
  from: string
  subject: string
  preview: string
  body: string
  file?: string
}
export const cut = (s: string) => {
  const t = (s || '').replace(/\s+/g, ' ').trim()
  return t.length > 92 ? t.slice(0, 92).trimEnd() + '…' : t
}
export const inboxFrom = (m: MailEntry[]): MailItem[] =>
  m.map(x => ({ date: x[0], from: x[1], subject: x[2], preview: x[3], body: x[4] }))
export function validateMail(obj: string, body: string, forSend: boolean): string | null {
  if (forSend) return !obj || !body.trim() ? 'Choisissez un objet et saisissez votre message.' : null
  return !obj && !body.trim() ? 'Choisissez un objet ou saisissez votre message.' : null
}
export function filterMail(list: MailItem[], q: string, dateFmt: (d: string) => string) {
  const s = q.trim().toLowerCase()
  return list.filter(m => !s || [dateFmt(m.date), m.from, m.subject, m.preview].join(' ').toLowerCase().includes(s))
}

/* ───────── profile contact masking (profil()) ───────── */
export function maskPair([k, v]: [string, string], reveal: boolean): [string, string] {
  if (reveal) return [k, v]
  if (k === 'Téléphone portable' && v !== 'Non renseigné') return [k, 'XX XX XX 00 00']
  if (k === 'Courriel') return [k, v.split('@')[0] + '@•••']
  if (k === 'Adresse' && v !== 'Non renseignée') return [k, '12 rue des •••, 75015 Paris, France']
  return [k, v]
}

/* ───────── statements ───────── */
const MONTHS: Record<string, string> = {
  janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06', juillet: '07', août: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12'
}
/** Transactions covered by a statement title ("Septembre 2026" → that month; "Relevé au 8 octobre 2026" → up to that day). */
export function statementRows<T extends [string, ...unknown[]]>(title: string, rows: T[]): T[] {
  const m = /(?:au\s+(\d{1,2})\s+)?([a-zéû]+)\s+(\d{4})/i.exec(title)
  if (!m || !MONTHS[m[2].toLowerCase()]) return rows
  const ym = `${m[3]}-${MONTHS[m[2].toLowerCase()]}`
  return m[1] ? rows.filter(r => r[0] <= `${ym}-${m[1].padStart(2, '0')}`) : rows.filter(r => r[0].startsWith(ym))
}
