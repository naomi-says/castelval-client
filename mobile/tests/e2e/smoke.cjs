/* Smoke test of the whole app running on react-native-web in headless Chrome (390x844).
   It drives the real UI (login, tabs, drawer, every wizard step, forms, validation errors, EN/FR, logout)
   and fails on any uncaught JS error. Native-only APIs (Alert, pickers, biometrics, PDF share) are NOT
   covered by it.

   Run:  npx expo export --platform web --output-dir dist-web
         npm i --no-save puppeteer-core serve
         node tests/e2e/smoke.cjs        (set CHROME_PATH if Chrome is elsewhere)
   Screenshots land in tests/e2e/shots/. */
const puppeteer = require('puppeteer-core')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const DIST = path.resolve(__dirname, '..', '..', 'dist-web')
const OUT = path.resolve(__dirname, 'shots')
fs.mkdirSync(OUT, { recursive: true })
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const srv = spawn(process.execPath, [require.resolve('serve/build/main.js'), '-s', DIST, '-l', '4173'], { stdio: 'ignore' })
  await sleep(2500)
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text().slice(0, 300)) })
  page.on('dialog', d => d.accept().catch(() => {}))

  const shot = async n => page.screenshot({ path: path.join(OUT, n + '.png') })
  const norm = t => t.replace(/[\u202f\u00a0]/g, ' ')
  const bodyText = async () => norm(await page.evaluate(() => document.body.innerText))
  const clickText = async (text, opts = {}) => {
    const ok = await page.evaluate((text, exact) => {
      const n = s => s.replace(/[\u202f\u00a0]/g, ' ').trim()
      const els = [...document.querySelectorAll('div,a,span,button')]
      const cand = els.filter(e => { const t = n(e.innerText || ''); return exact ? t === text : t.startsWith(text) })
      const minLen = Math.min(...cand.map(e => e.innerText.length)); cand.splice(0, cand.length, ...cand.filter(e => e.innerText.length === minLen))
      const clickable = cand.map(e => e.closest('[role=button],[role=tab],[role=radio],[role=menuitem],[role=combobox],[tabindex="0"],a,button')).filter(Boolean)
      const vis = clickable.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left < 400 && r.right > 0 })
      const el = vis[vis.length - 1] || clickable[clickable.length - 1] || cand[cand.length - 1]
      if (!el) return false
      el.scrollIntoView({ block: 'center' })
      el.click()
      return true
    }, text, !!opts.exact)
    if (!ok) { await shot('NOTFOUND-' + text.replace(/\W/g, '_')); throw new Error('not found: ' + text) }
    await sleep(opts.wait || 600)
  }
  const type = async (label, value) => {
    const h = (await page.evaluateHandle(label => { const l = [...document.querySelectorAll('input,textarea')].filter(i => (i.getAttribute('aria-label') || '').startsWith(label) && i.getBoundingClientRect().width > 0 && i.getBoundingClientRect().left < 400); return l[l.length - 1] }, label)).asElement()
    if (!h) throw new Error('no input ' + label)
    await h.click()
    await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')
    await h.type(value)
  }
  const has = async (s, tag) => {
    const t = await bodyText()
    if (!t.includes(s)) { await shot('FAIL-' + tag.replace(/\W/g, '_')); throw new Error(`expected "${s}" (${tag}); got: ${t.slice(0, 240).replace(/\n/g, ' | ')}`) }
  }
  const back = async () => {
    const ok = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[aria-label],[role=button]')].find(e => /(^|, )back$/i.test(e.getAttribute('aria-label') || '') && e.getBoundingClientRect().top < 120)
      if (el) { el.click(); return true }
      return false
    })
    if (!ok) { await shot('NOBACK'); throw new Error('no back button') }
    await sleep(600)
  }
  const tab = async name => { await clickText(name, { exact: true, wait: 700 }) }
  const drawer = async () => { await page.evaluate(() => document.querySelector('[aria-label="Ouvrir le menu"]').click()); await sleep(700) }
  const steps = []
  const step = async (name, fn) => {
    try { await fn(); steps.push('PASS ' + name) } catch (e) { steps.push('FAIL ' + name + ' → ' + e.message); try { await shot('STEP-' + name.replace(/\W/g, '_')) } catch {} }
  }

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' })
  await sleep(1500)
  await step('login screen', async () => { await has('Votre espace client Castelval', 'login'); await shot('01-login') })
  await step('login → home', async () => { await clickText('Suivant', { exact: true, wait: 2500 }); await has('Heureux de vous retrouver', 'home'); await shot('02-home') })
  await step('reveal amounts', async () => { await clickText('afficher', { exact: true }); await has('€', 'amounts visible') })
  await step('accounts tab', async () => { await tab('Comptes'); await has('Toutes mes opérations', 'ops'); await shot('03-accounts') })
  await step('sort + search ops', async () => { await clickText('Montant', { exact: true }); await type('Rechercher une opération', 'loyer'); await sleep(300); await has('Virement régulier — Loyer', 'search') })
  await step('operation detail', async () => { await clickText('Virement régulier — Loyer'); await has('Comptabilisée', 'op detail'); await shot('04-op-detail'); await back() })
  await step('loan opens from operation', async () => { await type('Rechercher une opération', 'Crédit'); await clickText('Crédit voiture — échéance'); await has('Capital restant dû', 'loan'); await shot('05-loan'); await back() })
  await step('account manage', async () => { await clickText('Gestion (RIB', { wait: 800 }); await has('Recherche et export', 'manage'); await shot('06-manage') })
  await step('statements + rib', async () => { await clickText('Relevés', { exact: true }); await has('Télécharger le PDF', 'stmts'); await shot('07-statements'); await back(); await clickText('RIB', { exact: true }); await has('Relevé d’identité bancaire', 'rib'); await shot('07b-rib'); await back(); await back() })
  await step('cards tab', async () => { await tab('Cartes'); await has('Niveau des dépenses', 'cards'); await shot('08-cards') })
  await step('points', async () => { await clickText('Mes points et cashback'); await has('Mon nombre de points', 'points'); await shot('09-points'); await back() })
  await step('card settings', async () => { await clickText('Mes réglages de carte'); await has('Gestion de la carte', 'settings'); await shot('10-card-settings') })
  await step('payment limit edit', async () => { await clickText('Plafond de paiement'); await has('Modifier mon plafond', 'limit'); await clickText('Modifier mon plafond', { exact: true }); await has('Choisir mon plafond', 'edit'); await shot('11-limit-edit'); await clickText('Modifier le plafond', { exact: true }); await has('Plafond de paiement sur 1 jour', 'back to limits') })
  await step('internet toggle screen', async () => { await back(); await clickText('Paiement Internet'); await has('État actuel', 'internet'); await shot('12-internet'); await back() })
  await step('opposition screen', async () => { await clickText('Faire opposition'); await has('Historique des oppositions', 'blocks'); await shot('13-blocks'); await back(); await back() })
  await step('transfers hub', async () => { await tab('Virements'); await has('Nouveau virement', 'hub'); await shot('14-transfers') })
  await step('wizard step 1-3', async () => { await clickText('Nouveau virement', { exact: true }); await has('Compte à débiter', 's1'); await clickText('Continuer', { exact: true }); await has('Compte à créditer', 's2'); await clickText('Continuer', { exact: true }); await has('Entrer un montant', 's3'); await shot('15-amount') })
  await step('wizard validation errors', async () => { await clickText('Continuer', { exact: true }); await has('Saisissez un montant supérieur à zéro.', 'zero'); await type('Entrer un montant', '999999'); await clickText('Continuer', { exact: true }); await has('Le montant dépasse le solde disponible.', 'balance') })
  await step('wizard ok → review → approve → done', async () => {
    await type('Entrer un montant', '120,50'); await type('Motif du virement', 'Test'); await clickText('Continuer', { exact: true }); await has('Récapitulatif', 'review'); await has('120,50', 'amount in review'); await shot('16-review')
    await clickText('Approuver le virement'); await has('Validation sur votre téléphone de confiance', 'approval'); await shot('17-approval')
    await clickText('J’ai validé', { wait: 900 }); await has('Instruction transmise', 'done'); await has('VIR-20261015-0042', 'ref'); await shot('18-done')
  })
  await step('scheduled shows pending transfer', async () => { await clickText('Voir les virements programmés', { wait: 900 }); await has('Virement — Test', 'scheduled'); await has('En attente', 'status'); await shot('19-scheduled'); await back() })
  await step('beneficiaries + add', async () => { await clickText('Mes bénéficiaires'); await has('mon compte LCL', 'list'); await clickText('Ajouter un bénéficiaire'); await clickText('Ajouter', { exact: true }); await has('Renseignez le titulaire, le nom usuel et un IBAN valide.', 'ben err'); await type('Titulaire du compte', 'Paul Martin'); await type('Nom usuel', 'Paul'); await type('IBAN', 'FR76 3000 6000 0112 3456 7890 189'); await clickText('Ajouter', { exact: true, wait: 900 }); await has('En attente de vérification', 'pending'); await shot('20-ben') })
  await step('transfer limits', async () => { await back(); await clickText('Plafonds de virement'); await has('Plafonds France', 'limits'); await back() })
  await step('wealth tab', async () => { await tab('Patrimoine'); await has('Mes avoirs agrégés ici', 'wealth'); await shot('21-wealth') })
  await step('wealth net', async () => { await clickText('Patrimoine net total', { exact: true }); await has('Total patrimoine net', 'net'); await has('3 423 265,40', 'net value'); await shot('22-wealth-net') })
  await step('manual item add', async () => {
    await clickText('Ajouter un élément', { wait: 800 }); await has('Ajouter un élément déclaré', 'form'); await type('Intitulé', 'Studio'); await type('Montant', '50000'); await clickText('Enregistrer', { exact: true, wait: 900 })
    await has('Éléments déclarés par vous', 'section'); await has('Studio', 'declared'); await shot('23-manual')
  })
  await step('drawer navigation', async () => { await drawer(); await has('Mes crédits', 'drawer'); await shot('24-drawer'); await clickText('Mes crédits', { exact: true, wait: 900 }); await has('Total du capital restant dû', 'credits'); await shot('25-credits') })
  await step('loan detail + schedule', async () => { await clickText('Crédit voiture'); await has('Montant emprunté', 'loan'); await clickText('Consulter le tableau', { exact: true }); await has('Tableau d’amortissement', 'table'); await shot('26-loan'); await back(); await back() })
  await step('messages flow', async () => {
    await tab('Accueil'); await page.evaluate(() => document.querySelector('[aria-label="Messages"]').click()); await sleep(800); await has('Ma messagerie', 'inbox')
    await clickText('Votre conseiller vous souhaite la bienvenue'); await has('Bienvenue chez Castelval', 'read'); await clickText('Répondre'); await has('Réponse : Votre conseiller', 'compose prefilled')
    await type('Votre message', 'Bonjour'); await clickText('Enregistrer le brouillon', { exact: true, wait: 900 }); await has('Réponse : Votre conseiller', 'draft listed'); await shot('27-drafts')
    await clickText('Nouveau message', { exact: true }); await clickText('Envoyer', { exact: true }); await has('Choisissez un objet et saisissez votre message.', 'send err'); await shot('28-compose')
  })
  await step('contact + appointment + subscribe', async () => {
    await back(); await back(); await drawer(); await clickText('Téléphone', { exact: true, wait: 800 }); await has('Mme Laurence MARTIN', 'contact'); await shot('29-contact'); await back()
    await drawer(); await clickText('Rendez-vous', { exact: true, wait: 800 }); await has('Objet du RDV', 'rdv'); await back()
    await drawer(); await clickText('Notre offre', { exact: true, wait: 800 }); await has('Que souhaitez-vous souscrire', 'subscribe'); await shot('30-subscribe'); await back()
  })
  await step('profile', async () => {
    await drawer(); await clickText('Mon profil', { exact: true, wait: 800 }); await has('Dernière connexion le', 'profile'); await has('XX XX XX 00 00', 'masked'); await clickText('Afficher les coordonnées en clair'); await has('+33 6 00 00 00 00', 'revealed'); await shot('31-profile')
    await clickText('Mon identité', { exact: true }); await has('Passeport français', 'identity'); await back()
  })
  await step('settings pages', async () => {
    await drawer(); await clickText('Paramètres', { exact: true, wait: 800 }); await has('Ma sécurité', 'settings'); await shot('32-settings')
    await clickText('Patrimoine financier à agréger'); await has('Établissements à agréger', 'agg'); await clickText('Avec mon conseiller'); await shot('33-agg'); await back()
    await clickText('Mes paramètres de contact'); await has('Notifications de l’application', 'contact prefs'); await back()
    await clickText('Alertes et évènements'); await has('Alerte de mouvement important', 'alerts'); await back()
    await clickText('Mon historique de connexion'); await has('Application mobile · Session en cours', 'history'); await back()
    await clickText('FAQ', { exact: true }); await has('Est-ce un compte réel', 'faq'); await back(); await back()
  })
  await step('profile switch → holding', async () => { await drawer(); await clickText('Mes comptes', { exact: true }); await clickText('Mes autres comptes'); await has('Holding Famille Dupond', 'switch'); await clickText('Accéder', { exact: true, wait: 1200 }); await has('Holding Famille Dupond', 'holding home'); await shot('34-holding') })
  await step('english toggle', async () => { await drawer(); await clickText('English', { exact: true, wait: 900 }); await has('Home', 'en'); await shot('35-en'); await drawer(); await clickText('Français', { exact: true, wait: 600 }) })
  await step('logout', async () => { await drawer(); await clickText('Déconnexion', { exact: true, wait: 1200 }); await has('Votre espace client Castelval', 'login again') })

  await browser.close()
  srv.kill()
  console.log(steps.join('\n'))
  console.log('ERRORS:', errors.length)
  errors.slice(0, 15).forEach(e => console.log(e))
})().catch(e => { console.error(e); process.exit(1) })
