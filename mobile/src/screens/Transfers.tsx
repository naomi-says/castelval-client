import React, { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { TrustedApproval } from '../components/Approval'
import { Icon } from '../components/Icon'
import { Bar, Button, Card, DateField, Empty, ErrorText, Field, KVList, ListRow, Row, Screen, SelectField, Tag, Txt, useToast } from '../components/ui'
import { LIM } from '../data/data'
import { RootStackParamList } from '../navigation/types'
import {
  creditOptions, dailyTransferAvailable, defaultCredit, DEFAULT_EXEC_DATE, parseAmount, verifiedBeneficiaries
} from '../services/rules'
import { usePortal } from '../state/portal'
import { useTheme } from '../theme'
import { Upcoming } from './Accounts'

/* ───────── hub (website: the four "Virements" sub-sections) ───────── */
export function TransfersHub() {
  const nav = useNavigation<any>()
  const { A, p, fmt } = usePortal()
  return (
    <Screen>
      <Txt v="h2">Virements</Txt>
      <Button title="Nouveau virement" icon="virements" onPress={() => { A.resetTf(); nav.navigate('TfFrom') }} />
      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon="user" title="Mes bénéficiaires" onPress={() => nav.navigate('Beneficiaries')} />
        <ListRow icon="sort" title="Plafonds de virement" onPress={() => nav.navigate('TransferLimits')} />
        <ListRow icon="cal" title="Virements programmés et prélèvements" onPress={() => nav.navigate('Scheduled')} />
      </Card>
    </Screen>
  )
}

/* the wizard is left on the Transfers tab, where it was started */
const TO_TRANSFERS = { screen: 'Tabs', params: { screen: 'Transfers' } }

/* ───────── wizard ───────── */
const STEPS = ['Compte à débiter', 'Compte à créditer', 'Montant et caractéristiques', 'Récapitulatif', 'Confirmation']
function Steps({ step }: { step: number }) {
  const c = useTheme()
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {STEPS.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? c.gold : c.line }} />
        ))}
      </View>
      <Txt v="small" raw>
        {step + 1}/{STEPS.length} · <Txt v="small" color={c.heading}>{STEPS[step]}</Txt>
      </Txt>
    </View>
  )
}

export function TfFrom() {
  const nav = useNavigation<any>()
  const { S, p, A, fmt } = usePortal()
  const d = S.tf.d !== undefined ? S.tf.d : 0
  return (
    <Screen footer={<Button title="Continuer" onPress={() => { A.setTf({ d, c: S.tf.d === d ? S.tf.c : undefined }); nav.navigate('TfTo') }} />}>
      <Steps step={0} />
      <Card>
        <SelectField
          label="Compte à débiter"
          value={d}
          onChange={(v: number) => A.setTf({ d: +v, c: undefined })}
          options={p.acc.map((y, i) => ({ value: i, label: `${y[0]} — ${fmt.E(y[2])}` }))}
        />
      </Card>
    </Screen>
  )
}

export function TfTo() {
  const nav = useNavigation<any>()
  const { S, p, A } = usePortal()
  const d = S.tf.d || 0
  const opts = creditOptions(p, S.ben[S.p], d)
  const valid = (v?: string) => !!v && opts.some(o => o.v === v)
  const sel = valid(S.tf.c) ? S.tf.c! : valid(defaultCredit(d)) ? defaultCredit(d) : opts[0]?.v
  const [err, setErr] = useState<string | null>(null)
  return (
    <Screen
      footer={
        <>
          <Button
            title="Continuer"
            onPress={() => {
              if (!sel) return setErr('Aucun compte à créditer : ajoutez d’abord un bénéficiaire vérifié.')
              A.setTf({ c: sel })
              nav.navigate('TfAmount')
            }}
          />
          <Button title="Retour" kind="outline" onPress={() => nav.goBack()} />
        </>
      }
    >
      <Steps step={1} />
      <Card>
        <SelectField label="Compte à créditer" value={sel} onChange={(v: string) => { setErr(null); A.setTf({ c: v }) }} options={opts.map(o => ({ value: o.v, label: o.label }))} placeholder="Choisir" />
        <ErrorText>{err}</ErrorText>
      </Card>
    </Screen>
  )
}

