import React, { useEffect, useState } from 'react'
import { Image, Pressable, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { TrustedApproval } from '../components/Approval'
import { Icon } from '../components/Icon'
import { Button, Card, Divider, KVList, ListRow, RadioRow, Screen, Segmented, SwitchRow, Tag, Txt, useToast } from '../components/ui'
import { P, TABS } from '../data/data'
import { ApprovalKind, RootStackParamList } from '../navigation/types'
import { maskPair } from '../services/rules'
import { useAuth } from '../state/auth'
import { usePortal } from '../state/portal'
import { fonts, useTheme } from '../theme'

export function Profile() {
  const nav = useNavigation<any>()
  const route = useRoute<RouteProp<RootStackParamList, 'Profile'>>()
  const { S, p, A, t } = usePortal()
  const toast = useToast()
  const c = useTheme()
  const [sec, setSec] = useState(route.params?.section ?? 0)
  const [imgOk, setImgOk] = useState(true)
  const pickPhoto = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      if (r.canceled || !r.assets?.length) return
      const a = r.assets[0]
      if (a.mimeType && !/^image\//.test(a.mimeType)) return toast(t('Choisissez une image (JPG ou PNG).'))
      A.setAvatar(a.uri)
      setImgOk(true)
      toast(t('Votre photo de profil a été mise à jour.'))
    } catch {
      toast(t('Choisissez une image (JPG ou PNG).'))
    }
  }
  return (
    <Screen>
      {sec === 0 && (
        <Card style={{ alignItems: 'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Ajouter une photo" onPress={pickPhoto}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: c.navy2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {S.avatar && imgOk ? (
                <Image source={{ uri: S.avatar }} style={{ width: 92, height: 92 }} onError={() => setImgOk(false)} />
              ) : (
                <Txt raw color="#fff" style={{ fontFamily: fonts.serif, fontSize: 34 }}>{p.ini || 'JD'}</Txt>
              )}
            </View>
            <View style={{ position: 'absolute', right: -2, bottom: -2, backgroundColor: c.gold, borderRadius: 14, padding: 6 }}>
              <Icon name="camera" size={16} color="#0f2a4d" />
            </View>
          </Pressable>
          <Txt v="h3" raw>{p.n}</Txt>
          <Txt v="small" raw>{p.email}</Txt>
          <Pressable onPress={() => nav.navigate('ConnectionHistory')}>
            <Txt v="link">Dernière connexion le {p.login || '06/10/2026 à 18h10'}</Txt>
          </Pressable>
          <Pressable onPress={() => nav.navigate('Settings')}><Txt v="link">Paramètres</Txt></Pressable>
        </Card>
      )}
      <Segmented items={TABS.profil.map(x => t(x))} index={sec} onChange={setSec} />
      {sec === 0 && (
        <>
          <Txt>Vos coordonnées sont partiellement masquées sur cet écran.</Txt>
          <Pressable onPress={A.toggleReveal}><Txt v="link">{S.rev ? 'Masquer les coordonnées' : 'Afficher les coordonnées en clair'}</Txt></Pressable>
        </>
      )}
      <Card>
        <KVList rows={p.pf[sec].map(r => maskPair(r, S.rev))} />
      </Card>
      {sec === 0 && <Txt v="small">Pour ajouter une coordonnée ou déclarer une adresse fiscale différente, contactez votre conseiller Castelval.</Txt>}
    </Screen>
  )
}

export function ProfileSwitch() {
  const nav = useNavigation<any>()
  const { S, A, p } = usePortal()
  return (
    <Screen>
      <Txt>Choisissez l’espace que vous souhaitez consulter.</Txt>
      <Txt v="small">Profils pour lesquels votre accès a été vérifié à la connexion.</Txt>
      {P.map((q, i) => (
        <Card key={i}>
          <Txt v="h3" raw>{q.n}</Txt>
          <Tag>{q.t}</Tag>
          <Txt v="small">{q.t === 'Personne physique' ? 'Mon espace personnel' : 'Espace de la holding · Procuration'}</Txt>
          {i === S.p ? (
            <Txt v="bold">Profil actif</Txt>
          ) : (
            <Button
              title="Accéder"
              onPress={() => {
                A.switchProfile(i)
                nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }))
              }}
            />
          )}
        </Card>
      ))}
      <Txt v="small" raw>{p.n} · Espace actuel</Txt>
    </Screen>
  )
}

/* ───────── Paramètres ───────── */
export function Settings() {
  const nav = useNavigation<any>()
  return (
    <Screen>
      <Card style={{ paddingVertical: 4 }}>
        <Txt v="h3" style={{ marginTop: 10 }}>Ma sécurité</Txt>
        <ListRow icon="lock" title="Mon code de sécurité" onPress={() => nav.navigate('Approval', { kind: 'code' })} />
        <ListRow icon="device" title="Mes téléphones de confiance" onPress={() => nav.navigate('Approval', { kind: 'phones' })} />
        <ListRow icon="shield" title="Modifier mon mot de passe" onPress={() => nav.navigate('Approval', { kind: 'password' })} />
        <ListRow icon="documents" title="Mon historique de connexion" onPress={() => nav.navigate('ConnectionHistory')} />
      </Card>
      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon="bank" title="Patrimoine financier à agréger" onPress={() => nav.navigate('SettingsAggregation')} />
        <ListRow icon="mail" title="Mes paramètres de contact" onPress={() => nav.navigate('SettingsContact')} />
        <ListRow icon="bell" title="Alertes et évènements" onPress={() => nav.navigate('SettingsAlerts')} />
      </Card>
      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon="info" title="FAQ" onPress={() => nav.navigate('InfoPage', { kind: 'faq' })} />
        <ListRow icon="plus" title="Notre offre" onPress={() => nav.navigate('Subscribe')} />
        <ListRow icon="phone" title="Nous contacter" onPress={() => nav.navigate('Contact')} />
        <ListRow icon="documents" title="Mentions légales" onPress={() => nav.navigate('InfoPage', { kind: 'legal' })} />
        <ListRow icon="lock" title="Politique des cookies" onPress={() => nav.navigate('InfoPage', { kind: 'cookies' })} />
        <ListRow icon="user" title="Accessibilité" onPress={() => nav.navigate('InfoPage', { kind: 'a11y' })} />
      </Card>
      <Txt v="small" style={{ textAlign: 'center' }}>© 2026 Castelval · Votre espace client</Txt>
    </Screen>
  )
}

