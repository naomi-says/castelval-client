import React, { useEffect, useState } from 'react'
import { Alert, Image, Pressable, View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import Slider from '@react-native-community/slider'
import { Icon } from '../components/Icon'
import { Bar, Button, Card, Empty, Field, KVList, ListRow, Row, Heading, Screen, SectionTitle, SelectField, SwitchRow, Tag, Txt, useToast } from '../components/ui'
import { RootStackParamList, CardInfoKind } from '../navigation/types'
import { cashbackPosition, clampLimit, LimitFamily, limitMax } from '../services/rules'
import { usePortal } from '../state/portal'
import { fonts, radius, useTheme } from '../theme'
import { OpsList } from './Accounts'

const logo = require('../../assets/logo.png')
const PERIODS = ['1 jour', '7 jours', '30 jours']

function useCard() {
  const { S, p } = usePortal()
  const c = p.card
  const activated = !!S.acts[S.p]
  const cs = S.cs[S.p]
  const status = cs.opp ? 'En opposition' : cs.blk ? 'Bloquée temporairement' : activated ? 'Active' : 'À activer'
  return { c, cs, activated, status }
}

/* ───────── Mes dépenses carte ───────── */
export function CardsScreen() {
  const nav = useNavigation<any>()
  const { S, p, A, fmt } = usePortal()
  const { c } = useCard()
  if (!c) return <Screen><Empty icon="cartes" title="Aucune carte de paiement pour ce profil." /></Screen>
  const marie = c.marie || null
  const all = S.cx === -1 && !!marie
  const own = S.cx === 1 && marie ? marie : c
  const ownLimit = own === marie ? marie!.lim[0] : S.lims[S.p].payment[2]
  const used = all ? c.used[0] + marie!.used[0] : own.used[0]
  const limit = all ? S.lims[S.p].payment[2] + marie!.lim[0] : ownLimit
  const exps = all ? [...c.sp, ...marie!.sp] : own.sp
  return (
    <Screen>
      <Txt v="h2">Mes dépenses carte</Txt>
      <SelectField
        label="Cartes à consulter"
        value={S.cx}
        onChange={(v: number) => A.setCardSelector(+v)}
        options={[
          ...(marie ? [{ value: -1, label: 'Toutes cartes' }] : []),
          { value: 0, label: c.label || 'Carte Jean Dupond' },
          ...(marie ? [{ value: 1, label: marie.label }] : [])
        ]}
      />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading>Niveau des dépenses</Heading>
          <Pressable onPress={() => nav.navigate('CardSettings')}><Txt v="link">Gérer</Txt></Pressable>
        </View>
        <Row label="Dépenses carte sur 30 jours" value={`${fmt.E(used)} / ${fmt.E(limit)}`} />
        <Bar used={used} limit={limit} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt v="small" raw>Utilisé : {fmt.E(used)} · {limit ? Math.round((used / limit) * 100) : 0} %</Txt>
          <Txt v="small" raw>Disponible : {fmt.E(Math.max(0, limit - used))}</Txt>
        </View>
        {all && <Txt v="small">Dépenses et plafonds cumulés des cartes Jean Dupond et Marie Dupond.</Txt>}
      </Card>

      <SectionTitle rule="line">Dernières dépenses carte</SectionTitle>
      <Txt v="small" raw>{exps.length} dépense{exps.length > 1 ? 's' : ''}</Txt>
      {exps.length ? <OpsList rows={exps} searchable={false} /> : <Empty icon="cartes" title="Aucune dépense carte sur cette période." />}

      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon="cashback" title="Mes points et cashback" onPress={() => nav.navigate('CardPoints')} />
        <ListRow icon="cartes" title="Mes réglages de carte" onPress={() => nav.navigate('CardSettings')} />
        <ListRow icon="lock" title="Mes blocages de carte" onPress={() => nav.navigate('CardBlocks')} />
      </Card>
    </Screen>
  )
}

/* ───────── Mes points et cashback ───────── */
export function CardPoints() {
  const nav = useNavigation<any>()
  const { S, fmt } = usePortal()
  const { c } = useCard()
  const th = useTheme()
  if (!c) return <Screen><Empty icon="cartes" title="Aucune carte de paiement pour ce profil." /></Screen>
  const pct = cashbackPosition(c.pts)
  return (
    <Screen>
      <Card>
        <Heading>Mon nombre de points</Heading>
        <Txt>Mon nombre de Points Castelval <Txt v="bold" raw>{fmt.N(c.pts)}</Txt>.</Txt>
        <Txt>
          {c.pts >= 100000
            ? `Ce nombre de Points Castelval donne accès au statut Or, avec une carte offrant un cashback de ${fmt.N(c.rate)} % et des assurances et services niveau Or.`
            : `Ce nombre de Points Castelval donne accès à une carte offrant un cashback de ${fmt.N(c.rate)} %.`}
        </Txt>
        {/* three-step gauge: 0,2 % · 0,5 % · 1 % with the 20 000 / 100 000 thresholds */}
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', height: 30, borderRadius: 6, overflow: 'hidden' }}>
            {['0,2 %', '0,5 %', '1 %'].map((l, i) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: ['#dbe4f3', '#a9bfe3', '#c9a227'][i] }}>
                <Txt raw color="#0f2a4d" style={{ fontFamily: fonts.sansBold, fontSize: 13 }}>{l}</Txt>
              </View>
            ))}
          </View>
          <View style={{ height: 36 }}>
            <Txt v="small" raw style={{ position: 'absolute', left: '33.3%', transform: [{ translateX: -22 }] }}>20 000</Txt>
            <Txt v="small" raw style={{ position: 'absolute', left: '66.6%', transform: [{ translateX: -26 }] }}>100 000</Txt>
            <View style={{ position: 'absolute', left: `${pct}%`, top: -44, alignItems: 'center', transform: [{ translateX: -20 }], width: 40 }}>
              <Txt raw v="bold" style={{ fontSize: 12 }}>{fmt.N(c.pts)}</Txt>
              <View style={{ width: 3, height: 34, backgroundColor: th.navy2 }} />
            </View>
          </View>
        </View>
        <Button title="Comment gagner des Points Castelval" kind="outline" onPress={() => nav.navigate('CardInfo', { kind: 'pts' })} />
      </Card>

      <Card>
        <Heading>Mon cashback gagné grâce à mes points</Heading>
        <Row label="Mon Cashback disponible" bold value={S.hide ? '••••• €' : fmt.N(Math.round(c.avail)) + ' €'} />
        <Txt v="small">Historique de mon Cashback reçu et utilisé</Txt>
        <Button title="Transformer mes Points Castelval en Cashback" kind="outline" onPress={() => nav.navigate('CardInfo', { kind: 'cbx' })} />
        <Button title="Dépenser mon Cashback" kind="outline" onPress={() => nav.navigate('CardInfo', { kind: 'spend' })} />
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Heading style={{ marginTop: 10 }}>Les autres avantages de ma carte</Heading>
        <ListRow icon="shield" title="Mes assurances" onPress={() => nav.navigate('CardInfo', { kind: 'cassur' })} />
        <ListRow icon="device" title="Mon assistance" onPress={() => nav.navigate('CardInfo', { kind: 'cassist' })} />
      </Card>
    </Screen>
  )
}

