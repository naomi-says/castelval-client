import logo from './logo.png'

export const LOGO = logo

/* Language set by the portal before rendering (fr = default). */
let LANG = 'fr'
export const setLang = l => {
  LANG = l
}
const LOC = () => (LANG === 'en' ? 'en-GB' : 'fr-FR')

export const R = n => Number(n).toLocaleString(LOC(), { style: 'currency', currency: 'EUR' })
export const D = d => new Date(d).toLocaleDateString(LOC())
export const N = n => Number(n).toLocaleString(LOC())

const IBAN = 'FR76 1234 5678 9000 0000 0000 000'

/* Content mirrors the Castelval client demo (demo-client.castelval.fr). */
export const P = [
{n:'M Jean Dupond',t:'Personne physique',g:'Bonjour M Jean Dupond',ini:'JD',email:'jean.dupond@gmail.fr',login:'06/10/2026 à 18h10',
 acc:[['Compte de paiement',IBAN,4723.33],['Livret Castelval F',IBAN,10000],['Livret Castelval B',IBAN,15000]],
 extra:[['Compte à terme',IBAN,50000],['Contrat d’assurance-vie',IBAN,170000]],
 tx:[[
  ['2026-10-12','Crédit voiture — échéance',-1635.39],
  ['2026-10-05','Électroménager',-2990],
  ['2026-10-05','Énergie',-96.3],
  ['2026-10-05','Téléphonie',-35],
  ['2026-10-05','Club premium sport',-270],
  ['2026-10-04','Hôtel',-1250],
  ['2026-10-03','Billets de train',-600],
  ['2026-10-02','Virement reçu · Salaire octobre',4200],
  ['2026-10-02','Supermarché',-68.42],
  ['2026-10-01','Virement régulier — Loyer',-950],
  ['2026-10-01','Restaurant',-42.5],
  ['2026-10-01','Librairie',-49.08],
  ['2026-09-12','Crédit voiture — échéance',-1635.39],
  ['2026-09-07','Énergie',-96.3],
  ['2026-09-07','Téléphonie',-35],
  ['2026-09-07','Club premium sport',-270],
  ['2026-09-01','Virement régulier — Loyer',-950]
 ],[['2026-10-01','Virement depuis mon compte de paiement',500],['2026-09-15','Virement vers mon compte de paiement',-250],['2026-09-01','Virement depuis mon compte de paiement',1000]
 ],[['2026-10-03','Virement depuis mon compte de paiement',250],['2026-09-12','Versement sur le livret',1000]]],
 card:{n:'Carte Castelval · Visa •••• 1842',label:'Carte Jean Dupond',holder:'M Jean Dupond',num:'•••• 1842',exp:'10/29',status:'À activer',lim:[15000,2000],used:[5000,0],
  marie:{n:'Carte Castelval · Visa •••• 7530',label:'Carte Marie Dupond',holder:'Mme Marie Dupond',num:'•••• 7530',exp:'10/29',lim:[15000,2000],used:[0,0],sp:[]},
  lims:{payment:[5000,10000,15000],withdrawal:[2000,2000,4000]},
  ulims:{payment:[0,5000,5000],withdrawal:[0,1500,1500]},
  pts:132000,level:'statut Or',rate:1,earned:50,avail:230,total:2250,
  sp:[['2026-10-05','Électroménager',-2990],['2026-10-04','Hôtel',-1250],['2026-10-03','Billets de train',-600],['2026-10-02','Supermarché',-68.42],['2026-10-01','Restaurant',-42.5],['2026-10-01','Librairie',-49.08]]},
 loan:[{n:'Crédit voiture',cap:53917.7,rate:5.8,m:36,mens:1635.39,principal:85000,paid:24,start:'2024-10-12',end:'2029-10-12',next:'2026-11-12',ref:'CV20240001',account:'Compte de paiement'}],
 b:[['mon compte LCL','Monsieur Jean Dupond',IBAN,'Non renseigné','Vérifié',null],['charges de copropriété rue de Rome','SEL Gestion Moderne',IBAN,'Non renseigné','Vérifié',3000]],
 doc:[['Compte de paiement','Relevé au 8 octobre 2026'],['Compte de paiement','Septembre 2026'],['Livret Castelval F','Relevé au 8 octobre 2026'],['Livret Castelval B','Relevé au 8 octobre 2026']],
 up:[['2026-10-31','Club premium sport','Prélèvement',-270,'Autorisé'],['2026-11-01','Loyer','Virement programmé',-950,'Programmé'],['2026-11-05','Crédit voiture — échéance','Échéance de crédit',-1635.39,'À venir'],['2026-11-10','Énergie','Prélèvement',-96.3,'Autorisé'],['2026-11-12','Téléphonie','Prélèvement',-35,'Autorisé']],
 w:[['Compte de paiement','Castelval',4723.33,'fin','Comptes de paiement'],['Livret Castelval F','Castelval',10000,'fin','Épargne de précaution'],['Livret Castelval B','Castelval',15000,'fin','Épargne de précaution'],['Compte à terme','Castelval',50000,'fin','Épargne moyen terme'],['Contrat d’assurance-vie','Castelval',170000,'fin','Épargne long terme'],['DAT BNP Paribas','Hors Castelval',32000,'fin','Épargne moyen terme'],['Assurance-vie Cardiff','Hors Castelval',122000,'fin','Épargne long terme'],['Résidence principale','Hors Castelval',800000,'imm','Immobilier'],['Parc du roi','Hors Castelval',400000,'imm','Immobilier'],['Autres actifs déclarés','Hors Castelval',500000,'autre','Autre patrimoine']],
 pf:[[['Téléphone fixe','Non renseigné'],['Téléphone portable','+33 6 00 00 00 00'],['Courriel','jean.dupond@gmail.fr'],['Adresse','12 rue des Lilas, 75015 Paris, France'],['Canal privilégié','Téléphone portable']],
  [['Civilité','Monsieur'],['Nom d’usage','DUPOND'],['Nom de naissance','DUPOND'],['Prénom','Jean'],['Date de naissance','1er janvier 1975'],['Pays de naissance','France'],['Nationalité','France'],['Département de naissance','75 — Paris'],['Pays de fiscalité','France'],['Justificatif d’identité','Passeport français · délivré le 21/04/2022']],
  [['Situation familiale','Marié'],['Régime matrimonial','Communauté légale réduite aux acquêts'],['Nombre d’enfants de mon foyer','2'],['Nombre d’enfants à charge','1'],['Camille','Née le 12/03/2004 · non à charge'],['Lucas','Né le 21/06/2011 · à charge']],
  [['Situation professionnelle','Salarié'],['Profession','Cadre'],['Secteur d’activité','Services'],['Employeur','Entreprise de démonstration'],['Depuis le','01/01/2020']],
  [['Résidence principale','800 000,00 €'],['Investissement locatif · Parc du roi','400 000,00 €'],['Divers (mobilier, art…)','500 000,00 €'],['Crédit voiture','53 917,70 €'],['Crédit immobilier déclaré','250 000,00 €']],
  [['Profil investisseur','Non renseigné'],['Connaissance des marchés','Non renseignée'],['Horizon de placement','Non renseigné']]]},
{n:'Holding Famille Dupond',t:'Personne morale',g:'Holding Famille Dupond',ini:'HF',email:'holding.dupond@example.fr',login:'06/10/2026 à 18h10',
 acc:[['Compte de paiement',IBAN,18025],['Compte à terme',IBAN,50000]],
 extra:[],
 tx:[[['2026-10-12','Crédit hypothécaire — échéance',-4424.91],['2026-09-12','Crédit hypothécaire — échéance',-4424.91]],[['2026-09-30','Ouverture du compte à terme',50000]]],
 card:{n:'Carte Castelval · Visa •••• 9027',label:'Carte Holding Famille Dupond',holder:'Holding Famille Dupond',num:'•••• 9027',exp:'10/29',status:'À activer',lim:[15000,2000],used:[0,0],
  lims:{payment:[5000,10000,15000],withdrawal:[2000,2000,4000]},
  ulims:{payment:[0,0,0],withdrawal:[0,0,0]},pts:0,level:'',rate:1,earned:0,avail:0,total:0,sp:[]},
 loan:[{n:'Crédit hypothécaire',cap:295565.23,rate:2.5,m:72,mens:4424.91,principal:550000,paid:72,start:'2020-10-12',end:'2032-10-12',next:'2026-11-12',ref:'CV20200002',account:'Compte de paiement'}],
 b:[['Compte de paiement Castelval','Jean Dupond',IBAN,'Non renseigné','Vérifié',null]],
 doc:[['Compte de paiement','Relevé au 8 octobre 2026']],
 up:[['2026-11-12','Crédit hypothécaire — échéance','Échéance de crédit',-4424.91,'À venir']],
 w:[['Compte de paiement','Castelval',18025,'fin','Comptes de paiement'],['Compte à terme','Castelval',50000,'fin','Épargne moyen terme'],['Contrat de capitalisation','Hors Castelval',401000,'fin','Épargne long terme'],['Immobilier professionnel','Hors Castelval',1200000,'imm','Immobilier']],
 pf:[[['Téléphone fixe','Non renseigné'],['Téléphone portable','Non renseigné'],['Courriel','holding.dupond@example.fr'],['Adresse','Non renseignée']],
  [['Dénomination','Holding Famille Dupond'],['Forme juridique','Non renseignée'],['SIREN','Non renseigné'],['Pays de fiscalité','France']],
  [['Situation familiale','Non applicable']],
  [['Situation professionnelle','Société'],['Profession','Holding patrimoniale'],['Secteur d’activité','Gestion de participations'],['Employeur','—'],['Depuis le','—']],
  [['Immobilier professionnel','1 200 000,00 €'],['Crédit hypothécaire','295 565,23 €']],
  [['Profil investisseur','Non renseigné']]]}]

