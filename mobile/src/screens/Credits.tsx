import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Icon } from '../components/Icon'
import { Button, Card, Empty, KVList, Row, Screen, Txt, useJob, useToast } from '../components/ui'
import { exportPdf } from '../services/exporter'
import { amortization } from '../services/rules'
import { RootStackParamList } from '../navigation/types'
import { usePortal } from '../state/portal'
import { useTheme } from '../theme'

export function Credits() {
  const nav = useNavigation<any>()
  const { p, fmt } = usePortal()
  const c = useTheme()
  if (!p.loan.length)
    return (
      <Screen>
        <Empty icon="credits" title="Aucun crédit Castelval pour ce profil." />
      </Screen>
    )
  const total = p.loan.reduce((t, l) => t + l.cap, 0)
  return (
    <Screen>
      <Txt v="small">Situation au 12 octobre 2026</Txt>
      <Card style={{ alignItems: 'center' }}>
        <Txt v="small">Total du capital restant dû</Txt>
        <Txt v="big" raw>{fmt.E(total)}</Txt>
        <Txt v="small" raw>{p.n} · Crédits suivis dans cette application</Txt>
      </Card>
      <Card>
        <Row bold label={p.n} value={fmt.E(total)} />
        <Txt v="small">{p.loan.length === 1 ? 'Crédit suivi dans cette application' : 'Crédits suivis dans cette application'}</Txt>
        {p.loan.map((l, i) => (
          <Pressable key={i} accessibilityRole="button" onPress={() => nav.navigate('LoanDetail', { index: i })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
            <View style={{ flex: 1 }}>
              <Txt v="label">{l.n}</Txt>
              <Txt v="small" raw>Prochaine échéance {l.next ? fmt.D(l.next) : '—'} · {fmt.E(l.mens)}</Txt>
            </View>
            <Txt v="bold" raw>{fmt.E(l.cap)}</Txt>
            <Icon name="chevR" size={16} color={c.mute} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  )
}

export function LoanDetail() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'LoanDetail'>>()
  const { p, fmt, lang, t } = usePortal()
  const toast = useToast()
  const { busy, run } = useJob()
  const [table, setTable] = useState(false)
  const l = p.loan[params.index]
  if (!l) return <Screen><Empty icon="credits" title="Aucun crédit Castelval pour ce profil." /></Screen>
  const rows = amortization(l, 6)
  return (
    <Screen>
      <Card>
        <Txt v="h3">{l.n}</Txt>
        <Txt raw>{p.n}</Txt>
        <Txt>Montant emprunté : <Txt v="bold" raw>{fmt.R(l.principal || 0)}</Txt></Txt>
        <Txt>Prochaine échéance : <Txt raw>{l.next ? fmt.D(l.next) : '—'}</Txt></Txt>
        <Txt>Montant de l’échéance : <Txt v="bold" raw>{fmt.R(l.mens)}</Txt></Txt>
        <View style={{ marginTop: 6 }}>
          <Txt v="small">Capital restant dû</Txt>
          <Txt v="big" raw>{fmt.E(l.cap)}</Txt>
        </View>
      </Card>

      <Button
        title="Télécharger le tableau d’amortissement"
        icon="download"
        kind="outline"
        loading={busy}
        onPress={() =>
          run(async () => {
            await exportPdf(
              {
                title: 'Tableau d’amortissement', subtitle: `${l.n} · ${p.n}`,
                facts: [['Capital restant dû', fmt.R(l.cap)], ['Taux fixe', String(l.rate).replace('.', ',') + ' %'], ['Montant de l’échéance', fmt.R(l.mens)]],
                tables: [{ table: { head: ['Échéance', 'Intérêts', 'Capital', 'Capital restant dû'], rows: amortization(l, l.m).map(r => [r.n, fmt.R(r.interest), fmt.R(r.principal), fmt.R(Math.max(0, r.remaining))]) } }],
                note: 'Mensualités hors assurance. Données fictives.'
              },
              lang
            )
          })
        }
      />
      <Button title={table ? 'Masquer le tableau' : 'Consulter le tableau'} kind="outline" onPress={() => setTable(v => !v)} />

      <Card>
        <Txt v="h3">Remboursement</Txt>
        <KVList rows={[
          ['Taux fixe', String(l.rate).replace('.', ',') + ' %'],
          ['Capital déjà remboursé', fmt.E((l.principal || 0) - l.cap)],
          ['Périodicité', 'Mensuelle'],
          ['Échéances remboursées', (l.paid || 0) + ' / ' + ((l.paid || 0) + l.m)]
        ]} />
      </Card>
      <Card>
        <Txt v="h3">Caractéristiques</Txt>
        <KVList rows={[
          ['Type', l.n],
          ['Compte de prélèvement', p.n + ' · ' + (l.account || 'Compte de paiement')],
          ['IBAN', p.acc[0][1]],
          ['Durée totale', (l.paid || 0) + l.m + ' mois'],
          ['Date de début', l.start ? fmt.D(l.start) : '—'],
          ['Date de fin', l.end ? fmt.D(l.end) : '—']
        ]} />
      </Card>
      {table && (
        <Card>
          <Txt v="h3">Tableau d’amortissement</Txt>
          {rows.map(r => (
            <View key={r.n} style={{ paddingVertical: 6, gap: 2 }}>
              <Txt v="label" raw>#{r.n}</Txt>
              <Row label="Intérêts" value={fmt.E(r.interest)} />
              <Row label="Capital" value={fmt.E(r.principal)} />
              <Row label="Capital restant dû" value={fmt.E(r.remaining)} />
            </View>
          ))}
        </Card>
      )}
      <Button title="Gérer le prélèvement" onPress={() => toast(t('Demande transmise. Statut : en attente d’approbation.'))} />
      <Txt v="small">Mensualités hors assurance. Capital restant dû après l’échéance du 12 octobre 2026. Données fictives.</Txt>
    </Screen>
  )
}

export function Insurance() {
  const nav = useNavigation<any>()
  return (
    <Screen>
      <Card>
        <Empty icon="umbrella" title="Aucun contrat à afficher" text="Aucun contrat d’assurance n’est associé à ce profil de démonstration." />
        <Button title="Parler à mon conseiller" onPress={() => nav.navigate('Appointment')} />
      </Card>
    </Screen>
  )
}
