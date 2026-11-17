import React, { useState } from 'react'
import { Image, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Field, Screen, Txt } from '../components/ui'
import { useAuth } from '../state/auth'
import { usePortal } from '../state/portal'
import { fonts, useStyles } from '../theme'

const logo = require('../../assets/logo.png')

export default function Login() {
  const { signIn, expired, clearExpired } = useAuth()
  const { lang, A } = usePortal()
  const insets = useSafeAreaInsets()
  /* same pre-filled demo credentials as the website's Login.jsx */
  const [id, setId] = useState('DEMO2026')
  const [pw, setPw] = useState('demo1234')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const s = useStyles(c => ({
    hero: { backgroundColor: c.navy2, alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 6 },
    form: { padding: 20, gap: 14 }
  }))

  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      await signIn(id, pw)
    } catch {
      setErr('Connexion impossible. Veuillez réessayer.')
      setBusy(false)
    }
  }

  return (
    <Screen style={{ padding: 0, gap: 0 }}>
      <View style={[s.hero, { paddingTop: insets.top + 24 }]}>
        <Image source={logo} style={{ width: 120, height: 52, tintColor: '#fff', marginTop: 24 }} resizeMode="contain" />
        <Txt raw color="#fff" style={{ fontFamily: fonts.serif, fontSize: 38, lineHeight: 56, paddingTop: 6, paddingHorizontal: 6, letterSpacing: 5, includeFontPadding: true }}>CASTELVAL</Txt>
        <Txt raw color="rgba(255,255,255,0.62)" style={{ fontFamily: fonts.sansSemi, letterSpacing: 9 }}>FINANCE</Txt>
        <Txt color="#b7c4dc" style={{ textAlign: 'center', marginTop: 10, maxWidth: 320 }}>
          Votre patrimoine, suivi en toute transparence avec votre conseiller dédié.
        </Txt>
      </View>
      <View style={s.form}>
        <Txt v="h2">Votre espace client Castelval</Txt>
        <Txt v="small">Démonstration : cliquez sur « Suivant ».</Txt>
        {expired && (
          <Pressable onPress={clearExpired}>
            <Txt v="err">Votre session a expiré par inactivité. Veuillez vous reconnecter.</Txt>
          </Pressable>
        )}
        <Field label="Votre identifiant" value={id} onChangeText={setId} autoCapitalize="characters" autoCorrect={false} autoComplete="username" textContentType="username" returnKeyType="next" />
        <Field label="Code secret" value={pw} onChangeText={setPw} secureTextEntry autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
        {err ? <Txt v="err">{err}</Txt> : null}
        <Button title="Suivant" onPress={submit} loading={busy} />
        <Pressable onPress={() => A.setLang(lang === 'en' ? 'fr' : 'en')} style={{ alignSelf: 'center', padding: 10 }}>
          <Txt v="link" raw>{lang === 'en' ? 'Français' : 'English'}</Txt>
        </Pressable>
      </View>
    </Screen>
  )
}