export const NAV = [['home','Accueil'],['patrimoine','Mon patrimoine'],['comptes','Mes comptes'],['cartes','Mes cartes'],['virements','Virements'],['assurances','Mes assurances'],['credits','Mes crédits'],['documents','Documents']]

/* Sub-sections of the client demo's navigation: [label, tab or route, caption] */
export const SUBS = {
  comptes: [
    ['Mes opérations', 0],
    ['Mes autres comptes', 'structures', 'procurations'],
    ['Gérer le compte', 1, 'RIB, relevés, recherche']
  ],
  cartes: [
    ['Mes dépenses carte', 0],
    ['Mes points et cashback', 1],
    ['Mes réglages de carte', 2]
  ],
  virements: [
    ['Nouveau virement', 0],
    ['Mes bénéficiaires', 1],
    ['Plafonds de virement', 2],
    ['Virements programmés et prélèvements', 3]
  ],
  documents: [
    ['Mes relevés de compte', 0],
    ['Mes autres documents à disposition', 1],
    ['Mes documents', 2],
    ['Mes contrats', 3]
  ]
}

export const TABS = {
  comptes:['Mes opérations','Gérer le compte'],
  cartes:['Mes dépenses carte','Mes points et cashback','Mes réglages de carte','Mes blocages de carte'],
  virements:['Nouveau virement','Mes bénéficiaires','Plafonds de virement','Virements programmés et prélèvements'],
  patrimoine:['Mes avoirs','Patrimoine net total'],
  profil:['Mes coordonnées','Mon identité','Ma situation familiale','Ma situation professionnelle','Ma situation patrimoniale déclarée','Mon profil investisseur'],
  param:['Ma sécurité','Mes paramètres de contact','Alertes et évènements','Patrimoine financier à agréger']
}

