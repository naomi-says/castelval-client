import React, { useEffect, useState } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import { View } from 'react-native'
import { Icon } from './Icon'
import { Button, Card, Txt } from './ui'
import { usePortal } from '../state/portal'
import { useTheme } from '../theme'

/* Website: "Validation sur votre téléphone de confiance … J’ai validé (simulation)".
   The phone *is* the trusted device, so the validation is the device's own biometric / passcode
   prompt. Where the device has none enrolled, the website's simulated confirmation is offered. */
export function TrustedApproval({ onApproved, onCancel }: { onApproved: () => void; onCancel?: () => void }) {
  const { t } = usePortal()
  const c = useTheme()
  const [native, setNative] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const hw = await LocalAuthentication.hasHardwareAsync()
        const enrolled = await LocalAuthentication.isEnrolledAsync()
        setNative(hw && enrolled)
      } catch {
        setNative(false)
      }
    })()
  }, [])

  const verify = async () => {
    setBusy(true)
    setErr(null)
    try {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: t('Validation sur votre téléphone de confiance'),
        cancelLabel: t('Annuler'),
        fallbackLabel: t('Code de l’appareil')
      })
      if (r.success) onApproved()
      else setErr('La validation a été annulée ou a échoué.')
    } catch {
      setErr('La validation a échoué. Veuillez réessayer.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <View style={{ alignItems: 'center', paddingVertical: 8, gap: 8 }}>
        <Icon name="device" size={44} color={c.gold} />
        <Txt v="h3" style={{ textAlign: 'center' }}>Validation sur votre téléphone de confiance</Txt>
      </View>
      {native ? (
        <Txt style={{ textAlign: 'center' }}>Confirmez avec la biométrie ou le code de cet appareil.</Txt>
      ) : (
        <Txt style={{ textAlign: 'center' }}>Parcours de référence : aucune notification réelle n’est envoyée.</Txt>
      )}
      {err ? <Txt v="err" style={{ textAlign: 'center' }}>{err}</Txt> : null}
      {native === null ? null : native ? (
        <Button title="Valider avec mon appareil" icon="lock" loading={busy} onPress={verify} />
      ) : (
        <Button title="J’ai validé (simulation)" onPress={onApproved} />
      )}
      {onCancel && <Button title="Annuler" kind="outline" onPress={onCancel} />}
    </Card>
  )
}
