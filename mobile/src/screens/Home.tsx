import React from 'react'
import { Pressable, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Icon } from '../components/Icon'
import { Card, Heading, Row, Screen, Txt } from '../components/ui'
import { P } from '../data/data'
import { usePortal } from '../state/portal'
import { wealth, DEMO_TODAY } from '../services/rules'
import { useTheme } from '../theme'

function CardHead({ icon, title, onPress, label, rule }: { icon: string; title: string; onPress?: () => void; label?: string; rule?: boolean }) {
  const c = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Icon name={icon} color={c.gold} size={24} />
      <View style={{ flex: 1 }}>{rule ? <Heading rule="bar">{title}</Heading> : <Txt v="h3">{title}</Txt>}</View>
      {onPress ? <Icon name="chevR" color={c.mute} size={20} /> : null}
    </Pressable>
  )
}

export default function Home() {
  const nav = useNavigation<any>()
  const c = useTheme()
  const { S, p, A, fmt, lang } = usePortal()
  const w = wealth(S)
  const day = new Date(DEMO_TODAY + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cap = day.charAt(0).toUpperCase() + day.slice(1)
  return (
    <Screen>
      <View>
        <Txt v="small" raw>{cap}</Txt>
        <Heading v="h2" raw style={{ marginVertical: 4 }}>{p.g || `Bonjour ${p.n}`}</Heading>
        <Txt color={c.mute}>Heureux de vous retrouver.</Txt>
      </View>

      <Card>
        <CardHead icon="wallet" title="Mes comptes et épargne de précaution" rule />
        {p.acc.map((a, i) => (
          <Row
            key={i}
            label={a[0]}
            value={fmt.E(a[2])}
            onValue={() => {
              A.setAccountIndex(i)
              nav.navigate('Main', { screen: 'Tabs', params: { screen: 'Accounts' } })
            }}
          />
        ))}
      </Card>

      <Card>
        <CardHead icon="bank" title="Mon patrimoine" onPress={() => nav.navigate('Main', { screen: 'Tabs', params: { screen: 'Wealth' } })} label="Voir le détail du patrimoine" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt v="big" raw>{!S.tog.a || S.hide ? '••• ••• €' : fmt.E(w.net)}</Txt>
          <Pressable onPress={A.toggleHide} accessibilityRole="button">
            <Txt v="link">{S.hide ? 'afficher' : 'masquer'}</Txt>
          </Pressable>
        </View>
        <Txt v="small">
          {S.sp.length === P.length ? 'Tous profils' : 'Profil sélectionné'} · {S.si.length === 2 ? 'Tous établissements' : 'Avec mon conseiller'}
        </Txt>
      </Card>

      <Card>
        <CardHead icon="cashback" title="Mon cashback et mes Points Castelval" rule onPress={() => nav.navigate('CardPoints')} label="Voir mes points et mon cashback" />
        <Txt>
          Mes Points : <Txt v="bold" raw>{fmt.N(p.card ? p.card.pts : 0)}</Txt> · Cashback disponible :{' '}
          <Txt v="bold" raw>{S.hide ? '••••• €' : fmt.N(Math.round(p.card ? p.card.avail : 0)) + ' €'}</Txt>
        </Txt>
      </Card>

      <Card>
        <CardHead icon="plus" title="Souscrire" rule onPress={() => nav.navigate('Subscribe')} label="Souscrire" />
        <Txt>Épargne, crédit, assurance, cartes et paiements.</Txt>
      </Card>

      <Txt v="small">Les montants et opérations présentés servent uniquement à la démonstration.</Txt>
    </Screen>
  )
}