export const LIM = [['Plafond de virement',5000,1500,'sur 1 jour'],['Plafond de virement',20000,8000,'sur 7 jours'],['Plafond de virement',20000,15000,'sur 30 jours']]

/* Messagerie: [date, expéditeur, objet, aperçu, corps du message] */
export const MAIL = [
  ['2026-10-06', 'Mon Conseiller', 'Votre conseiller vous souhaite la bienvenue',
    'Bienvenue chez Castelval. Je reste à votre disposition pour échanger sur vos projets et votre …',
    'Bienvenue chez Castelval. Je reste à votre disposition pour échanger sur vos projets et votre patrimoine.'],
  ['2026-10-05', 'Castelval', 'Vos documents sont disponibles',
    'Votre relevé de septembre est disponible dans la rubrique « Mes documents ». Vous pouvez l…',
    'Votre relevé de septembre est disponible dans la rubrique « Mes documents ». Vous pouvez le consulter et le télécharger à tout moment depuis votre espace.'],
  ['2026-10-02', 'Castelval', 'Votre espace client Castelval',
    'Découvrez vos comptes, votre carte et les services disponibles dans votre espace personnel.',
    'Découvrez vos comptes, votre carte et les services disponibles dans votre espace personnel.']
]

/* Objets proposés à la prise de rendez-vous */
export const RDV_OBJ = [
  'Virements et prélèvements (Castelval)',
  'Ma carte (Castelval)',
  'Besoin de placement (mon CGP)',
  'Conseil sur mon patrimoine (mon CGP)',
  'Crédit (Castelval)',
  'Assurance (Castelval)',
  'Autre demande à Castelval',
  'Autre demande à mon CGP'
]

