import React, { useEffect, useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Button, Card, Divider, ErrorText, Field, Row, Screen, Segmented, SelectField, Txt, useJob, useToast } from '../components/ui'
import { P } from '../data/data'
import { exportPdf } from '../services/exporter'
import { MANUAL_CATEGORIES, WEALTH_CATS, wealth } from '../services/rules'
import { RootStackParamList, TabParamList } from '../navigation/types'
import { usePortal } from '../state/portal'
import { fonts, useTheme } from '../theme'

export function WealthScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<RouteProp<TabParamList, 'Wealth'>>()
  const { S, A, fmt, lang, t } = usePortal()
  const th = useTheme()
  const { busy, run } = useJob()
  const [tab, setTab] = useState(route.params?.tab ?? 0)
  useEffect(() => {
    if (route.params?.tab != null) setTab(route.params.tab)
  }, [route.params?.tab])
  const w = wealth(S)
  const scope = `${S.sp.length === P.length ? 'Tous profils' : 'Profil sélectionné'} · ${S.si.length === 2 ? 'Tous établissements' : 'Avec mon conseiller'}`

  const exportDetail = () =>
    run(async () => {
      await exportPdf(
        {
          title: 'Mon patrimoine', subtitle: t(scope),
          facts: [['Patrimoine financier', fmt.R(w.finTotal)], ['Biens immobiliers déclarés', fmt.R(w.immTotal)], ['Autre patrimoine', fmt.R(w.autTotal)], ['Total patrimoine brut', fmt.R(w.gross)], ['Crédits · Capital restant dû', fmt.R(w.debt)], ['Total patrimoine net', fmt.R(w.net)]],
          tables: S.sp.map(i => ({
            title: P[i].n,
            table: {
              head: ['Support', 'Établissement', 'Valeur'],
              rows: [
                ...P[i].w.map(y => [y[0], y[1], fmt.R(y[2])]),
                ...S.man.filter(m => m.p === i).map(m => [m.l, 'Déclaré par vous', (m.c === 'dette' ? '−' : '') + fmt.R(m.m)])
              ]
            }
          })),
          note: 'Estimation fondée sur les montants connus et déclarés. Données fictives.'
        },
        lang
      )
    })

  const frame = (i: number, inst: 'Castelval' | 'Hors Castelval') => {
    const list = w.products(i, inst)
    const manual: { k: number; l: string; m: number }[] = []
    if (!list.length && !manual.length) return null
    return (
      <Card key={inst + i}>
        <Row bold label={P[i].n} value={fmt.E(w.sum(list) + manual.reduce((t_, m) => t_ + m.m, 0))} />
        {WEALTH_CATS.map(cat => {
          const rows = list.filter(y => y[4] === cat)
          if (!rows.length) return null
          return (
            <View key={cat}>
              <Txt v="small" style={{ marginTop: 8 }}>{cat}</Txt>
              {rows.map((y, k) => (
                <Row key={k} label={y[0]} sub={`${P[i].n} · ${inst === 'Castelval' ? 'Castelval' : 'Autre établissement'}`} value={fmt.E(y[2])} />
              ))}
            </View>
          )
        })}
        {manual.map(m => (
          <Row key={m.k} label={m.l} sub="Déclaré par vous" value={fmt.E(m.m)} onValue={() => nav.navigate('ManualItem', { index: m.k })} />
        ))}
      </Card>
    )
  }

  const confirmDelete = (k: number) =>
    Alert.alert(t('Supprimer'), t('Supprimer cet élément déclaré ?'), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Supprimer'), style: 'destructive', onPress: () => A.deleteManual(k) }
    ])

  return (
    <Screen>
      <Segmented items={[t('Mes avoirs'), t('Patrimoine net total')]} index={tab} onChange={setTab} />

      {tab === 0 ? (
        <>
          <Card style={{ alignItems: 'center' }}>
            <Txt v="h3">Mes avoirs agrégés ici</Txt>
            <Txt v="big" raw>{fmt.W(w.finTotal)}</Txt>
            <Txt v="small" style={{ textAlign: 'center' }}>{scope}</Txt>
            <Pressable onPress={() => nav.navigate('SettingsAggregation')}><Txt v="link">Périmètre</Txt></Pressable>
          </Card>

          {w.advOn && (
            <>
              <Card style={{ backgroundColor: th.tag }}><Row bold label="Mon patrimoine avec mon conseiller" value={fmt.E(w.advisor)} /></Card>
              {S.sp.map(i => frame(i, 'Castelval'))}
            </>
          )}
          {w.extOn && (
            <>
              <Card style={{ backgroundColor: th.tag }}><Row bold label="Mon patrimoine financier géré dans d’autres établissements" value={fmt.E(w.external)} /></Card>
              {S.sp.map(i => frame(i, 'Hors Castelval'))}
            </>
          )}
          <Button title="Ajouter un avoir géré ailleurs" icon="plus" onPress={() => nav.navigate('ManualItem', { cat: 'fin' })} />
          <Button title="Exporter le détail" kind="outline" icon="download" loading={busy} onPress={exportDetail} />
        </>
      ) : (
        <>
          <Card style={{ alignItems: 'center' }}>
            <Txt v="h3">Patrimoine net estimé</Txt>
            <Txt v="big" raw>{fmt.W(w.net)}</Txt>
            <Txt v="small" style={{ textAlign: 'center' }}>{scope}</Txt>
            <Pressable onPress={() => nav.navigate('SettingsAggregation')}><Txt v="link">Périmètre</Txt></Pressable>
          </Card>

          <Card>
            <Row bold label="Patrimoine financier" value={fmt.E(w.finTotal)} />
            {S.sp.map(i => (
              <View key={i} style={{ marginTop: 8 }}>
                <Row bold label={P[i].n} value={fmt.E(w.finAgr(i) + (w.extOn ? w.finExt(i) : 0))} />
                <Row label="Financier agrégé dans cette application" value={fmt.E(w.finAgr(i))} />
                {w.extOn && <Row label="Financier non agrégé · Autres établissements" value={fmt.E(w.finExt(i))} />}
              </View>
            ))}
          </Card>

          <Card>
            <Row bold label="Biens immobiliers déclarés" value={fmt.E(w.immTotal)} />
            {S.sp.map(i => (
              <View key={i} style={{ marginTop: 8 }}>
                <Row bold label={P[i].n} value={fmt.E(w.imm(i))} />
                {P[i].w.filter(y => y[3] === 'imm').map((y, k) => <Row key={k} label={y[0]} value={fmt.E(y[2])} />)}
                {S.man.map((m, k) => ({ m, k })).filter(({ m }) => m.p === i && m.c === 'imm').map(({ m, k }) => (
                  <Row key={'m' + k} label={m.l} sub="Déclaré par vous" value={fmt.E(m.m)} />
                ))}
              </View>
            ))}
          </Card>

          <Card>
            <Row bold label="Autre patrimoine ajouté manuellement" value={fmt.E(w.autTotal)} />
            {S.sp.map(i => <Row key={i} label={P[i].n} value={fmt.E(w.aut(i))} />)}
          </Card>

          <Card><Row bold label="Total patrimoine brut" value={<Txt v="big" raw style={{ fontSize: 22 }}>{fmt.E(w.gross)}</Txt>} /></Card>

          <Card>
            <Row bold label="Crédits · Capital restant dû" value={fmt.E(w.debt)} />
            {S.sp.map(i => (
              <View key={i} style={{ marginTop: 8 }}>
                <Row bold label={P[i].n} value={fmt.E(w.debtOf(i))} />
                {P[i].loan.map((l, k) => <Row key={k} label={l.n} sub={`${l.m} mois restants`} value={fmt.E(l.cap)} />)}
                {S.man.map((m, k) => ({ m, k })).filter(({ m }) => m.p === i && m.c === 'dette').map(({ m, k }) => (
                  <Row key={'d' + k} label={m.l} sub="Déclaré par vous" value={fmt.E(m.m)} />
                ))}
              </View>
            ))}
          </Card>

          <Card>
            <Row bold label="Total patrimoine net" value={<Txt v="big" raw style={{ fontSize: 26 }}>{fmt.E(w.net)}</Txt>} />
            <Txt v="small">Estimation fondée sur les montants connus et déclarés. Hypothèse : biens intégralement détenus par chaque profil, sans pondération de la participation de Jean Dupond dans la Holding. Données fictives.</Txt>
          </Card>

          {S.man.some(m => S.sp.includes(m.p)) && (
            <Card>
              <Txt v="h3">Éléments déclarés par vous</Txt>
              {S.man.map((m, k) => ({ m, k })).filter(({ m }) => S.sp.includes(m.p)).map(({ m, k }, n) => (
                <View key={k}>
                  {n > 0 && <Divider />}
                  <View style={{ paddingVertical: 8, gap: 4 }}>
                    <Row label={m.l} sub={P[m.p].n} value={(m.c === 'dette' ? '−' : '') + fmt.E(m.m)} bold />
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                      <Pressable onPress={() => nav.navigate('ManualItem', { index: k })}><Txt v="link">Modifier</Txt></Pressable>
                      <Pressable onPress={() => confirmDelete(k)}><Txt v="link" color={th.neg}>Supprimer</Txt></Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}

          <Button title="Ajouter un élément" icon="plus" onPress={() => nav.navigate('ManualItem', { cat: 'imm' })} />
          <Button title="Exporter le détail" kind="outline" icon="download" loading={busy} onPress={exportDetail} />
        </>
      )}
    </Screen>
  )
}

/* ───────── add / edit a declared item (website: 'man' dialog) ───────── */
export function ManualItemScreen() {
  const nav = useNavigation<any>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'ManualItem'>>()
  const { S, A, t } = usePortal()
  const toast = useToast()
  const editing = params?.index ?? -1
  const x = editing >= 0 ? S.man[editing] : null
  const [profile, setProfile] = useState(x ? x.p : S.p)
  const [cat, setCat] = useState(x ? (x.f ? 'imm-p' : x.c) : params?.cat || 'fin')
  const [label, setLabel] = useState(x ? x.l : '')
  const [amount, setAmount] = useState(x ? String(x.m).replace('.', ',') : '')
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    nav.setOptions({ title: t(editing < 0 ? 'Ajouter un élément déclaré' : 'Modifier un élément déclaré') })
  }, [editing, t])
  const save = () => {
    const e = A.saveManual(editing, { profile, cat, label, amountRaw: amount })
    if (e) return setErr(e)
    nav.goBack()
  }
  return (
    <Screen footer={<Button title="Enregistrer" onPress={save} />}>
      <Card>
        <SelectField label="Profil" value={profile} onChange={(v: number) => setProfile(+v)} options={P.map((q, i) => ({ value: i, label: q.n }))} />
        <SelectField label="Catégorie" value={cat} onChange={setCat} options={MANUAL_CATEGORIES.map(([v, l]) => ({ value: v, label: t(l) }))} />
        <Field label="Intitulé" value={label} onChangeText={v => { setErr(null); setLabel(v) }} returnKeyType="next" />
        <Field label="Montant (€)" value={amount} onChangeText={v => { setErr(null); setAmount(v) }} keyboardType="decimal-pad" />
        <ErrorText>{err}</ErrorText>
      </Card>
      {editing >= 0 && (
        <Button
          title="Supprimer"
          kind="danger"
          icon="trash"
          onPress={() =>
            Alert.alert(t('Supprimer'), t('Supprimer cet élément déclaré ?'), [
              { text: t('Annuler'), style: 'cancel' },
              { text: t('Supprimer'), style: 'destructive', onPress: () => { A.deleteManual(editing); nav.goBack() } }
            ])
          }
        />
      )}
    </Screen>
  )
}
