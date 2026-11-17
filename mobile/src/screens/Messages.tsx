import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Linking, Pressable, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Icon } from '../components/Icon'
import { Button, Card, Empty, ErrorText, Field, KVList, Screen, Segmented, SelectField, Txt, useToast } from '../components/ui'
import { MAIL_OBJ, RDV_OBJ } from '../data/data'
import { RootStackParamList } from '../navigation/types'
import { filterMail, MailItem } from '../services/rules'
import { INBOX, usePortal } from '../state/portal'
import { fonts, radius, useStyles, useTheme } from '../theme'

const SIM = 'Simulation. Aucun message réel n’est envoyé.'

export function Messages() {
  const nav = useNavigation<any>()
  const route = useRoute<RouteProp<RootStackParamList, 'Messages'>>()
  const { S, fmt, t } = usePortal()
  const c = useTheme()
  const [tab, setTab] = useState<number>(route.params?.tab ?? 0)
  const [q, setQ] = useState('')
  useEffect(() => {
    if (route.params?.tab != null) setTab(route.params.tab)
  }, [route.params?.tab])
  const src = tab === 0 ? INBOX : tab === 1 ? S.sent : S.drafts
  const rows = useMemo(() => filterMail(src, q, fmt.DL).map(m => ({ m, i: src.indexOf(m) })), [src, q, fmt.loc])
  const empty = q ? 'Aucun message ne correspond à votre recherche.' : tab === 0 ? 'Aucun message reçu.' : tab === 1 ? 'Aucun message envoyé.' : 'Aucun brouillon.'
  const s = useStyles(col => ({ row: { gap: 3, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: col.line } }))
  return (
    <Screen footer={<Button title="Nouveau message" icon="edit" onPress={() => { nav.navigate('MessageCompose') }} />}>
      <Txt v="eyebrow">VOTRE ESPACE CASTELVAL</Txt>
      <Segmented items={[t('Reçu'), t('Envoyé'), t('Brouillon')]} index={tab} onChange={setTab} />
      <Field label="Rechercher des messages" value={q} onChangeText={setQ} placeholder="Rechercher des messages" returnKeyType="search" />
      {rows.length === 0 ? (
        <Empty icon="mail" title={empty} />
      ) : (
        <Card style={{ paddingVertical: 0, gap: 0 }}>
          {rows.map(({ m, i }) => {
            const unread = tab === 0 && i === 0 && !S.read.includes(0)
            return (
              <Pressable key={`${tab}-${i}`} accessibilityRole="button" onPress={() => nav.navigate('MessageRead', { box: tab, index: i })} style={s.row}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.gold }} />}
                  <Txt v="small" raw style={{ flex: 1 }}>{fmt.DL(m.date)}</Txt>
                  <Txt v="small">{tab === 0 ? 'De' : 'À'} : {m.from}</Txt>
                </View>
                <Txt v="bold" style={{ fontFamily: unread ? fonts.sansBold : fonts.sansSemi }}>{m.subject}</Txt>
                <Txt v="small" numberOfLines={2}>{m.preview}</Txt>
              </Pressable>
            )
          })}
        </Card>
      )}
      <Txt v="small">{SIM}</Txt>
    </Screen>
  )
}

export function MessageRead() {
  const nav = useNavigation<any>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'MessageRead'>>()
  const { S, A, fmt, t } = usePortal()
  const list = params.box === 0 ? INBOX : params.box === 1 ? S.sent : S.drafts
  const m: MailItem | undefined = list[params.index]
  useEffect(() => {
    if (params.box === 0) A.markRead(params.index)
  }, [])
  if (!m) return <Screen><Empty icon="mail" title="Aucun message." /></Screen>
  const isDraft = params.box === 2
  return (
    <Screen
      footer={
        <>
          {params.box === 0 && <Button title="Répondre" icon="mail" onPress={() => { A.startReply(m); nav.navigate('MessageCompose') }} />}
          <Button title="Retour aux messages" kind="outline" onPress={() => nav.goBack()} />
        </>
      }
    >
      <Txt v="eyebrow">VOTRE ESPACE CASTELVAL</Txt>
      <Txt v="h3">{m.subject}</Txt>
      <Card>
        <KVList rows={[['Date', fmt.DL(m.date)], [params.box === 0 ? 'De' : 'À', m.from], ['Objet', m.subject]]} />
      </Card>
      <Card>
        <Txt>{m.body}</Txt>
        {m.file ? (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Icon name="clip" size={16} color="#66728a" />
            <Txt v="small" raw>{m.file}</Txt>
          </View>
        ) : null}
      </Card>
      <Txt v="small">{SIM}</Txt>
    </Screen>
  )
}

