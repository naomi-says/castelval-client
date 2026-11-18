import { Fragment, cloneElement, isValidElement } from 'react'

/* French → English dictionary for the whole portal.
   Keys are the exact French strings rendered in the UI. */
const EN = {
  /* header / nav shell */
  'Accueil': 'Home',
  'Mon patrimoine': 'My wealth',
  'Mes comptes': 'My accounts',
  'Mes cartes': 'My cards',
  'Virements': 'Transfers',
  'Mes assurances': 'My insurance',
  'Mes crédits': 'My loans',
  'Mes documents': 'My documents',
  'Messages': 'Messages',
  'Téléphone': 'Phone',
  'Rendez-vous': 'Appointments',
  'Déconnexion': 'Sign out',
  'Mon profil': 'My profile',
  'Changer de profil': 'Switch profile',
  'Paramètres': 'Settings',
  'Mes dernières connexions': 'My latest connections',
  '6 octobre 2026 à 18:10': 'October 6, 2026 at 6:10 PM',
  '5 octobre 2026 à 15:43': 'October 5, 2026 at 3:43 PM',
  'Navigateur web · Session de démonstration': 'Web browser · Demo session',
  'Navigateur web · Connexion d’exemple': 'Web browser · Example login',
  'Ajouter une photo': 'Add a photo',
  'Votre photo de profil a été mise à jour.': 'Your profile photo has been updated.',
  'Choisissez une image (JPG ou PNG).': 'Choose an image (JPG or PNG).',
  'Dernière connexion : aujourd’hui, 09:12': 'Last sign-in: today, 09:12',
  'English': 'English',
  'Français': 'Français',
  'Ouvrir le menu': 'Open menu',
  'Afficher les montants': 'Show amounts',
  'Masquer les montants': 'Hide amounts',
  'Développer le menu': 'Expand menu',
  'Réduire le menu': 'Collapse menu',
  'Compte': 'Account',

  /* home */
  'Bonjour': 'Hello',
  'Personne physique': 'Individual',
  'Personne morale': 'Legal entity',
  'Patrimoine net estimé ·': 'Estimated net worth ·',
  'profil(s) ·': 'profile(s) ·',
  'établissement(s)': 'establishment(s)',
  'Total masqué (paramètres)': 'Total hidden (settings)',
  'Afficher': 'Show',
  'Masquer': 'Hide',
  'le chiffre': 'the amount',
  'Voir le détail': 'View details',
  'Périmètre': 'Scope',
  'Mon cashback et mes Points Castelval': 'My cashback and Castelval Points',
  '2 480 Points Castelval': '2,480 Castelval Points',
  '2 480': '2,480',
  'Cashback :': 'Cashback:',
  'Mes comptes et épargne de précaution': 'My accounts and precautionary savings',
  'Compte de paiement': 'Current account',
  'Épargne de précaution': 'Precautionary savings',
  'Mon': 'My',
  'compte de paiement': 'current account',
  'épargne de précaution': 'precautionary savings',
  'Souscrire': 'Subscribe',
  'Épargne, crédit, assurance, cartes et paiements.': 'Savings, credit, insurance, cards and payments.',

  /* patrimoine */
  'Mes avoirs': 'My assets',
  'Patrimoine net total': 'Total net worth',
  'Périmètre commun (accueil et onglets)': 'Common scope (home and tabs)',
  'Avec mon conseiller': 'With my adviser',
  'Hors Castelval (déclaré)': 'Outside Castelval (declared)',
  'Le total inclut 100 % du patrimoine affiché de chaque structure sélectionnée, même si vous n’en détenez pas la totalité. N’ajoutez pas la valeur de vos parts de holding : les saisir de nouveau crée un double comptage.':
    'The total includes 100% of the wealth shown for each selected structure, even if you do not own all of it. Do not add the value of your holding shares: entering them again would count them twice.',
  'Support': 'Asset',
  'Établissement': 'Institution',
  'Source': 'Source',
  'Au': 'As of',
  'Valeur': 'Value',
  'Compte-titres': 'Securities account',
  'Système Castelval': 'Castelval system',
  'Assurance-vie': 'Life insurance',
  'Hors Castelval': 'Outside Castelval',
  'Déclaré par le client': 'Declared by the client',
  'Trésorerie': 'Cash',
  'Portefeuille titres': 'Securities portfolio',
  'Immeuble locatif': 'Rental property',
  'Résidence principale': 'Main residence',
  'Total des avoirs financiers': 'Total financial assets',
  'Ajouter un avoir géré ailleurs': 'Add an asset managed elsewhere',
  'Exporter le détail': 'Export details',
  'Avoirs financiers': 'Financial assets',
  'Immobilier déclaré': 'Declared real estate',
  'Autres actifs': 'Other assets',
  'Total brut': 'Gross total',
  'Capital restant dû': 'Outstanding capital',
  'Patrimoine net estimé': 'Estimated net worth',
  'Éléments déclarés par vous': 'Items you declared',
  'Profil': 'Profile',
  'Intitulé': 'Label',
  'Montant': 'Amount',
  'Modifier': 'Edit',
  'Supprimer': 'Delete',
  'Ajouter un élément': 'Add an item',
  'Ajouter': 'Add',
  'un élément déclaré': 'a declared item',
  'Aucune donnée.': 'No data.',

  /* comptes */
  'Mes opérations': 'My transactions',
  'Mes réglages de compte': 'My account settings',
  'Solde comptabilisé · mis à jour le 14/10/2026': 'Posted balance · updated on 14/10/2026',
  'Date': 'Date',
  'Libellé': 'Description',
  'Détail du compte': 'Account details',
  'Titulaire': 'Holder',
  'Faire un virement': 'Make a transfer',
  'Relevés de compte': 'Account statements',
  'Recherche et export': 'Search and export',
  'Du': 'From',
  'Jusqu’au': 'To',
  'Exporter': 'Export',
  'Mes opérations à venir': 'Upcoming transactions',
  'Type': 'Type',
  'Statut': 'Status',
  'Virement programmé': 'Scheduled transfer',
  'Programmé': 'Scheduled',
  'Prélèvement': 'Direct debit',
  'Autorisé': 'Authorised',
  'Échéance de crédit': 'Loan instalment',
  'À venir': 'Upcoming',
  'En attente': 'Pending',
  'Virement': 'Transfer',
  'Loyer': 'Rent',
  'Virement salaire': 'Salary transfer',
  'Supermarché': 'Supermarket',
  'Carburant': 'Fuel',
  'Pharmacie': 'Pharmacy',
  'Loyer perçu': 'Rent received',
  'Taxe foncière': 'Property tax',
  'Dividendes reçus': 'Dividends received',
  'Comptabilisée': 'Posted',

  /* cartes */
  'Mes dépenses carte': 'My card spending',
  'Mes points et cashback': 'My points and cashback',
  'Mes réglages de carte': 'My card settings',
  'Mes blocages de carte': 'My card blocks',
  'Carte de paiement •••• 4821': 'Payment card •••• 4821',
  'Dépenses sur 30 jours :': 'Spending over 30 days:',
  'sur': 'of',
  'Aucune carte de paiement pour ce profil.': 'No payment card for this profile.',
  'Points Castelval': 'Castelval Points',
  'Niveau Argent': 'Silver tier',
  '1 point pour 10 € dépensés.': '1 point per €10 spent.',
  'Cashback': 'Cashback',
  'Taux applicable : 1 %.': 'Applicable rate: 1%.',
  'Historique': 'History',
  'Opération': 'Transaction',
  'Cashback reçu': 'Cashback received',
  'Cashback utilisé': 'Cashback used',
  'Règles, plafonds et expiration : exemples à valider.': 'Rules, limits and expiry: example values to be validated.',
  'Paiements sur Internet': 'Online payments',
  'Paiement sans contact': 'Contactless payment',
  'Plafond de paiement': 'Payment limit',
  'Plafond de retrait': 'Withdrawal limit',
  'sur 30 jours glissants': 'over a rolling 30 days',
  'sur 7 jours glissants': 'over a rolling 7 days',
  'Modifier un plafond': 'Change a limit',
  'Blocage temporaire': 'Temporary block',
  'État :': 'Status:',
  'Active': 'Active',
  'Bloquée temporairement': 'Temporarily blocked',
  'Opposition enregistrée': 'Card blocked',
  'Faire opposition': 'Stop the card',

  /* virements */
  'Nouveau virement': 'New transfer',
  'Mes bénéficiaires': 'My beneficiaries',
  'Plafonds de virement': 'Transfer limits',
  'Virements programmés et prélèvements': 'Scheduled transfers and direct debits',
  'Compte à débiter': 'Debit account',
  'Compte à créditer': 'Credit account',
  'Montant et caractéristiques': 'Amount and details',
  'Récapitulatif': 'Summary',
  'Confirmation': 'Confirmation',
  'Continuer': 'Continue',
  'Retour': 'Back',
  'Nom': 'Name',
  'Détail': 'Details',
  'Vérifié': 'Verified',
  'En attente de vérification': 'Pending verification',
  'Ajouter un bénéficiaire': 'Add a beneficiary',
  'Titulaire du compte': 'Account holder',
  'Nom usuel': 'Display name',
  'La vérification de production reste à définir.': 'Production verification is still to be defined.',
  'Plafond par virement': 'Limit per transfer',
  'par opération': 'per transaction',
  'Plafond journalier': 'Daily limit',
  'sur la journée': 'per day',
  'Plafond hebdomadaire': 'Weekly limit',
  'Plafond mensuel': 'Monthly limit',
  'Plafonds d’exemple. Les plafonds de carte sont dans « Mes cartes ».':
    'Example limits. Card limits are in “My cards”.',
  'Gérer un élément': 'Manage an item',
  'Solde disponible :': 'Available balance:',
  '· Plafond journalier restant :': '· Remaining daily limit:',
  'Montant (€)': 'Amount (€)',
  'Date d’exécution': 'Execution date',
  'Motif': 'Reference',
  'Virement SEPA. Délais, frais et heures limites : valeurs d’exemple à valider.':
    'SEPA transfer. Cut-off times, fees and limits: example values to be validated.',
  'Instruction transmise': 'Instruction sent',
  'En attente de traitement': 'Pending processing',
  'Le statut définitif apparaîtra dans « Virements programmés et prélèvements » dès confirmation par le service de paiement.':
    'The final status will appear in “Scheduled transfers and direct debits” once the payment service confirms it.',
  'Approuver le virement': 'Approve the transfer',
  'Virement — sans motif': 'Transfer — no reference',

  /* assurances / crédits */
  'Vos assurances et l’assistance liée à votre carte seront présentées ici lorsque le produit les fournit.':
    'Your insurance cover and the assistance linked to your card will be shown here when the product provides them.',
  'Parler à mon conseiller': 'Talk to my adviser',
  'Aucun crédit Castelval pour ce profil.': 'No Castelval loan for this profile.',
  'Prêt immobilier': 'Mortgage',
  'Prêt travaux': 'Home-improvement loan',
  'Mensualité': 'Monthly payment',
  'Taux': 'Rate',
  'Durée restante': 'Remaining term',
  'Tableau d’amortissement': 'Amortisation schedule',
  'Échéance': 'Instalment',
  'Intérêts': 'Interest',
  'Capital': 'Principal',
  'Sous réserve des informations mises à disposition par le prêteur.': 'Subject to information provided by the lender.',

  /* documents */
  'Mes relevés de compte': 'My account statements',
  'Mes contrats': 'My contracts',
  'Relevé de compte —': 'Account statement —',
  'Septembre 2026': 'September 2026',
  'Août 2026': 'August 2026',
  'Juillet 2026': 'July 2026',
  'Consulter': 'View',
  'Télécharger': 'Download',
  'Aucun document': 'No document',
  'à disposition': 'available',
  'à transmettre': 'to submit',
  'à signer': 'to sign',
  'pour le moment.': 'at the moment.',

  /* profil */
  'Mes coordonnées': 'My contact details',
  'Mon identité': 'My identity',
  'Ma situation familiale': 'My family situation',
  'Mon profil investisseur': 'My investor profile',
  'E-mail': 'Email',
  'Adresse': 'Address',
  'Né(e) le': 'Date of birth',
  'Situation familiale': 'Family situation',
  'Profil investisseur': 'Investor profile',
  'Marié, 2 enfants': 'Married, 2 children',
  'Équilibré': 'Balanced',
  'Prudent': 'Cautious',
  'Dynamique': 'Dynamic',
  'Siège': 'Registered office',
  'Forme': 'Legal form',
  'Associés': 'Partners',
  'Dirigeant': 'Director',

  /* paramètres */
  'Ma sécurité': 'My security',
  'Mes paramètres de contact': 'My contact preferences',
  'Alertes et évènements': 'Alerts and events',
  'Mon code de sécurité': 'My security code',
  'Mes téléphones de confiance': 'My trusted phones',
  'Modifier mon mot de passe': 'Change my password',
  'Mon historique de connexion': 'My sign-in history',
  'Patrimoine financier à agréger': 'Financial assets to aggregate',
  'Code secret': 'Passcode',
  'Téléphone de confiance': 'Trusted phone',
  'Fermeture automatique de session': 'Automatic session timeout',
  'après 15 min d’inactivité': 'after 15 min of inactivity',
  'Modifier (validation forte)': 'Change (strong authentication)',
  'Contact par e-mail': 'Email contact',
  'Contact par SMS': 'SMS contact',
  'Alerte de mouvement important': 'Large-movement alert',
  'Alerte d’opération par carte': 'Card transaction alert',
  'Afficher le total sur l’accueil': 'Show the total on the home page',
  'Masquer le total à l’arrivée': 'Hide the total on arrival',
  'Établissements à agréger': 'Establishments to aggregate',
  'Profils à agréger': 'Profiles to aggregate',
  '(modifie à la fois la page d’accueil et mon patrimoine)': '(changes both the home page and my wealth)',
  'Tous établissements': 'All establishments',
  'Tous profils': 'All profiles',
  'Me prévenir des messages sécurisés reçus': 'Notify me about received secure messages',
  'Notifications de l’application': 'App notifications',
  'Enregistrer': 'Save',
  'Préférences de démonstration. Aucune notification réelle n’est envoyée.':
    'Demonstration preferences. No real notification is sent.',
  'Vos préférences de contact ont été enregistrées (démonstration).':
    'Your contact preferences have been saved (demonstration).',
  'Affichage sur la page d’accueil': 'Home page display',
  'Afficher le total agrégé sur la page d’accueil': 'Show the aggregated total on the home page',
  'Masquer le total lorsqu’on arrive la première fois sur la page d’accueil': 'Hide the total on the first visit to the home page',
  '‹ Revenir aux paramètres': '‹ Back to settings',

  /* structures / souscription */
  'Profils pour lesquels votre accès a été vérifié à la connexion.':
    'Profiles for which your access was verified when you signed in.',
  'Profil actif': 'Active profile',
  'Accéder': 'Open',
  'Épargne': 'Savings',
  'Crédit': 'Credit',
  'Assurance': 'Insurance',
  'Carte et paiements': 'Cards and payments',
  'Livret, compte à terme': 'Savings account, term deposit',
  'Prêt personnel, immobilier': 'Personal loan, mortgage',
  'Protection et prévoyance': 'Protection and provident cover',
  'Nouvelle carte, paiement mobile': 'New card, mobile payment',
  'Être contacté par mon conseiller': 'Ask my adviser to contact me',

  /* dialogs */
  'Fermer': 'Close',
  'Ma messagerie': 'My mailbox',
  'Nous contacter': 'Contact us',
  'Prendre rendez-vous': 'Book an appointment',
  'Objet du RDV': 'Appointment subject',
  'Simulation. Aucun rendez-vous réel n’est réservé.': 'Simulation. No real appointment is booked.',
  'Virements et prélèvements (Castelval)': 'Transfers and direct debits (Castelval)',
  'Ma carte (Castelval)': 'My card (Castelval)',
  'Besoin de placement (mon CGP)': 'Investment needs (my adviser)',
  'Conseil sur mon patrimoine (mon CGP)': 'Wealth advice (my adviser)',
  'Crédit (Castelval)': 'Loan (Castelval)',
  'Assurance (Castelval)': 'Insurance (Castelval)',
  'Autre demande à Castelval': 'Other request to Castelval',
  'Autre demande à mon CGP': 'Other request to my adviser',
  'Mon conseiller': 'My adviser',
  'Appel sécurisé dans l’application': 'Secure call in the app',
  'Adresse fictive de démonstration': 'Fictional demonstration address',
  'Cette démonstration ne prend pas en charge les appels.':
    'This demonstration does not support calls.',
  'Démonstration': 'Demonstration',
  'Nouveau message': 'New message',
  'Reçu': 'Inbox',
  'Envoyé': 'Sent',
  'Brouillon': 'Draft',
  'Rechercher des messages': 'Search messages',
  'De': 'From',
  'À': 'To',
  'Objet': 'Subject',
  'Objet du message': 'Message subject',
  'Choisir un objet': 'Choose a subject',
  'Joindre un document': 'Attach a document',
  'Retirer la pièce jointe': 'Remove attachment',
  'Votre message': 'Your message',
  'Enregistrer le brouillon': 'Save draft',
  'Répondre': 'Reply',
  'Retour aux messages': 'Back to messages',
  'Aucun message reçu.': 'No messages received.',
  'Aucun message envoyé.': 'No sent messages.',
  'Aucun brouillon.': 'No drafts.',
  'Aucun message ne correspond à votre recherche.': 'No message matches your search.',
  'Simulation. Aucun message réel n’est envoyé.': 'Simulation. No real message is sent.',
  'Choisissez un objet ou saisissez votre message.': 'Choose a subject or write your message.',
  'Choisissez un objet et saisissez votre message.': 'Choose a subject and write your message.',
  'Brouillon enregistré.': 'Draft saved.',
  'Message envoyé (démonstration).': 'Message sent (demonstration).',
  'Enregistrer': 'Save',
  'Catégorie': 'Category',
  'Votre conseiller · 12/10': 'Your adviser · 12/10',
  'Compte rendu de votre dernier rendez-vous': 'Summary of your last appointment',
  'Castelval · 03/10': 'Castelval · 03/10',
  'Votre relevé est disponible': 'Your statement is available',
  'Votre conseiller :': 'Your adviser:',
  'Du lundi au vendredi, 9 h – 18 h.': 'Monday to Friday, 9am – 6pm.',
  'Choisissez un créneau :': 'Choose a slot:',
  'Lun. 19 oct., 10 h': 'Mon 19 Oct, 10am',
  'Mar. 20 oct., 14 h': 'Tue 20 Oct, 2pm',
  'Jeu. 22 oct., 9 h': 'Thu 22 Oct, 9am',
  'Détail de l’opération': 'Transaction details',
  'Système Castelval · 14/10/2026': 'Castelval system · 14/10/2026',
  'Toute modification de plafond demande une validation forte. Règles de hausse et de baisse : à définir.':
    'Any limit change requires strong authentication. Rules for increases and decreases: to be defined.',
  'La carte sera définitivement bloquée et remplacée.': 'The card will be permanently blocked and replaced.',
  'Confirmer l’opposition': 'Confirm the block',
  'Validation sur votre téléphone de confiance': 'Approval on your trusted phone',
  'Parcours de référence : aucune notification réelle n’est envoyée.':
    'Reference flow: no real notification is sent.',
  'J’ai validé (simulation)': 'I have approved (simulation)',
  'Gérer un élément à venir': 'Manage an upcoming item',
  'Suspendre, modifier ou annuler : la demande prend effet après approbation et sera confirmée par un statut.':
    'Suspend, change or cancel: the request takes effect after approval and will be confirmed by a status.',
  'Envoyer la demande': 'Send request',
  'Avoir financier géré ailleurs': 'Financial asset managed elsewhere',
  'Autre bien immobilier': 'Other real estate',
  'Autre actif': 'Other asset',
  'Crédit externe': 'External loan',
  'Ajouter un élément déclaré': 'Add a declared item',

  /* toasts */
  'Demande de rendez-vous transmise.': 'Appointment request sent.',
  'Export généré avec source, date, profil et périmètre (démonstration).':
    'Export generated with source, date, profile and scope (demonstration).',
  'Relevé en cours de génération (démonstration).': 'Statement being generated (demonstration).',
  'Demande transmise : votre conseiller vous recontacte.': 'Request sent: your adviser will contact you.',
  'Demande transmise. Statut : en attente d’approbation.': 'Request sent. Status: awaiting approval.',

  /* errors */
  'Aucun compte à créditer : ajoutez d’abord un bénéficiaire vérifié.':
    'No account to credit: add a verified beneficiary first.',
  'Saisissez un montant supérieur à zéro.': 'Enter an amount greater than zero.',
  'Le montant dépasse le solde disponible.': 'The amount exceeds the available balance.',
  'Le montant dépasse le plafond par virement (5 000 €).': 'The amount exceeds the per-transfer limit (€5,000).',
  'Renseignez le titulaire, le nom usuel et un IBAN valide.': 'Enter the holder, the display name and a valid IBAN.',
  'Renseignez un intitulé et un montant positif.': 'Enter a label and a positive amount.',
  'Une résidence principale est déjà déclarée pour ce profil : une seule est possible pour une personne physique.':
    'A main residence is already declared for this profile: only one is allowed for an individual.'
}

