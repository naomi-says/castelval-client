import React, { useMemo, useState } from 'react'
import { Pressable, Share, View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Icon } from '../components/Icon'
import {
  Button, Card, Divider, Empty, Field, DateField, Heading, KVList, ListRow, Row, Screen, SectionTitle, SelectField, SwitchRow, Tag, Txt, useJob, useToast
} from '../components/ui'
import { P, TxRow } from '../data/data'
import { exportPdf, previewPdf } from '../services/exporter'
import { filterRows, loanForOperation, nextSort, sortRows, SortState, statementRows } from '../services/rules'
import { usePortal } from '../state/portal'
import { fonts, radius, useStyles, useTheme } from '../theme'
import { RootStackParamList } from '../navigation/types'

export const acctName = (l: string) => (l === 'Compte de paiement' ? 'Mon compte de paiement' : l)

/** Accounts shown in the account pickers: the profile's accounts plus "other" accounts. */
export function useAccounts() {
  const { p, S } = usePortal()
  const list = useMemo(() => [...p.acc, ...(p.extra || [])], [p])
  const a = Math.min(S.ai, list.length - 1)
  return { list, a, ac: list[a] }
}

/* ───────── operations list: cards instead of the desktop table; sort chips + search ───────── */
export function OpsList({ rows, adv = false, onRow, searchable = true, title }: {
  rows: TxRow[]; adv?: boolean; onRow?: (r: TxRow) => void; searchable?: boolean; title?: string
}) {
  const c = useTheme()
  const { fmt } = usePortal()
  const [sort, setSort] = useState<SortState>([0, -1])
  const [q, setQ] = useState('')
  const view = useMemo(() => sortRows(filterRows(rows, q), sort), [rows, sort, q])
  const chips: [0 | 1 | 2, string][] = [[0, 'Date'], [1, 'Libellé'], [2, 'Montant']]
  const s = useStyles(col => ({
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: col.line, backgroundColor: col.card },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }
  }))
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Txt v="small">Trier par</Txt>
        {chips.map(([i, label]) => {
          const on = sort[0] === i
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Trier par ${label}`}
              onPress={() => setSort(nextSort(sort, i))}
              style={[s.chip, on && { borderColor: c.gold }]}
            >
              <Txt v="label" color={on ? c.gold : c.ink}>{label}</Txt>
              {on && <Txt raw color={c.gold}>{sort[1] > 0 ? '▲' : '▼'}</Txt>}
            </Pressable>
          )
        })}
      </View>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {view.length === 0 && <Empty icon="search" title="Aucune donnée." />}
        {view.map((r, i) => (
          <View key={i}>
            {i > 0 && <Divider />}
            <Pressable disabled={!onRow} onPress={() => onRow?.(r)} accessibilityRole={onRow ? 'button' : undefined} style={s.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="label">{r[1]}</Txt>
                <Txt v="small" raw>{fmt.D(r[0])}</Txt>
                {adv && <Tag>Comptabilisée</Tag>}
              </View>
              <Txt raw color={r[2] < 0 ? c.ink : c.pos} style={{ fontFamily: fonts.sansBold }}>{fmt.E(r[2])}</Txt>
              {onRow && <Icon name="chevR" size={16} color={c.mute} />}
            </Pressable>
          </View>
        ))}
      </Card>
    </View>
  )
}

function AccountPicker() {
  const { A, fmt } = usePortal()
  const { list, a } = useAccounts()
  return (
    <SelectField
      label="Choisir un compte"
      value={a}
      onChange={(v: number) => A.setAccountIndex(+v)}
      options={list.map((y, i) => ({ value: i, label: `${acctName(y[0])} — ${fmt.E(y[2])}` }))}
    />
  )
}

/* ───────── Mes opérations (tab 0) ───────── */
export function AccountsScreen() {
  const nav = useNavigation<any>()
  const { S, p, A, fmt } = usePortal()
  const { a, ac } = useAccounts()
  const upTotal = S.up[S.p].reduce((t, u) => t + u[3], 0)
  const openOp = (row: TxRow) => {
    const idx = loanForOperation(p, row)
    if (idx) nav.navigate('LoanDetail', { index: p.loan.indexOf(idx) })
    else nav.navigate('OperationDetail', { row })
  }
  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt v="h2">Mes opérations</Txt>
        <Txt v="small">Situation au 6 octobre 2026</Txt>
      </View>
      <Card>
        <AccountPicker />
        <Txt v="small" raw>{p.n} · {ac[1]}</Txt>
        <Row label="Solde actuel :" value={<Txt v="big" raw style={{ fontSize: 26 }}>{fmt.E(ac[2])}</Txt>} />
        <Row label="Opérations à venir :" value={fmt.E(upTotal)} onValue={() => nav.navigate('Scheduled')} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Virement" icon="virements" style={{ flex: 1 }} onPress={() => { A.resetTf(); A.setTf({ d: Math.min(a, p.acc.length - 1) }); nav.navigate('TfFrom') }} />
          <Button title="Gestion (RIB…)" kind="outline" style={{ flex: 1 }} onPress={() => nav.navigate('AccountManage')} />
        </View>
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading rule="short">Toutes mes opérations</Heading>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt v="small">Solde au 12/10/2026</Txt>
          <Txt v="bold" raw>{fmt.E(ac[2])}</Txt>
        </View>
      </View>
      <Txt v="small">{acctName(ac[0])}, {p.n}</Txt>
      <OpsList rows={p.tx[a] || []} onRow={openOp} />
      <Txt v="small">Données de démonstration. Les opérations à venir sont prévisionnelles et ne sont pas incluses dans le solde disponible.</Txt>
    </Screen>
  )
}

/* ───────── Gérer le compte (tab 1) ───────── */
export function AccountManage() {
  const nav = useNavigation<any>()
  const { S, p, A, fmt, lang } = usePortal()
  const { a, ac } = useAccounts()
  const toast = useToast()
  const { busy, run } = useJob()
  const [adv, setAdv] = useState(false)
  const [from, setFrom] = useState('2026-09-01')
  const [to, setTo] = useState('2026-10-15')
  const upTotal = S.up[S.p].reduce((t, u) => t + u[3], 0)
  const chars: [string, string][] =
    ac[0] === 'Livret Castelval F' || ac[0] === 'Livret Castelval B'
      ? [['Taux de rémunération', ac[0] === 'Livret Castelval F' ? '2 %' : '2,1 %'], ['Seuil des dépôts', '10,00 €']]
      : ac[0] === 'Compte à terme'
      ? [['Date d’ouverture', '30 septembre 2026'], ['Échéance', '30 septembre 2027'], ['Taux de rémunération', 'Non renseigné']]
      : []
  const rows = p.tx[a] || []
  const ranged = useMemo(() => filterRows(rows, '', from, to), [rows, from, to])
  const openOp = (row: TxRow) => {
    const l = loanForOperation(p, row)
    if (l) nav.navigate('LoanDetail', { index: p.loan.indexOf(l) })
    else nav.navigate('OperationDetail', { row })
  }
  const doExport = (list: TxRow[], title: string, sub: string) =>
    run(async () => {
      await exportPdf(
        {
          title, subtitle: sub, facts: [['Titulaire', p.n], ['IBAN', ac[1]], ['Solde actuel', fmt.R(ac[2])]],
          tables: [{ table: { head: ['Date opération', 'Libellé', 'Montant'], rows: list.map(r => [fmt.D(r[0]), r[1], fmt.R(r[2])]) } }],
          note: 'Données de démonstration.'
        },
        lang
      )
    })
  return (
    <Screen>
      <Txt v="small">Situation au 6 octobre 2026</Txt>
      <Card>
        <AccountPicker />
        <Txt v="small" raw>{p.n} · {ac[1]}</Txt>
        <Row label="Solde actuel :" value={fmt.E(ac[2])} bold />
        <Row label="Opérations à venir :" value={fmt.E(upTotal)} onValue={() => nav.navigate('Scheduled')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button title="Virement" icon="virements" style={{ flexGrow: 1 }} onPress={() => { A.resetTf(); A.setTf({ d: Math.min(a, p.acc.length - 1) }); nav.navigate('TfFrom') }} />
          <Button title="Relevés" kind="outline" icon="documents" style={{ flexGrow: 1 }} onPress={() => nav.navigate('Statements', { acct: Math.min(a, p.acc.length - 1) })} />
          <Button title="Télécharger" kind="outline" icon="download" loading={busy} style={{ flexGrow: 1 }} onPress={() => doExport(rows, 'Relevé d’opérations', acctName(ac[0]))} />
          <Button title="RIB" kind="outline" style={{ flexGrow: 1 }} onPress={() => nav.navigate('Rib')} />
        </View>
      </Card>

      <SectionTitle rule="short">Toutes mes opérations</SectionTitle>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt v="small">{acctName(ac[0])}, {p.n}</Txt>
        <Txt v="small">Solde au 12/10/2026 : <Txt v="bold" raw>{fmt.E(ac[2])}</Txt></Txt>
      </View>
      <SwitchRow label="Mode avancé" value={adv} onChange={setAdv} />
      <OpsList rows={rows} adv={adv} onRow={openOp} />

      <Card>
        <Txt v="h3">Détail du compte</Txt>
        <KVList rows={[['Titulaire', p.n], ['IBAN', ac[1]], ['BIC', 'Non renseigné'], ...chars]} />
        <Button title="Faire un virement" kind="outline" onPress={() => { A.resetTf(); A.setTf({ d: Math.min(a, p.acc.length - 1) }); nav.navigate('TfFrom') }} />
      </Card>

      <Card>
        <Txt v="h3">Recherche et export</Txt>
        <DateField label="Du" value={from} onChange={setFrom} />
        <DateField label="Jusqu’au" value={to} onChange={setTo} />
        <Txt v="small">{ranged.length} opération(s) sur la période.</Txt>
        <Button title="Exporter" icon="download" loading={busy} onPress={() => doExport(ranged, 'Export des opérations', `${fmt.D(from)} → ${fmt.D(to)}`)} />
      </Card>

      <Card>
        <Txt v="h3">Mes opérations à venir</Txt>
        <Upcoming />
      </Card>
    </Screen>
  )
}

/** Upcoming operations list (website upl()). */
export function Upcoming() {
  const { S, fmt } = usePortal()
  const c = useTheme()
  const up = S.up[S.p]
  if (!up.length) return <Empty title="Aucune donnée." />
  return (
    <View>
      {up.map((u, i) => (
        <View key={i}>
          {i > 0 && <Divider />}
          <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, alignItems: 'center' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="label">{u[1]}</Txt>
              <Txt v="small" raw>{fmt.D(u[0])} · {u[2]}</Txt>
              <Tag>{u[4]}</Tag>
            </View>
            <Txt raw style={{ fontFamily: fonts.sansBold }} color={u[3] < 0 ? c.ink : c.pos}>{fmt.E(u[3])}</Txt>
          </View>
        </View>
      ))}
    </View>
  )
}

export function OperationDetail() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'OperationDetail'>>()
  const { fmt } = usePortal()
  const row = params.row
  return (
    <Screen>
      <Card>
        <KVList rows={[['Date', fmt.D(row[0])], ['Libellé', row[1]], ['Montant', fmt.E(row[2])], ['Statut', 'Comptabilisée'], ['Source', 'Système Castelval · 14/10/2026']]} />
      </Card>
    </Screen>
  )
}

/* ───────── relevés (website: "Mes relevés de compte" page + d-stm dialog) ───────── */
export function Statements() {
  const nav = useNavigation<any>()
  const route = useRoute<RouteProp<RootStackParamList, 'Statements'>>()
  const { p, fmt, lang } = usePortal()
  const { busy, run } = useJob()
  const [sel, setSel] = useState<number>(route.params?.acct ?? -1)
  const accts = p.acc
  const stms = p.doc.filter(d => sel < 0 || d[0] === accts[sel]?.[0])
  const docFor = (d: [string, string]) => {
    const idx = Math.max(0, accts.findIndex(a => a[0] === d[0]))
    const rows = statementRows(d[1], p.tx[idx] || [])
    return {
      title: d[1], subtitle: `${d[0]} · ${p.n}`,
      facts: [['Titulaire', p.n], ['IBAN', accts[idx][1]]] as [string, string][],
      tables: [{ table: { head: ['Date opération', 'Libellé', 'Montant'], rows: rows.map(r => [fmt.D(r[0]), r[1], fmt.R(r[2])]) } }],
      note: 'Données de démonstration.'
    }
  }
  return (
    <Screen>
      <SelectField
        label="Compte à consulter"
        value={sel}
        onChange={(v: number) => setSel(+v)}
        options={[{ value: -1, label: 'Tous les comptes' }, ...accts.map((a, i) => ({ value: i, label: `${acctName(a[0])} · ${p.n}` }))]}
      />
      <Button
        title="Imprimer un relevé à aujourd’hui"
        icon="download"
        loading={busy}
        onPress={() => {
          const i = Math.max(0, sel)
          run(async () => {
            await exportPdf(
              {
                title: 'Relevé d’opérations', subtitle: `${acctName(accts[i][0])} · ${p.n}`,
                facts: [['IBAN', accts[i][1]], ['Solde actuel', fmt.R(accts[i][2])]],
                tables: [{ table: { head: ['Date opération', 'Libellé', 'Montant'], rows: (p.tx[i] || []).map(r => [fmt.D(r[0]), r[1], fmt.R(r[2])]) } }]
              },
              lang
            )
          })
        }}
      />
      {stms.length === 0 ? (
        <Empty icon="documents" title="Aucun relevé disponible pour ce compte." />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {stms.map((d, i) => (
            <View key={i}>
              {i > 0 && <Divider />}
              <View style={{ paddingVertical: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Icon name="documents" size={24} color="#c9a227" />
                  <View style={{ flex: 1 }}>
                    <Txt v="label">{d[1]}</Txt>
                    <Txt v="small">{d[0]}</Txt>
                    <Txt v="small" raw>{p.n}</Txt>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button title="Consulter" kind="outline" style={{ flex: 1, minHeight: 42 }} onPress={() => run(() => previewPdf(docFor(d), lang))} />
                  <Button title="Télécharger le PDF" style={{ flex: 1, minHeight: 42 }} onPress={() => run(async () => { await exportPdf(docFor(d), lang) })} />
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
      <ListRow icon="folder" title="Autres documents à disposition" onPress={() => nav.navigate('OtherDocuments')} />
      <ListRow icon="documents" title="Mes documents à transmettre" onPress={() => nav.navigate('DocsToSend')} />
      <ListRow icon="documents" title="Mes devis et contrats à signer" onPress={() => nav.navigate('DocsToSign')} />
    </Screen>
  )
}

export function OtherDocuments() {
  const nav = useNavigation<any>()
  return (
    <Screen>
      <Card>
        <ListRow title="Relevé d’identité bancaire" right="Consulter" onPress={() => nav.navigate('Rib')} />
      </Card>
    </Screen>
  )
}
export const DocsToSend = () => (
  <Screen>
    <Empty icon="folder" title="Votre dossier est à jour" text="Aucun document n’est demandé dans ce profil de démonstration." />
  </Screen>
)
export const DocsToSign = () => (
  <Screen>
    <Empty icon="documents" title="Aucune signature en attente" text="Vous retrouverez ici les documents nécessitant votre signature." />
  </Screen>
)

export function Rib() {
  const { p, lang } = usePortal()
  const { ac } = useAccounts()
  const { busy, run } = useJob()
  const rows: [string, string][] = [['Titulaire', p.n], ['IBAN', ac[1]], ['BIC', 'Non renseigné']]
  return (
    <Screen>
      <Card>
        <Txt v="small">{acctName(ac[0])}</Txt>
        <KVList rows={rows} />
        <Txt v="small">Document de démonstration. Ces coordonnées ne permettent aucun virement réel.</Txt>
      </Card>
    </Screen>
  )
}