export function TfAmount() {
  const nav = useNavigation<any>()
  const { S, p, A, fmt } = usePortal()
  const f = S.tf
  const [m, setM] = useState(f.m ? String(f.m).replace('.', ',') : '')
  const [dt, setDt] = useState(f.dt || DEFAULT_EXEC_DATE)
  const [mo, setMo] = useState(f.mo || '')
  const [err, setErr] = useState<string | null>(null)
  const d = p.acc[f.d || 0]
  return (
    <Screen
      footer={
        <>
          <Button
            title="Continuer"
            onPress={() => {
              const e = A.validateTfAmount(m)
              if (e) return setErr(e)
              A.setTf({ m: parseAmount(m), dt, mo })
              nav.navigate('TfReview')
            }}
          />
          <Button title="Retour" kind="outline" onPress={() => nav.goBack()} />
        </>
      }
    >
      <Steps step={2} />
      <Card>
        <Txt>Solde disponible : <Txt v="bold" raw>{fmt.E(d[2])}</Txt></Txt>
        <Txt>Plafond de virement disponible (1 jour) : <Txt v="bold" raw>{fmt.E(dailyTransferAvailable())}</Txt></Txt>
        <Field label="Entrer un montant" value={m} onChangeText={t => { setErr(null); setM(t) }} keyboardType="decimal-pad" placeholder="0,00" returnKeyType="next" />
        <Row label="Type de virement" value="Virement standard (1-3 j)" />
        <DateField label="Date d’exécution" value={dt} onChange={setDt} />
        <Field label="Motif du virement (facultatif)" value={mo} onChangeText={setMo} placeholder="Affiché sur les deux comptes" maxLength={140} />
        <ErrorText>{err}</ErrorText>
        <Txt v="small">Virement de démonstration. Aucun mouvement bancaire réel ne sera effectué.</Txt>
      </Card>
    </Screen>
  )
}

function usePlan() {
  const { S, p, fmt } = usePortal()
  const f = S.tf
  const bn = verifiedBeneficiaries(S.ben[S.p])
  const c = f.c || defaultCredit(f.d || 0)
  const target = c[0] === 'a' ? `Mon ${p.acc[+c.slice(1)][0].toLowerCase()} — ${p.n}` : `${bn[+c.slice(1)]?.[0]} (${bn[+c.slice(1)]?.[1]})`
  const limit = c[0] === 'a' ? 'Sans limite' : bn[+c.slice(1)]?.[5] == null ? 'Sans limite' : fmt.R(bn[+c.slice(1)][5] as number)
  return { f, d: p.acc[f.d || 0], target, limit }
}

export function TfReview() {
  const nav = useNavigation<any>()
  const { p, fmt } = usePortal()
  const { f, d, target, limit } = usePlan()
  return (
    <Screen
      footer={
        <>
          <Button title="Approuver le virement" icon="check" onPress={() => nav.navigate('TfApproval')} />
          <Button title="Retour" kind="outline" onPress={() => nav.goBack()} />
        </>
      }
    >
      <Steps step={3} />
      <Card>
        <KVList
          rows={[
            ['Compte à débiter', `${d[0]} — ${p.n}`],
            ['Compte à créditer', target],
            ['Plafond de virement du bénéficiaire', limit],
            ['Montant', fmt.R(f.m || 0)],
            ['Quand', 'Ponctuel'],
            ['Type de virement', 'Virement standard (1-3 j)'],
            ['Date d’exécution', fmt.D(f.dt || DEFAULT_EXEC_DATE)],
            ['Motif du virement', f.mo || 'Non renseigné']
          ]}
        />
      </Card>
    </Screen>
  )
}

export function TfApproval() {
  const nav = useNavigation<any>()
  const { A } = usePortal()
  return (
    <Screen>
      <Steps step={3} />
      <TrustedApproval
        onApproved={() => {
          A.approveTransfer()
          nav.replace('TfDone')
        }}
        onCancel={() => nav.goBack()}
      />
    </Screen>
  )
}

export function TfDone() {
  const nav = useNavigation<any>()
  const { S, A } = usePortal()
  return (
    <Screen
      footer={
        <>
          <Button
            title="Nouveau virement"
            onPress={() => {
              A.resetTf()
              nav.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'Main', params: TO_TRANSFERS }, { name: 'TfFrom' }] }))
            }}
          />
        </>
      }
    >
      <Steps step={4} />
      <Card>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={44} color="#1f7a4d" />
          <Txt v="h3">Instruction transmise</Txt>
        </View>
        <KVList rows={[['Statut', 'En attente de traitement'], ['Référence', S.lastRef]]} />
        <Txt>Le statut définitif apparaîtra dans « Virements programmés et prélèvements » dès confirmation par le service de paiement.</Txt>
      </Card>
    </Screen>
  )
}