/* Fragments recombined at runtime (template strings, plural suffixes, prefixes). */
const SUBST = [
  [/\bprofil\(s\)/g, 'profile(s)'],
  [/\bétablissement\(s\)/g, 'establishment(s)'],
  [/\(bénéficiaire\)/g, '(beneficiary)'],
  [/^Virement — /, 'Transfer — '],
  [/\bVirement programmé\b/g, 'Scheduled transfer'],
  [/\bÉchéance de crédit\b/g, 'Loan instalment'],
  [/\bPrélèvement\b/g, 'Direct debit'],
  [/\bCompte de paiement\b/g, 'Current account'],
  [/\bÉpargne de précaution\b/g, 'Precautionary savings'],
  [/\bCarte de paiement\b/g, 'Payment card'],
  [/^Mon compte de paiement/, 'My current account'],
  [/^Mon épargne de précaution/, 'My precautionary savings'],
  [/(\d+)\s*mois\b/g, '$1 months']
]

export const trText = s => {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s)
  const core = m && m[2]
  if (!core) return s
  let out = EN[core]
  if (out === undefined) {
    out = core
    for (const [re, rep] of SUBST) out = out.replace(re, rep)
  }
  return m[1] + out + m[3]
}

const flat = node => {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flat).join('')
  if (isValidElement(node)) return flat(node.props.children)
  return ''
}

const walk = node => {
  if (typeof node === 'string') return trText(node)
  if (node == null || typeof node === 'number' || typeof node === 'boolean') return node
  if (Array.isArray(node))
    return node.map((child, i) => {
      const next = walk(child)
      /* cloneElement re-validates children: keep a stable key on list items */
      if (isValidElement(next) && next.key == null) return cloneElement(next, { key: '~' + i })
      return next
    })
  if (!isValidElement(node)) return node

  const props = node.props
  const next = {}
  let changed = false

  if (props.children !== undefined) {
    const children = walk(props.children)
    if (children !== props.children) {
      next.children = children
      changed = true
    }
  }
  for (const attr of ['placeholder', 'aria-label', 'title']) {
    if (typeof props[attr] === 'string') {
      const v = trText(props[attr])
      if (v !== props[attr]) {
        next[attr] = v
        changed = true
      }
    }
  }
  if (node.type === 'button' && changed) {
    next['data-fr'] = flat(props.children).replace(/\s+/g, ' ').trim()
  }
  return changed ? cloneElement(node, next) : node
}

/* Translate a rendered React subtree (no-op when English is off). */
export default function tr(node, on) {
  return on ? walk(node) : node
}

export { Fragment }