/* Objets proposés à la rédaction d’un message */
export const MAIL_OBJ = [
  'Une question sur mes comptes',
  'Un virement à effectuer',
  'Ma carte et mes plafonds',
  'Mes documents',
  'Prendre rendez-vous avec mon conseiller',
  'Autre demande'
]

export const IC = {
  home:`<path d='M3 11l9-8 9 8M5 10v10h14V10'/>`,
  patrimoine:`<path d='M3 20h18M6 16l4-5 4 3 5-8'/>`,
  comptes:`<path d='M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18'/>`,
  cartes:`<path d='M3 6h18v12H3zM3 10h18'/>`,
  virements:`<path d='M7 7h12l-3-3M17 17H5l3 3'/>`,
  assurances:`<path d='M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z'/>`,
  credits:`<circle cx='7' cy='7' r='2'/><circle cx='17' cy='17' r='2'/><path d='M19 5L5 19'/>`,
  documents:`<path d='M7 3h7l5 5v13H7zM14 3v5h5'/>`
}

export const COLLAPSE_IC = `<path d='M15 6l-6 6 6 6'/>`
export const LOGOUT_IC = `<path d='M9 4H5v16h4M16 8l4 4-4 4M20 12H9'/>`

export const MSG_IC = `<path d='M3 6h18v12H3z'/><path d='M3 7l9 6 9-6'/>`
export const TEL_IC = `<path d='M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z'/>`
export const RDV_IC = `<path d='M4 6h16v14H4z'/><path d='M4 10h16M9 3v4M15 3v4'/>`

export const EYE = `<path d='M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/>`
export const EYX = EYE + `<path d='M4 4l16 16'/>`

export const TIP={'Accueil':'Home','Mon patrimoine':'My wealth','Mes comptes':'My accounts','Mes cartes':'My cards','Virements':'Transfers','Mes assurances':'My insurance','Mes crédits':'My loans','Mes documents':'My documents','Mes autres documents à disposition':'My other available documents','Documents':'Documents','Messages':'Messages','Téléphone':'Phone','Rendez-vous':'Appointments','Mon profil':'My profile','Changer de profil':'Switch profile','Paramètres':'Settings','Déconnexion':'Sign out','Mes opérations':'My transactions','Mes réglages de compte':'Manage my account','Mes dépenses carte':'My card spending','Mes points et cashback':'My points and cashback','Mes réglages de carte':'Manage my card','Mes blocages de carte':'My card blocks','Nouveau virement':'New transfer','Mes bénéficiaires':'My beneficiaries','Plafonds de virement':'Transfer limits','Virements programmés et prélèvements':'Scheduled transfers and direct debits','Mes avoirs':'My financial assets','Patrimoine net total':'Total net wealth','Mes relevés de compte':'My account statements','Mes contrats':'My contracts','Ma sécurité':'My security','Mes paramètres de contact':'My contact preferences','Alertes et évènements':'Alerts and events','Patrimoine financier à agréger':'Financial assets to aggregate','Mes coordonnées':'My contact details','Mon identité':'My identity','Ma situation familiale':'My family situation','Mon profil investisseur':'My investor profile'}