export function SettingsContact() {
  const nav = useNavigation<any>()
  const { S, A, t } = usePortal()
  const toast = useToast()
  return (
    <Screen footer={<Button title="Enregistrer" onPress={() => { toast(t('Vos préférences de contact ont été enregistrées (démonstration).')); nav.goBack() }} />}>
      <Card>
        <SwitchRow label="Me prévenir des messages sécurisés reçus" value={S.tog.g} onChange={v => A.setTog('g', v)} />
        <SwitchRow label="Notifications de l’application" value={S.tog.h} onChange={v => A.setTog('h', v)} />
        <Txt v="small">Préférences de démonstration. Aucune notification réelle n’est envoyée.</Txt>
      </Card>
    </Screen>
  )
}

export function SettingsAlerts() {
  const { S, A } = usePortal()
  return (
    <Screen>
      <Card>
        <SwitchRow label="Alerte de mouvement important" value={S.tog.e} onChange={v => A.setTog('e', v)} />
        <SwitchRow label="Alerte d’opération par carte" value={S.tog.f} onChange={v => A.setTog('f', v)} />
      </Card>
    </Screen>
  )
}

export function SettingsAggregation() {
  const { S, p, A } = usePortal()
  const allP = P.map((_, i) => i)
  const allSi = ['Castelval', 'Hors Castelval']
  const same = (a: number[], b: number[]) => a.length === b.length && a.every(v => b.includes(v))
  return (
    <Screen>
      <Card>
        <Txt v="h3">Établissements à agréger</Txt>
        <Txt v="small">(modifie à la fois la page d’accueil et mon patrimoine)</Txt>
        <RadioRow label="Avec mon conseiller" selected={!S.si.includes('Hors Castelval')} onPress={() => A.setAgg('si', ['Castelval'])} />
        <RadioRow label="Tous établissements" selected={S.si.includes('Hors Castelval')} onPress={() => A.setAgg('si', allSi)} />
      </Card>
      <Card>
        <Txt v="h3">Profils à agréger</Txt>
        <Txt v="small">(modifie à la fois la page d’accueil et mon patrimoine)</Txt>
        <RadioRow label={p.n} selected={same(S.sp, [S.p])} onPress={() => A.setAgg('sp', [S.p])} />
        <RadioRow label="Tous profils" note={P.map(q => q.n).join(', ')} selected={same(S.sp, allP)} onPress={() => A.setAgg('sp', allP)} />
      </Card>
      <Card>
        <Txt v="h3">Affichage sur la page d’accueil</Txt>
        <SwitchRow label="Afficher le total agrégé sur la page d’accueil" value={S.tog.a} onChange={v => A.setTog('a', v)} />
        <SwitchRow label="Masquer le total lorsqu’on arrive la première fois sur la page d’accueil" value={S.arr} onChange={v => A.setTog('b', v)} />
      </Card>
    </Screen>
  )
}

export function ConnectionHistory() {
  const { session } = useAuth()
  const { fmt, lang } = usePortal()
  const cur = session ? new Date(session.createdAt) : null
  const rows: [string, string][] = [
    ...(cur
      ? ([[cur.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long', timeStyle: 'short' }), 'Application mobile · Session en cours']] as [string, string][])
      : []),
    ['6 octobre 2026 à 18:10', 'Navigateur web · Session de démonstration'],
    ['5 octobre 2026 à 15:43', 'Navigateur web · Connexion d’exemple']
  ]
  return (
    <Screen>
      <Card>
        {rows.map(([d, w], i) => (
          <View key={i}>
            {i > 0 && <Divider />}
            <View style={{ paddingVertical: 10, gap: 2 }}>
              <Txt v="label">{d}</Txt>
              <Txt v="small">{w}</Txt>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  )
}

export function Approval() {
  const nav = useNavigation<any>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'Approval'>>()
  const { t } = usePortal()
  const toast = useToast()
  const [done, setDone] = useState(false)
  const kind: ApprovalKind = params.kind
  useEffect(() => {
    const titles: Record<ApprovalKind, string> = { code: 'Mon code de sécurité', phones: 'Mes téléphones de confiance', password: 'Modifier mon mot de passe' }
    nav.setOptions({ title: t(titles[kind]) })
  }, [kind, t])
  if (kind === 'code')
    return (
      <Screen>
        <Card>
          <Txt v="h3">Validation sur votre téléphone de confiance</Txt>
          <Txt>Parcours de référence : aucune notification réelle n’est envoyée.</Txt>
        </Card>
      </Screen>
    )
  return (
    <Screen>
      {done ? (
        <Card>
          <Icon name="check" size={40} color="#1f7a4d" />
          <Txt v="h3">Validation enregistrée</Txt>
          <Txt>Demande transmise. Statut : en attente d’approbation.</Txt>
          <Button title="Fermer" onPress={() => nav.goBack()} />
        </Card>
      ) : (
        <TrustedApproval onApproved={() => { setDone(true); toast(t('Validation enregistrée (démonstration).')) }} onCancel={() => nav.goBack()} />
      )}
    </Screen>
  )
}
