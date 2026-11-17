/* Demo dataset — ported verbatim from the website's src/data.js (the website has no backend:
   this file *is* its data source). Screens read it through the portal store (src/state/portal.tsx)
   and the pure rules in src/services/rules.ts. To plug in a real API, replace the reads/writes
   in those two places; the screens do not need to change. */

export type Money = number
export type AccountRow = [label: string, iban: string, balance: Money]
export type TxRow = [date: string, label: string, amount: Money]
export type Beneficiary = [name: string, holder: string, iban: string, bic: string, status: string, limit: Money | null]
export type UpcomingRow = [date: string, label: string, type: string, amount: Money, status: string]
export type WealthRow = [label: string, institution: string, amount: Money, cat: 'fin' | 'imm' | 'autre', group: string]
export type KV = [string, string]

export interface Loan {
  n: string; cap: number; rate: number; m: number; mens: number; principal: number
  paid: number; start: string; end: string; next: string; ref: string; account: string
}
export interface CardLims { payment: number[]; withdrawal: number[] }
export interface SecondCard {
  n: string; label: string; holder: string; num: string; exp: string; lim: number[]; used: number[]; sp: TxRow[]
}
export interface Card {
  n: string; label: string; holder: string; num: string; exp: string; status: string
  lim: number[]; used: number[]; marie?: SecondCard
  lims: CardLims; ulims: CardLims
  pts: number; level: string; rate: number; earned: number; avail: number; total: number
  sp: TxRow[]
}
export interface Profile {
  n: string; t: string; g: string; ini: string; email: string; login: string
  acc: AccountRow[]; extra: AccountRow[]; tx: TxRow[][]; card: Card; loan: Loan[]
  b: Beneficiary[]; doc: [account: string, title: string][]; up: UpcomingRow[]
  w: WealthRow[]; pf: KV[][]
}

const IBAN = 'FR76 1234 5678 9000 0000 0000 000'

/* Content mirrors the Castelval client demo (demo-client.castelval.fr). */
export const P: Profile[] = [
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

export const NAV: [string, string][] = [['home','Accueil'],['patrimoine','Mon patrimoine'],['comptes','Mes comptes'],['cartes','Mes cartes'],['virements','Virements'],['assurances','Mes assurances'],['credits','Mes crédits'],['documents','Mes relevés de compte']]

export const TABS = {
  comptes:['Mes opérations','Gérer le compte'],
  cartes:['Mes dépenses carte','Mes points et cashback','Mes réglages de carte','Mes blocages de carte'],
  virements:['Nouveau virement','Mes bénéficiaires','Plafonds de virement','Virements programmés et prélèvements'],
  patrimoine:['Mes avoirs','Patrimoine net total'],
  profil:['Mes coordonnées','Mon identité','Ma situation familiale','Ma situation professionnelle','Ma situation patrimoniale déclarée','Mon profil investisseur'],
  param:['Ma sécurité','Mes paramètres de contact','Alertes et évènements','Patrimoine financier à agréger']
}

export const LIM: [string, number, number, string][] = [['Plafond de virement',5000,1500,'sur 1 jour'],['Plafond de virement',20000,8000,'sur 7 jours'],['Plafond de virement',20000,15000,'sur 30 jours']]

/* Messagerie: [date, expéditeur, objet, aperçu, corps du message] */
export type MailEntry = [date: string, from: string, subject: string, preview: string, body: string]
export const MAIL: MailEntry[] = [
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
export const RDV_OBJ: string[] = [
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
export const MAIL_OBJ: string[] = [
  'Une question sur mes comptes',
  'Un virement à effectuer',
  'Ma carte et mes plafonds',
  'Mes documents',
  'Prendre rendez-vous avec mon conseiller',
  'Autre demande'
]
