import test from 'node:test'
import assert from 'node:assert/strict'
import { P } from '../src/data/data'
import {
  amortization, buildManual, clampLimit, creditOptions, cut, defaultCredit, filterRows, maskPair, nextSort, parseAmount,
  sortRows, transferReference, validateBeneficiary, validateMail, validateManual, validateTransferAmount, wealth, loanForOperation,
  cashbackPosition, statementRows
} from '../src/services/rules'

const R = (n: number) => `${n} €`

/* reference implementation: W() copied from the website's views.jsx */
function webW(S: { sp: number[]; si: string[]; man: any[] }) {
  const it: any[] = []
  S.sp.forEach(i => P[i].w.forEach(x => it.push({ p: i, l: x[0], i: x[1], m: x[2], c: x[3] })))
  S.man.forEach(x => S.sp.includes(x.p) && it.push({ ...x }))
  const s = (c: string) => it.filter(x => x.c === c).reduce((t, x) => t + x.m, 0)
  const fin = it.filter(x => x.c === 'fin' && S.si.includes(x.i)).reduce((t, x) => t + x.m, 0)
  const debt = S.sp.reduce((t, i) => t + P[i].loan.reduce((u, l) => u + l.cap, 0), 0) + s('dette')
  return fin + s('imm') + s('autre') - debt
}

test('wealth: default scope equals the website formula', () => {
  const sc = { sp: [0, 1], si: ['Castelval', 'Hors Castelval'], man: [] }
  const w = wealth(sc)
  assert.ok(Math.abs(w.net - 3423265.4) < 0.01)
  assert.ok(Math.abs(w.net - webW(sc)) < 0.001)
})

test('wealth: every scope/manual-item combination matches the website formula', () => {
  const man = [
    buildManual(0, 'fin', 'PEA', 1000),
    buildManual(0, 'imm', 'Studio', 50000),
    buildManual(1, 'dette', 'Prêt', 20000),
    buildManual(1, 'autre', 'Art', 700)
  ]
  for (const sp of [[0], [1], [0, 1]])
    for (const si of [['Castelval'], ['Castelval', 'Hors Castelval']])
      for (const m of [[], man]) {
        const sc = { sp, si, man: m }
        assert.ok(Math.abs(wealth(sc).net - webW(sc)) < 0.001, JSON.stringify({ sp, si, n: m.length }))
      }
})

test('wealth: the establishment filter only applies to financial assets', () => {
  const only = wealth({ sp: [0], si: ['Castelval'], man: [] })
  const all = wealth({ sp: [0], si: ['Castelval', 'Hors Castelval'], man: [] })
  assert.equal(all.net - only.net, 154000)
  assert.equal(only.immTotal, all.immTotal)
})

test('transfer: amount validation order and messages', () => {
  const ben = P[0].b.map(b => [...b]) as any
  const f = { d: 0, c: 'a1' }
  assert.equal(validateTransferAmount(P[0], ben, f, NaN, R), 'Saisissez un montant supérieur à zéro.')
  assert.equal(validateTransferAmount(P[0], ben, f, 0, R), 'Saisissez un montant supérieur à zéro.')
  assert.equal(validateTransferAmount(P[0], ben, f, 5000, R), 'Le montant dépasse le solde disponible.') // balance 4723.33
  assert.equal(validateTransferAmount(P[0], ben, { d: 1, c: 'a0' }, 6000, R), 'Le montant dépasse le plafond par virement (5 000 €).')
  assert.equal(validateTransferAmount(P[0], ben, f, 100, R), null)
})

test('transfer: beneficiary-specific cap (verified beneficiary "charges de copropriété" = 3000 €)', () => {
  const ben = P[0].b.map(b => [...b]) as any
  // verified beneficiaries: index 0 = mon compte LCL (no limit), index 1 = copropriété (3000)
  const msg = validateTransferAmount(P[0], ben, { d: 2, c: 'b1' }, 3500, R)
  assert.match(msg!, /dépasse le plafond de virement de charges de copropriété rue de Rome/)
  assert.equal(validateTransferAmount(P[0], ben, { d: 2, c: 'b1' }, 3000, R), null)
})

test('transfer: credit options exclude the debited account, include verified beneficiaries only', () => {
  const ben = [...P[0].b, ['X', 'Y', 'FR76 0000 0000 0000 0000 000', '—', 'En attente de vérification', null]] as any
  const o = creditOptions(P[0], ben, 0)
  assert.deepEqual(o.map(x => x.v), ['a1', 'a2', 'b0', 'b1'])
  assert.equal(defaultCredit(0), 'a1')
  assert.equal(defaultCredit(2), 'a0')
  assert.equal(parseAmount('1 234,5'), 1234.5)
  assert.equal(transferReference('2026-10-15', 0), 'VIR-20261015-0042')
})