/* ───────── beneficiaries ───────── */
export function Beneficiaries() {
  const nav = useNavigation<any>()
  const { S, fmt } = usePortal()
  const list = S.ben[S.p]
  return (
    <Screen footer={<Button title="Ajouter un bénéficiaire" icon="plus" onPress={() => nav.navigate('AddBeneficiary')} />}>
      {list.length === 0 && <Empty icon="user" title="Aucune donnée." />}
      {list.map((b, i) => (
        <Card key={i} onPress={() => nav.navigate('BeneficiaryDetail', { index: i })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="label">{b[0]}</Txt>
              <Txt v="small" raw>{b[1]}</Txt>
              <Txt v="small" raw>{b[5] == null ? 'Sans limite' : fmt.R(b[5])}</Txt>
            </View>
            <Tag>{b[4]}</Tag>
            <Icon name="chevR" size={16} color="#66728a" />
          </View>
        </Card>
      ))}
    </Screen>
  )
}

export function BeneficiaryDetail() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'BeneficiaryDetail'>>()
  const { S, fmt } = usePortal()
  const b = S.ben[S.p][params.index]
  if (!b) return <Screen><Empty title="Aucune donnée." /></Screen>
  return (
    <Screen>
      <Card>
        <Txt v="h3">{b[0]}</Txt>
        <KVList rows={[['Titulaire', b[1]], ['IBAN', b[2]], ['BIC', b[3]], ['Plafond de virement', b[5] == null ? 'Sans limite' : fmt.R(b[5])], ['Statut', b[4]]]} />
        <Txt v="small">Bénéficiaire fictif. Aucune coordonnée bancaire réelle n’est utilisée.</Txt>
      </Card>
    </Screen>
  )
}

export function AddBeneficiary() {
  const nav = useNavigation<any>()
  const { A, t } = usePortal()
  const toast = useToast()
  const [holder, setHolder] = useState('')
  const [usual, setUsual] = useState('')
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [err, setErr] = useState<string | null>(null)
  return (
    <Screen footer={<Button title="Ajouter" onPress={() => {
      const e = A.addBeneficiary(holder, usual, iban, bic)
      if (e) return setErr(e)
      nav.goBack()
    }} />}>
      <Card>
        <Field label="Titulaire du compte" value={holder} onChangeText={setHolder} autoCapitalize="words" returnKeyType="next" />
        <Field label="Nom usuel" value={usual} onChangeText={setUsual} returnKeyType="next" />
        <Field label="IBAN" value={iban} onChangeText={t => { setErr(null); setIban(t) }} autoCapitalize="characters" autoCorrect={false} placeholder="FR76 …" returnKeyType="next" />
        <Field label="BIC" value={bic} onChangeText={setBic} autoCapitalize="characters" autoCorrect={false} />
        <ErrorText>{err}</ErrorText>
        <Txt v="small">La vérification de production reste à définir.</Txt>
      </Card>
    </Screen>
  )
}

/* ───────── limits & scheduled ───────── */
export function TransferLimits() {
  const nav = useNavigation<any>()
  const { fmt } = usePortal()
  return (
    <Screen>
      <Card>
        <Txt v="h3">Plafonds France</Txt>
        {LIM.map((l, i) => (
          <View key={i} style={{ gap: 6, paddingVertical: 8 }}>
            <Row label={l[0]} sub={l[3]} value={`Montant maximal\n${fmt.E(l[1])}`} />
            <Bar used={l[2]} limit={l[1]} />
            <Txt v="small" raw>Utilisé : {fmt.E(l[2])} · {Math.round((l[2] / l[1]) * 100)} %{'\n'}Disponible : {fmt.E(l[1] - l[2])}</Txt>
            <Pressable onPress={() => nav.navigate('LimitInfo')}><Txt v="link">Modifier mon plafond</Txt></Pressable>
          </View>
        ))}
        <Txt v="small">Plafonds et utilisations fictifs, présentés pour la démonstration.</Txt>
      </Card>
    </Screen>
  )
}

export const LimitInfo = () => (
  <Screen>
    <Card>
      <Txt>Toute modification de plafond demande une validation forte. Règles de hausse et de baisse : à définir.</Txt>
    </Card>
  </Screen>
)

export function Scheduled() {
  const nav = useNavigation<any>()
  return (
    <Screen footer={<Button title="Gérer un élément" kind="outline" onPress={() => nav.navigate('ManageUpcoming')} />}>
      <Card><Upcoming /></Card>
    </Screen>
  )
}

export function ManageUpcoming() {
  const nav = useNavigation<any>()
  const toast = useToast()
  const { t } = usePortal()
  return (
    <Screen
      footer={
        <>
          <Button title="Envoyer la demande" onPress={() => { toast(t('Demande transmise. Statut : en attente d’approbation.')); nav.goBack() }} />
          <Button title="Annuler" kind="outline" onPress={() => nav.goBack()} />
        </>
      }
    >
      <Card>
        <Txt>Suspendre, modifier ou annuler : la demande prend effet après approbation et sera confirmée par un statut.</Txt>
      </Card>
    </Screen>
  )
}
