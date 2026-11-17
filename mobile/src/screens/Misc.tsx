import React, { useEffect } from 'react'
import { View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Icon } from '../components/Icon'
import { Button, Card, ListRow, Screen, Txt, useToast } from '../components/ui'
import { InfoKind, RootStackParamList } from '../navigation/types'
import { usePortal } from '../state/portal'

const SECTIONS: [string, string, string[]][] = [
  ['comptes', 'Épargne', ['Livret Castelval F', 'Livret Castelval B', 'DAT CFCA']],
  ['credits', 'Crédit', ['Crédit de trésorerie', 'Crédit de financement d’actif', 'Montage patrimonial']],
  ['assurances', 'Assurance', ['Assurance habitation', 'Assurance automobile']],
  ['cartes', 'Carte et paiements', ['Ouvrir un nouveau compte', 'Souscrire une nouvelle carte', 'Monter en gamme']]
]

export function Subscribe() {
  const toast = useToast()
  const { t } = usePortal()
  return (
    <Screen>
      <Txt>Que souhaitez-vous souscrire ?</Txt>
      {SECTIONS.map(([ic, title, rows]) => (
        <Card key={ic} style={{ paddingVertical: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Icon name={ic} size={24} color="#c9a227" />
            <Txt v="h3">{title}</Txt>
          </View>
          {rows.map(r => (
            <ListRow key={r} title={r} onPress={() => toast(t('Demande transmise : votre conseiller vous recontacte.'))} />
          ))}
        </Card>
      ))}
      <Txt v="small">Aperçu des rubriques de la démonstration. Aucune souscription ni demande de financement ne peut être réalisée ici.</Txt>
    </Screen>
  )
}

const INFO: Record<InfoKind, { title: string; paras: [string | null, string][] }> = {
  faq: {
    title: 'Questions fréquentes',
    paras: [
      ['Comment revenir à l’accueil ?', 'Sélectionnez « Accueil » dans le menu ou touchez l’onglet Accueil.'],
      ['Comment parcourir les rubriques ?', 'Ouvrez le menu pour déplier les sous-rubriques, puis touchez un élément pour afficher son aperçu.'],
      ['Est-ce un compte réel ?', 'Non. Les actions et les informations servent uniquement à la démonstration.']
    ]
  },
  legal: {
    title: 'À propos de cette démonstration',
    paras: [
      [null, 'Prototype statique de l’espace client Castelval. Les montants, contrats et opérations sont des exemples. Aucun service bancaire ou de paiement n’est exécuté.'],
      [null, 'Les conditions contractuelles et mentions légales du futur service ne sont pas présentées dans ce prototype.']
    ]
  },
  cookies: {
    title: 'Confidentialité et préférences',
    paras: [
      [null, 'Cette démonstration n’utilise aucun outil de mesure d’audience et n’envoie aucun identifiant saisi.'],
      [null, 'Votre session est conservée dans le coffre sécurisé de l’appareil et supprimée à la déconnexion. Aucun mot de passe n’est enregistré.']
    ]
  },
  a11y: {
    title: 'Accessibilité',
    paras: [
      [null, 'L’application est compatible avec les lecteurs d’écran (VoiceOver, TalkBack) et respecte la taille de texte système ainsi que le mode sombre.'],
      [null, 'Ouvrez les rubriques à l’aide du bouton de menu en haut à gauche ou en glissant depuis le bord de l’écran.']
    ]
  }
}

export function InfoPage() {
  const nav = useNavigation<any>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'InfoPage'>>()
  const { t } = usePortal()
  const info = INFO[params.kind]
  useEffect(() => {
    nav.setOptions({ title: t(info.title) })
  }, [params.kind, t])
  return (
    <Screen>
      <Card>
        {info.paras.map(([h, b], i) => (
          <View key={i} style={{ gap: 2, marginBottom: 6 }}>
            {h ? <Txt v="bold">{h}</Txt> : null}
            <Txt>{b}</Txt>
          </View>
        ))}
      </Card>
      <Button title="Fermer" kind="outline" onPress={() => nav.goBack()} />
    </Screen>
  )
}