export function MessageCompose() {
  const nav = useNavigation<any>()
  const { S, A, t } = usePortal()
  const toast = useToast()
  const c = useTheme()
  const m = S.compose
  const [err, setErr] = useState<string | null>(null)
  const opts = m.obj && !MAIL_OBJ.includes(m.obj) ? [m.obj, ...MAIL_OBJ] : MAIL_OBJ

  const pick = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false })
      if (r.canceled || !r.assets?.length) return
      const a = r.assets[0]
      A.setCompose({ file: { name: a.name, uri: a.uri, size: a.size, mime: a.mimeType } })
    } catch {
      setErr('Impossible de joindre ce document.')
    }
  }
  const send = () => {
    const e = A.sendMail()
    if (e) return setErr(e)
    toast(t('Message envoyé (démonstration).'))
    nav.navigate('Messages', { tab: 1 })
  }
  const save = () => {
    const e = A.saveDraft()
    if (e) return setErr(e)
    toast(t('Brouillon enregistré.'))
    nav.navigate('Messages', { tab: 2 })
  }
  return (
    <Screen
      footer={
        <>
          <Button title="Envoyer" icon="check" onPress={send} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Enregistrer le brouillon" kind="outline" style={{ flex: 1 }} onPress={save} />
            <Button title="Retour" kind="outline" style={{ flex: 1 }} onPress={() => nav.goBack()} />
          </View>
        </>
      }
    >
      <Txt v="eyebrow">VOTRE ESPACE CASTELVAL</Txt>
      <SelectField label="Objet du message" value={m.obj} placeholder="Choisir un objet" onChange={(v: string) => { setErr(null); A.setCompose({ obj: v }) }} options={opts.map(o => ({ value: o, label: t(o) }))} />
      <View style={{ gap: 8 }}>
        <Button title="Joindre un document" kind="outline" icon="clip" onPress={pick} />
        {m.file && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.tag, borderRadius: radius.md, padding: 10 }}>
            <Icon name="clip" size={16} color={c.tagText} />
            <Txt v="label" raw style={{ flex: 1 }} numberOfLines={1}>{m.file.name}</Txt>
            <Pressable accessibilityLabel="Retirer la pièce jointe" onPress={() => A.setCompose({ file: null })} hitSlop={10}>
              <Icon name="close" size={18} color={c.tagText} />
            </Pressable>
          </View>
        )}
      </View>
      <Field label="Votre message" value={m.body} onChangeText={v => { setErr(null); A.setCompose({ body: v }) }} multiline />
      <ErrorText>{err}</ErrorText>
      <Txt v="small">{SIM}</Txt>
    </Screen>
  )
}

/* ───────── Nous contacter ───────── */
export function Contact() {
  const toast = useToast()
  const { t } = usePortal()
  const cards = [
    { h: 'Castelval', n: 'Mme Laurence MARTIN', a: ['18 rue Vignon', '75009 Paris'], t: '01 400 600 21' },
    { h: 'Mon conseiller', n: 'Mme Jeanne DURAND · Capital Conseil', a: ['24 rue du Conseil', '75008 Paris'], note: 'Adresse fictive de démonstration', t: '06 01 02 03 04' }
  ]
  return (
    <Screen>
      <Txt v="eyebrow">VOTRE ESPACE CASTELVAL</Txt>
      {cards.map(k => (
        <Card key={k.h}>
          <Txt v="h3">{k.h}</Txt>
          <Txt v="label" raw>{k.n}</Txt>
          {k.a.map(l => <Txt key={l} raw>{l}</Txt>)}
          {k.note && <Txt v="small">{k.note}</Txt>}
          <Txt v="bold" raw>{k.t}</Txt>
          <Txt v="small">Appel sécurisé dans l’application</Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Appeler" icon="phone" style={{ flex: 1 }} onPress={() => Linking.openURL('tel:' + k.t.replace(/\s/g, '')).catch(() => toast(t('Cette démonstration ne prend pas en charge les appels.')))} />
            <Button title="Visioconférence" icon="video" kind="outline" style={{ flex: 1 }} onPress={() => toast(t('Cette démonstration ne prend pas en charge les visioconférences.'))} />
          </View>
        </Card>
      ))}
      <Txt v="small">Cette démonstration ne prend pas en charge les appels.</Txt>
      <Txt v="eyebrow">Démonstration</Txt>
    </Screen>
  )
}

export function Appointment() {
  const nav = useNavigation<any>()
  const { S, A, t } = usePortal()
  const toast = useToast()
  return (
    <Screen>
      <Txt v="eyebrow">VOTRE ESPACE CASTELVAL</Txt>
      <Card>
        <SelectField label="Objet du RDV" value={S.rdvObj} placeholder="Choisir un objet" onChange={(v: string) => A.setRdvObj(v)} options={RDV_OBJ.map(o => ({ value: o, label: t(o) }))} />
        <Txt v="small">Simulation. Aucun rendez-vous réel n’est réservé.</Txt>
      </Card>
    </Screen>
  )
}