/* ───────── Mes réglages de carte ───────── */
export function CardSettings() {
  const nav = useNavigation<any>()
  const { p, A, t } = usePortal()
  const { c, cs, activated, status } = useCard()
  const toast = useToast()
  const th = useTheme()
  if (!c) return <Screen><Empty icon="cartes" title="Aucune carte de paiement pour ce profil." /></Screen>
  const num = c.num || '•••• 1842'

  const activate = () =>
    Alert.alert(t('Activer ma carte'), t(`Activez votre carte Castelval ${num} pour retrouver vos services.`), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Activer ma carte'), onPress: () => { A.activateCard(); toast(t('Votre carte est activée.')) } }
    ])
  const block = () => {
    if (cs.blk)
      Alert.alert(t('Débloquer ma carte'), t('Pour des raisons de sécurité, le déblocage de votre carte s’effectue sur votre téléphone de confiance ou avec l’aide de votre conseiller.'), [
        { text: t('Annuler'), style: 'cancel' },
        { text: t('Débloquer ma carte'), onPress: () => { A.setBlocked(false); toast(t('Votre carte est débloquée.')) } }
      ])
    else
      Alert.alert(t('Confirmation blocage carte'), t(`Pour des raisons de sécurité, le déblocage de votre carte s’effectue sur votre téléphone de confiance ou avec l’aide de votre conseiller.\n\nSouhaitez-vous bloquer temporairement votre carte ${num} ?`), [
        { text: t('Annuler'), style: 'cancel' },
        { text: t('Continuer'), onPress: () => { A.setBlocked(true); toast(t('Votre carte de démonstration est bloquée temporairement.')) } }
      ])
  }
  const info = (kind: CardInfoKind) => () => nav.navigate('CardInfo', { kind })
  return (
    <Screen>
      <View style={{ backgroundColor: th.navy2, borderRadius: radius.lg, padding: 18, gap: 18, aspectRatio: 1.6 }}>
        <View style={{ width: 42, height: 32, borderRadius: 6, backgroundColor: '#c9a227' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={logo} style={{ width: 40, height: 17, tintColor: '#fff' }} resizeMode="contain" />
          <Txt raw color="#fff" style={{ fontFamily: fonts.serif, fontSize: 19, lineHeight: 28, letterSpacing: 2.5 }}>CASTELVAL</Txt>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Txt raw color="#dbe4f3" style={{ fontFamily: fonts.sansSemi }}>{c.holder || p.n}</Txt>
            <Txt raw color="#dbe4f3">N° {num}</Txt>
          </View>
          <Txt raw color="#fff" style={{ fontFamily: fonts.sansBold, fontStyle: 'italic', fontSize: 22 }}>VISA</Txt>
        </View>
      </View>

      <Card>
        <Txt v="eyebrow">Compte de paiement · Castelval</Txt>
        <Txt v="h3">Carte Castelval · Visa</Txt>
        <Tag>{status}</Tag>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Button title={activated ? 'Carte activée' : 'Activer ma carte'} disabled={activated} style={{ flex: 1 }} onPress={activate} />
          <Button title="Carte virtuelle" kind="outline" style={{ flex: 1 }} onPress={info('virtual')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Apple Pay" kind="outline" style={{ flex: 1 }} onPress={info('mobilepay')} />
          <Button title="Google Pay" kind="outline" style={{ flex: 1 }} onPress={info('mobilepay')} />
        </View>
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Heading style={{ marginTop: 10 }}>Gestion de la carte</Heading>
        <ListRow title={cs.blk ? 'Débloquer temporairement' : 'Bloquer temporairement'} icon="lock" onPress={block} />
        <ListRow title="Plafond de paiement *" icon="cartes" onPress={() => nav.navigate('CardLimit', { family: 'payment' })} />
        <ListRow title="Plafond de retrait *" icon="cartes" onPress={() => nav.navigate('CardLimit', { family: 'withdrawal' })} />
        <ListRow title="Paiement Internet" icon="globe" right={cs.on ? 'Activé' : 'Non activé'} onPress={info('internet')} />
        <ListRow title="Paiement sans contact" icon="device" right={cs.nfc ? 'Activé' : 'Non activé'} onPress={info('contactless')} />
        <ListRow title="Voir ou changer mon code *" icon="lock" onPress={info('code')} />
        <ListRow title="Voir ma carte *" icon="cartes" onPress={info('viewcard')} />
        <ListRow title="Faire opposition" icon="shield" danger onPress={() => nav.navigate('CardBlocks')} />
      </Card>
      <Txt v="small">* Validation sur votre téléphone de confiance.</Txt>
      <Txt v="small">Carte et opérations de démonstration. Les confirmations sont simulées ; aucune carte réelle n’est modifiée.</Txt>
    </Screen>
  )
}

/* ───────── Mes blocages de carte ───────── */
export function CardBlocks() {
  const nav = useNavigation<any>()
  const { A } = usePortal()
  const { c, cs } = useCard()
  if (!c) return <Screen><Empty icon="cartes" title="Aucune carte de paiement pour ce profil." /></Screen>
  const num = c.num || c.n.slice(-4)
  return (
    <Screen>
      <Card>
        <SwitchRow label="Blocage temporaire" value={cs.blk} onChange={v => A.setBlocked(v)} />
        <Row label="État :" value={<Tag>{cs.opp ? 'Opposition enregistrée' : cs.blk ? 'Bloquée temporairement' : 'Active'}</Tag> as any} />
        <Button
          title="Faire opposition"
          kind="danger"
          disabled={cs.opp}
          onPress={() => nav.navigate('CardInfo', { kind: 'opp' })}
        />
      </Card>
      <Card>
        <Txt v="h3">Historique des oppositions</Txt>
        <Txt>{cs.opp ? 'Opposition enregistrée sur la carte ' + num + '.' : 'Aucune opposition n’a été créée.'}</Txt>
      </Card>
    </Screen>
  )
}

/* ───────── Plafond de paiement / retrait ───────── */
export function CardLimit() {
  const nav = useNavigation<any>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'CardLimit'>>()
  const { S, fmt } = usePortal()
  const { c } = useCard()
  if (!c) return <Screen><Empty icon="cartes" title="Aucune carte de paiement pour ce profil." /></Screen>
  const family = params.family
  const title = family === 'payment' ? 'Plafond de paiement' : 'Plafond de retrait'
  const lims = S.lims[S.p][family]
  const used = (c.ulims && c.ulims[family]) || [0, 0, 0]
  return (
    <Screen>
      <Txt v="h2">{title}</Txt>
      <Card>
        <Txt v="h3" raw>Carte Castelval {c.num || '•••• 1842'}</Txt>
        {PERIODS.map((period, i) => (
          <View key={i} style={{ gap: 8, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: '#dfe4ee' }}>
            <Txt v="label">{title} sur {period}</Txt>
            <Row label="Montant maximal" value={fmt.E(lims[i])} bold />
            <Bar used={used[i]} limit={lims[i]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="small" raw>Utilisé : {fmt.E(used[i])} · {lims[i] ? Math.round((used[i] / lims[i]) * 100) : 0} %</Txt>
              <Txt v="small" raw>Disponible : {fmt.E(Math.max(0, lims[i] - used[i]))}</Txt>
            </View>
            <Button title="Modifier mon plafond" kind="outline" onPress={() => nav.navigate('CardLimitEdit', { family, days: i })} />
          </View>
        ))}
      </Card>
    </Screen>
  )
}

export function CardLimitEdit() {
  const nav = useNavigation<any>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'CardLimitEdit'>>()
  const { S, A, fmt, t } = usePortal()
  const toast = useToast()
  const { family, days } = params as { family: LimitFamily; days: number }
  const max = limitMax(family)
  const [v, setV] = useState(S.lims[S.p][family][days])
  const [raw, setRaw] = useState(String(v))
  const pay = family === 'payment'
  const set = (n: number) => {
    setV(n)
    setRaw(String(n))
  }
  useEffect(() => {
    nav.setOptions({ title: `${pay ? t('Plafond de paiement') : t('Plafond de retrait')} · ${t(PERIODS[days])}` })
  }, [])
  return (
    <Screen
      footer={
        <>
          <Button
            title="Modifier le plafond"
            onPress={() => {
              A.setLimit(family, days, v)
              toast(t('Plafond de carte mis à jour.'))
              nav.goBack()
            }}
          />
          <Button title="Quitter sans modifier" kind="outline" onPress={() => nav.goBack()} />
        </>
      }
    >
      <Card>
        <Heading>Modifier mon {pay ? 'plafond de paiement' : 'plafond de retrait'} · {PERIODS[days]}</Heading>
        <Txt v="label">Choisir mon plafond</Txt>
        <Txt v="big" raw>{fmt.N(v)} €</Txt>
        <Slider minimumValue={0} maximumValue={max} step={500} value={v} onValueChange={n => set(n)} minimumTrackTintColor="#c9a227" thumbTintColor="#c9a227" accessibilityLabel="Choisir mon plafond" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt v="small" raw>0 €</Txt>
          <Txt v="small" raw>{fmt.N(max)} €</Txt>
        </View>
        <Field
          label="Montant du plafond, en euros (par pas de 500 €)"
          value={raw}
          keyboardType="number-pad"
          onChangeText={t => setRaw(t.replace(/[^0-9]/g, ''))}
          onEndEditing={() => set(clampLimit(Number(raw), family))}
        />
      </Card>
    </Screen>
  )
}

/* ───────── small info / confirmation screens (website dialogs) ───────── */
export function CardInfo() {
  const nav = useNavigation<any>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'CardInfo'>>()
  const { p, A, t } = usePortal()
  const { cs, c } = useCard()
  const toast = useToast()
  const kind = params.kind
  const num = c?.num || '•••• 1842'
  const holder = (c && c.holder) || p.n
  const titles: Record<CardInfoKind, string> = {
    activate: 'Activer ma carte', virtual: 'Carte de paiement virtuelle', mobilepay: 'Paiement mobile',
    internet: 'Paiement Internet', contactless: 'Paiement sans contact', code: 'Mon code de carte', viewcard: 'Voir ma carte',
    pts: 'Comment gagner des Points Castelval', cbx: 'Transformer mes Points Castelval en Cashback', spend: 'Dépenser mon Cashback',
    cassur: 'Mes assurances', cassist: 'Mon assistance', opp: 'Faire opposition'
  }
  useEffect(() => {
    nav.setOptions({ title: t(titles[kind]) })
  }, [kind])
  const cardKV: [string, string][] = [['Carte', `Castelval · Visa ${num}`], ['Titulaire', holder]]

  if (kind === 'internet' || kind === 'contactless') {
    const key = kind === 'internet' ? 'on' : 'nfc'
    const on = cs[key]
    return (
      <Screen footer={<>
        <Button title={on ? 'Désactiver' : 'Activer'} onPress={() => { A.toggleCardOption(key); toast(t('La modification sera confirmée sur votre téléphone de confiance.')); nav.goBack() }} />
        <Button title="Annuler" kind="outline" onPress={() => nav.goBack()} />
      </>}>
        <Card>
          <Txt>{kind === 'internet' ? 'Autorisez les paiements sur Internet avec votre carte.' : 'Autorisez le paiement sans contact avec votre carte.'}</Txt>
          <KVList rows={[['État actuel', on ? 'Activé' : 'Non activé']]} />
          <Txt v="small">La modification sera confirmée sur votre téléphone de confiance.</Txt>
        </Card>
      </Screen>
    )
  }
  if (kind === 'activate')
    return (
      <Screen footer={<>
        <Button title="Activer ma carte" onPress={() => { A.activateCard(); toast(t('Votre carte est activée.')); nav.goBack() }} />
        <Button title="Annuler" kind="outline" onPress={() => nav.goBack()} />
      </>}>
        <Card><Txt>Activez votre carte Castelval {num} pour retrouver vos services.</Txt></Card>
      </Screen>
    )
  if (kind === 'opp')
    return (
      <Screen footer={<>
        <Button title="Confirmer l’opposition" kind="danger" onPress={() => { A.setOpposition(); nav.goBack() }} />
        <Button title="Annuler" kind="outline" onPress={() => nav.goBack()} />
      </>}>
        <Card><Txt>La carte sera définitivement bloquée et remplacée.</Txt></Card>
      </Screen>
    )
  return (
    <Screen>
      {kind === 'virtual' && (
        <Card>
          <KVList rows={[['Carte associée', `Castelval · Visa ${num}`], ['Numéro virtuel', '•••• •••• •••• 4421']]} />
          <Txt v="small">Carte virtuelle d’exemple. Ses coordonnées ne permettent pas d’effectuer un paiement.</Txt>
        </Card>
      )}
      {kind === 'mobilepay' && (
        <Card>
          <Txt>Ajoutez votre carte à votre portefeuille Apple Pay ou Google Pay depuis votre téléphone compatible.</Txt>
          <KVList rows={[['Carte', num]]} />
          <Txt v="small">Cette page présente le service. Aucune carte n’est ajoutée à un portefeuille réel dans la démonstration.</Txt>
        </Card>
      )}
      {kind === 'code' && (
        <Card>
          <Txt>Code de démonstration · carte •••• 1842</Txt>
          <Txt v="big" raw style={{ letterSpacing: 8 }}>1234</Txt>
          <Txt v="small">Ce code est fictif et n’est associé à aucune carte réelle.</Txt>
        </Card>
      )}
      {kind === 'viewcard' && (
        <Card>
          <KVList rows={[['Titulaire', p.n], ['Numéro de démonstration', '0000 0000 0000 1842'], ['Date d’expiration', '10/29'], ['Cryptogramme de démonstration', '000']]} />
          <Txt v="small">Ces coordonnées sont fictives et ne permettent aucun paiement.</Txt>
        </Card>
      )}
      {kind === 'pts' && (
        <Card>
          <Txt>Les Points Castelval récompensent votre fidélité.</Txt>
          <KVList rows={[['Votre abonnement mensuel', '90 Points Castelval chaque mois'], ['1 € sur votre compte', '1 Point Castelval chaque mois'], ['10 € sur votre épargne', '1 Point Castelval chaque mois']]} />
        </Card>
      )}
      {kind === 'cbx' && (
        <Card>
          <Txt>Il vous suffit d’utiliser votre carte. Selon le niveau de vos dépenses et votre niveau de Points Castelval, vous bénéficiez d’un niveau de cashback sous forme de Cashback de 0,2 %, 0,5 % ou 1 % de vos dépenses, dans certaines limites.</Txt>
          <Pressable onPress={() => nav.replace('CardInfo', { kind: 'pts' })}><Txt v="link">Détail</Txt></Pressable>
        </Card>
      )}
      {kind === 'spend' && <Empty icon="info" title="En construction" text="Cette page sera ajoutée dans une prochaine version." />}
      {kind === 'cassur' && (
        <Card>
          <KVList rows={cardKV} />
          <Txt>Retrouvez ici les informations relatives aux assurances de votre carte.</Txt>
          <Button title="Déclarer un sinistre" kind="outline" onPress={() => toast(t('Déclaration de sinistre : service de démonstration.'))} />
        </Card>
      )}
      {kind === 'cassist' && (
        <Card>
          <KVList rows={cardKV} />
          <Txt v="small">Aperçu du point d’accès à l’attestation. Aucun document d’assurance réel n’est émis par la démonstration.</Txt>
        </Card>
      )}
      <Button title="Fermer" kind="outline" onPress={() => nav.goBack()} />
    </Screen>
  )
}