test('beneficiary: IBAN regex and required fields', () => {
  assert.ok(validateBeneficiary('', 'a', 'FR76 1234 5678 9000 0000 0000 000'))
  assert.ok(validateBeneficiary('a', '', 'FR76 1234 5678 9000 0000 0000 000'))
  assert.ok(validateBeneficiary('a', 'b', 'nonsense'))
  assert.equal(validateBeneficiary('a', 'b', 'fr76 1234 5678 9000 0000 0000 000'), null) // upper-cased like the website
})

test('manual items: validation and single main residence rule', () => {
  const base = { profile: 0, cat: 'fin', label: 'x', amount: 10, items: [], editing: -1 }
  assert.ok(validateManual({ ...base, label: ' ' }))
  assert.ok(validateManual({ ...base, amount: 0 }))
  assert.equal(validateManual(base), null)
  // Jean Dupond already declares « Résidence principale » in his wealth → refused
  assert.match(validateManual({ ...base, cat: 'imm-p' })!, /résidence principale est déjà déclarée/)
  // the holding (personne morale) is not restricted
  assert.equal(validateManual({ ...base, profile: 1, cat: 'imm-p' }), null)
  const it = buildManual(1, 'imm-p', ' Siège ', 5)
  assert.deepEqual(it, { p: 1, c: 'imm', f: true, l: 'Siège', m: 5, i: 'Hors Castelval' })
  assert.equal(validateManual({ ...base, profile: 1, cat: 'imm-p', items: [it] }), null)
})

test('card limits: 500 € steps, clamped per family', () => {
  assert.equal(clampLimit(740, 'payment'), 500)
  assert.equal(clampLimit(760, 'payment'), 1000)
  assert.equal(clampLimit(99999, 'payment'), 15000)
  assert.equal(clampLimit(99999, 'withdrawal'), 5000)
  assert.equal(clampLimit(-5, 'payment'), 0)
  assert.equal(clampLimit(NaN, 'payment'), 0)
  assert.ok(cashbackPosition(132000) > 66 && cashbackPosition(0) === 3)
})

test('loans: amortisation matches the website table and operations map to loans', () => {
  const l = P[0].loan[0]
  const [r1, r2] = amortization(l, 2)
  const it = (l.cap * l.rate) / 1200
  assert.ok(Math.abs(r1.interest - it) < 1e-9)
  assert.ok(Math.abs(r1.remaining - (l.cap - (l.mens - it))) < 1e-9)
  assert.ok(r2.remaining < r1.remaining)
  assert.equal(loanForOperation(P[0], ['2026-10-12', 'Crédit voiture — échéance', -1]), l)
  assert.equal(loanForOperation(P[0], ['2026-10-12', 'Énergie', -1]), undefined)
})

test('operations: website sort defaults and filters', () => {
  const rows = P[0].tx[0]
  const byDate = sortRows(rows, [0, -1])
  assert.equal(byDate[0][0], '2026-10-12')
  assert.deepEqual(nextSort([0, -1], 0), [0, 1])
  assert.deepEqual(nextSort([0, -1], 1), [1, 1]) // labels open A → Z
  assert.deepEqual(nextSort([0, -1], 2), [2, -1])
  assert.equal(sortRows(rows, [2, 1])[0][2], -2990)
  assert.equal(filterRows(rows, 'loyer').length, 2)
  assert.equal(filterRows(rows, '', '2026-10-01', '2026-10-31').length, 12)
})

test('statements cover the period named in their title', () => {
  const rows = P[0].tx[0]
  assert.ok(statementRows('Septembre 2026', rows).every(r => r[0].startsWith('2026-09')))
  assert.ok(statementRows('Relevé au 8 octobre 2026', rows).every(r => r[0] <= '2026-10-08'))
})

test('mail: validation rules, preview truncation', () => {
  assert.equal(validateMail('', ' ', false), 'Choisissez un objet ou saisissez votre message.')
  assert.equal(validateMail('Autre demande', '', false), null)
  assert.equal(validateMail('Autre demande', '', true), 'Choisissez un objet et saisissez votre message.')
  assert.equal(validateMail('', 'hello', true), 'Choisissez un objet et saisissez votre message.')
  assert.equal(validateMail('a', 'b', true), null)
  const long = 'x'.repeat(200)
  assert.equal(cut(long).length, 93)
  assert.ok(cut(long).endsWith('…'))
})

test('profile: contact masking', () => {
  assert.deepEqual(maskPair(['Téléphone portable', '+33 6 00 00 00 00'], false), ['Téléphone portable', 'XX XX XX 00 00'])
  assert.deepEqual(maskPair(['Courriel', 'jean.dupond@gmail.fr'], false), ['Courriel', 'jean.dupond@•••'])
  assert.deepEqual(maskPair(['Téléphone fixe', 'Non renseigné'], false), ['Téléphone fixe', 'Non renseigné'])
  assert.deepEqual(maskPair(['Courriel', 'a@b.fr'], true), ['Courriel', 'a@b.fr'])
})
