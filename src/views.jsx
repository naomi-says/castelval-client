import { Fragment } from 'react'
import { P, LIM, R, D, N, LOGO } from './data'
import { hd, kv, tb, bar, swRow, OpsTable, Sel } from './ui'
import tr from './i18n'

/* Wealth computation — same as W() in the original script.
   The establishment filter applies to financial assets only: declared property,
   other assets and loans always count, as on the demo's "Patrimoine net total". */
function W(S) {
  const it = []
  S.sp.forEach(i => P[i].w.forEach(x => it.push({ p: i, l: x[0], i: x[1], m: x[2], c: x[3], g: x[4] || '' })))
  S.man.forEach((x, k) => S.sp.includes(x.p) && it.push({ ...x, k }))
  const s = c => it.filter(x => x.c === c).reduce((t, x) => t + x.m, 0)
  const fin = it.filter(x => x.c === 'fin' && S.si.includes(x.i)).reduce((t, x) => t + x.m, 0)
  const imm = s('imm')
  const aut = s('autre')
  const debt = S.sp.reduce((t, i) => t + P[i].loan.reduce((u, l) => u + l.cap, 0), 0) + s('dette')
  return { a: it, fin, imm, aut, debt, net: fin + imm + aut - debt }
}

function home(x) {
  const { S, p, E, A } = x
  const w = W(S)
  return (
    <>
      <div className="top">
        <h1>Accueil</h1>
        <span>Mardi 6 octobre 2026</span>
      </div>
      <h2 className="greet">{p.g || `Bonjour ${p.n}`}</h2>
      <p className="greet-sub">Heureux de vous retrouver.</p>
      <div className="grid" style={{ marginTop: 18 }}>
        <div className="card c6">
          <h3>Mes comptes et épargne de précaution</h3>
          {p.acc.map((a, i) => (
            <div className="row" key={i}>
              <span>{a[0]}</span>
              <button className="lnk" onClick={() => A.go('comptes', 0, i)}>
                {E(a[2])}
              </button>
            </div>
          ))}
        </div>

        <div className="card c6">
          <div className="row">
            <h3>Mon patrimoine</h3>
            <button className="lnk" onClick={() => A.go('patrimoine')} aria-label="Voir le détail du patrimoine">
              ›
            </button>
          </div>
          <div className="row">
            <b className="big" style={{ fontSize: 26 }}>
              {!S.tog.a ? '••• ••• €' : S.hide ? '••• ••• €' : E(w.net)}
            </b>
            <button className="lnk" onClick={A.tg}>
              {S.hide ? 'afficher' : 'masquer'}
            </button>
          </div>
          <small>
            {S.sp.length === P.length ? 'Tous profils' : 'Profil sélectionné'} ·{' '}
            {S.si.length === 2 ? 'Tous établissements' : 'Avec mon conseiller'}
          </small>
        </div>

        <div className="card c6">
          <div className="row">
            <h3>Mon cashback et mes Points Castelval</h3>
            <button className="lnk" onClick={() => A.go('cartes', 1)} aria-label="Voir mes points et mon cashback">
              ›
            </button>
          </div>
          <p>
            Mes Points : <b>{N(p.card ? p.card.pts : 0)}</b> · Cashback disponible :{' '}
            <b>{S.hide ? '••••• €' : N(Math.round(p.card ? p.card.avail : 0)) + ' €'}</b>
          </p>
        </div>

        <div className="card c6">
          <div className="row">
            <h3>Souscrire</h3>
            <button className="lnk" onClick={() => A.go('souscription')} aria-label="Souscrire">
              ›
            </button>
          </div>
          <p>Épargne, crédit, assurance, cartes et paiements.</p>
        </div>
      </div>
      <small>Les montants et opérations présentés servent uniquement à la démonstration.</small>
    </>
  )
}

/* Content of the client demo's "Mon patrimoine" page */
const CATS = ['Comptes de paiement', 'Épargne de précaution', 'Épargne moyen terme', 'Épargne long terme']

function patrimoine(x) {
  const { S, E, A } = x
  const whole = n => (S.hide ? '••••• €' : N(Math.round(n)) + ' €')
  const scopeText = `${S.sp.length === P.length ? 'Tous profils' : 'Profil sélectionné'} · ${
    S.si.length === 2 ? 'Tous établissements' : 'Avec mon conseiller'
  }`
  const advOn = S.si.includes('Castelval')
  const extOn = S.si.includes('Hors Castelval')
  const products = (i, inst) => P[i].w.filter(y => y[3] === 'fin' && y[1] === inst)
  const sum = list => list.reduce((t, y) => t + y[2], 0)
  const man = (i, c) => S.man.filter(m => m.p === i && m.c === c).reduce((t, m) => t + m.m, 0)

  const finAgr = i => sum(products(i, 'Castelval'))
  const finExt = i => sum(products(i, 'Hors Castelval')) + man(i, 'fin')
  const imm = i => P[i].w.filter(y => y[3] === 'imm').reduce((t, y) => t + y[2], 0) + man(i, 'imm')
  const aut = i => P[i].w.filter(y => y[3] === 'autre').reduce((t, y) => t + y[2], 0) + man(i, 'autre')
  const debtOf = i => P[i].loan.reduce((t, l) => t + l.cap, 0) + man(i, 'dette')

  const advisor = S.sp.reduce((t, i) => t + finAgr(i), 0)
  const external = S.sp.reduce((t, i) => t + finExt(i), 0)
  const finTotal = (advOn ? advisor : 0) + (extOn ? external : 0)
  const immTotal = S.sp.reduce((t, i) => t + imm(i), 0)
  const autTotal = S.sp.reduce((t, i) => t + aut(i), 0)
  const gross = finTotal + immTotal + autTotal
  const debt = S.sp.reduce((t, i) => t + debtOf(i), 0)
  const net = gross - debt

  const frame = (i, inst) => {
    const list = products(i, inst)
    if (!list.length) return null
    return (
      <div className="card" style={{ marginBottom: 14 }} key={inst + i}>
        <div className="row">
          <b>{P[i].n}</b>
          <b>{E(sum(list))}</b>
        </div>
        {CATS.map(cat => {
          const rows = list.filter(y => y[4] === cat)
          if (!rows.length) return null
          return (
            <Fragment key={cat}>
              <small>{cat}</small>
              {rows.map((y, k) => (
                <div className="row" key={k}>
                  <span>
                    {y[0]}
                    <small>
                      {P[i].n} · {inst === 'Castelval' ? 'Castelval' : 'Autre établissement'}
                    </small>
                  </span>
                  <b>{E(y[2])}</b>
                </div>
              ))}
            </Fragment>
          )
        })}
      </div>
    )
  }

  if (S.t === 0) {
    return (
      <>
        {hd(x, 'Mon patrimoine')}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Mes avoirs agrégés ici</h3>
          <div className="big">{whole(finTotal)}</div>
          <p>
            {scopeText}{' '}
            <button className="lnk" onClick={() => A.go('param', 3)}>
              Périmètre
            </button>
          </p>
        </div>

        {advOn && (
          <>
            <div className="card grp-bar" style={{ marginTop: 18 }}>
              <div className="row">
                <b>Mon patrimoine avec mon conseiller</b>
                <b>{E(advisor)}</b>
              </div>
            </div>
            {S.sp.map(i => frame(i, 'Castelval'))}
          </>
        )}

        {extOn && (
          <>
            <div className="card grp-bar" style={{ marginTop: 18 }}>
              <div className="row">
                <b>Mon patrimoine financier géré dans d’autres établissements</b>
                <b>{E(external)}</b>
              </div>
            </div>
            {S.sp.map(i => frame(i, 'Hors Castelval'))}
          </>
        )}

        <div className="acts">
          <button className="btn cta" style={{ width: 'auto' }} onClick={() => A.man({ c: 'fin' })}>
            Ajouter un avoir géré ailleurs
          </button>
          <button onClick={A.exp}>Exporter le détail</button>
        </div>
      </>
    )
  }

  return (
    <>
      {hd(x, 'Mon patrimoine')}
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>Patrimoine net estimé</h3>
        <div className="big">{whole(net)}</div>
        <p>
          {scopeText}{' '}
          <button className="lnk" onClick={() => A.go('param', 3)}>
            Périmètre
          </button>
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="row">
          <b>Patrimoine financier</b>
          <b>{E(finTotal)}</b>
        </div>
        {S.sp.map(i => (
          <div key={i}>
            <div className="row" style={{ marginTop: 10 }}>
              <b>{P[i].n}</b>
              <b>{E(finAgr(i) + (extOn ? finExt(i) : 0))}</b>
            </div>
            <div className="row">
              <span>Financier agrégé dans cette application</span>
              <b>{E(finAgr(i))}</b>
            </div>
            {extOn && (
              <div className="row">
                <span>Financier non agrégé · Autres établissements</span>
                <b>{E(finExt(i))}</b>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <b>Biens immobiliers déclarés</b>
          <b>{E(immTotal)}</b>
        </div>
        {S.sp.map(i => (
          <div key={i}>
            <div className="row" style={{ marginTop: 10 }}>
              <b>{P[i].n}</b>
              <b>{E(imm(i))}</b>
            </div>
            {P[i].w
              .filter(y => y[3] === 'imm')
              .map((y, k) => (
                <div className="row" key={k}>
                  <span>{y[0]}</span>
                  <b>{E(y[2])}</b>
                </div>
              ))}
            {S.man
              .filter(m => m.p === i && m.c === 'imm')
              .map((m, k) => (
                <div className="row" key={'m' + k}>
                  <span>
                    {m.l}
                    <small>Déclaré par vous</small>
                  </span>
                  <b>{E(m.m)}</b>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <b>Autre patrimoine ajouté manuellement</b>
          <b>{E(autTotal)}</b>
        </div>
        {S.sp.map(i => (
          <div className="row" key={i}>
            <span>{P[i].n}</span>
            <b>{E(aut(i))}</b>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <b>Total patrimoine brut</b>
          <b className="big" style={{ fontSize: 26 }}>
            {E(gross)}
          </b>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <b>Crédits · Capital restant dû</b>
          <b>{E(debt)}</b>
        </div>
        {S.sp.map(i => (
          <div key={i}>
            <div className="row" style={{ marginTop: 10 }}>
              <b>{P[i].n}</b>
              <b>{E(debtOf(i))}</b>
            </div>
            {P[i].loan.map((l, k) => (
              <div className="row" key={k}>
                <span>
                  {l.n}
                  <small>{l.m} mois restants</small>
                </span>
                <b>{E(l.cap)}</b>
              </div>
            ))}
            {S.man
              .filter(m => m.p === i && m.c === 'dette')
              .map((m, k) => (
                <div className="row" key={'d' + k}>
                  <span>
                    {m.l}
                    <small>Déclaré par vous</small>
                  </span>
                  <b>{E(m.m)}</b>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <b>Total patrimoine net</b>
          <b className="big" style={{ fontSize: 30 }}>
            {E(net)}
          </b>
        </div>
        <small>
          Estimation fondée sur les montants connus et déclarés. Hypothèse : biens intégralement détenus par chaque
          profil, sans pondération de la participation de Jean Dupond dans la Holding. Données fictives.
        </small>
      </div>

      {S.man.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Éléments déclarés par vous</h3>
          {tb(
            ['Profil', 'Intitulé', 'Montant', ''],
            S.man
              .map((m, k) =>
                S.sp.includes(m.p)
                  ? [
                      P[m.p].n,
                      m.l,
                      (m.c === 'dette' ? '−' : '') + E(m.m),
                      <>
                        <button className="lnk" onClick={() => A.man({ i: k })}>
                          Modifier
                        </button>{' '}
                        <button className="lnk" onClick={() => A.mand(k)}>
                          Supprimer
                        </button>
                      </>
                    ]
                  : null
              )
              .filter(Boolean)
          )}
        </div>
      )}

      <div className="acts">
        <button className="btn cta" style={{ width: 'auto' }} onClick={() => A.man({ c: 'imm' })}>
          Ajouter un élément
        </button>
        <button onClick={A.exp}>Exporter le détail</button>
      </div>
    </>
  )
}

function ptitle(title, right) {
  return (
    <div className="ptitle">
      <h1>{title}</h1>
      {right && <span>{right}</span>}
    </div>
  )
}

function comptes(x) {
  const { S, p, E, A } = x
  const list = [...p.acc, ...(p.extra || [])]
  const a = Math.min(S.ai, list.length - 1)
  const ac = list[a]
  const name = ac[0] === 'Compte de paiement' ? 'Mon compte de paiement' : ac[0]
  const sel = (
    <>
      <label htmlFor="acct">Choisir un compte</label>
      <Sel id="acct" value={a} onChange={v => A.sel('ai', +v)} ariaLabel="Choisir un compte">
        {list.map((y, i) => (
          <option key={i} value={i}>
            {y[0] === 'Compte de paiement' ? 'Mon compte de paiement' : y[0]} — {E(y[2])}
          </option>
        ))}
      </Sel>
    </>
  )

  const upTotal = p.up.reduce((t, u) => t + u[3], 0)
  const chars =
    ac[0] === 'Livret Castelval F' || ac[0] === 'Livret Castelval B'
      ? [
          ['Taux de rémunération', ac[0] === 'Livret Castelval F' ? '2 %' : '2,1 %'],
          ['Seuil des dépôts', '10,00 €']
        ]
      : ac[0] === 'Compte à terme'
      ? [
          ['Date d’ouverture', '30 septembre 2026'],
          ['Échéance', '30 septembre 2027'],
          ['Taux de rémunération', 'Non renseigné']
        ]
      : []

  if (S.t === 0) {
    return (
      <>
        {ptitle('Mes opérations', 'Situation au 6 octobre 2026')}
        <div className="card">
          {sel}
          <p>
            {p.n} · {ac[1]}
          </p>
          <div className="row">
            <span>Solde actuel :</span>
            <b className="big" style={{ fontSize: 30 }}>
              {E(ac[2])}
            </b>
          </div>
          <div className="row">
            <span>Opérations à venir :</span>
            <b>{E(p.up.reduce((t, u) => t + u[3], 0))}</b>
            <button className="lnk" onClick={() => A.go('virements', 3)}>
              détail
            </button>
          </div>
          <div className="acts">
            <button onClick={A.tfs}>Virement</button>
            <button onClick={() => A.tab(1)}>Gestion (RIB…)</button>
          </div>
          <div className="ledger-head" style={{ marginTop: 18 }}>
            <h3 className="ledger-title">Toutes mes opérations</h3>
            <div className="ledger-balance">
              <span>Solde au 12/10/2026</span>
              <b>{E(ac[2])}</b>
            </div>
          </div>
          <p className="ledger-context">
            {name}, {p.n}
          </p>
          <OpsTable rows={p.tx[a] || []} sort={S.sort} onSort={A.sort} E={E} onRow={A.op} />
          <p className="ledger-note">
            Données de démonstration. Les opérations à venir sont prévisionnelles et ne sont pas incluses dans le solde
            disponible.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      {ptitle('Gérer le compte', 'Situation au 6 octobre 2026')}

      <div className="gc-panel">
        <div>
          <Sel value={a} onChange={v => A.sel('ai', +v)} ariaLabel="Choisir un compte">
            {list.map((y, i) => (
              <option key={i} value={i}>
                {y[0] === 'Compte de paiement' ? 'Mon compte de paiement' : y[0]}
              </option>
            ))}
          </Sel>
          <p className="gc-owner">
            {p.n} · {ac[1]}
          </p>
          <p className="gc-solde">
            <span>
              Solde actuel : <b>{E(ac[2])}</b>
            </span>
            <span>
              Opérations à venir : <b>{E(upTotal)}</b>{' '}
              <button className="lnk" onClick={() => A.go('virements', 3)}>
                détail ›
              </button>
            </span>
          </p>
        </div>
        <div className="gc-links">
          <button onClick={A.tfs}>Virement</button>
          <button onClick={() => A.doc('d-stm')}>Relevés</button>
          <button onClick={A.stm}>Télécharger</button>
          <button onClick={() => A.say('RIB de démonstration : ' + ac[1])}>RIB</button>
        </div>
      </div>

      <div className="gc-ops">
        <div className="ledger-head">
          <h3 className="ledger-title">Toutes mes opérations</h3>
          <div className="ledger-balance">
            <span>Solde au 12/10/2026</span>
            <b>{E(ac[2])}</b>
          </div>
        </div>
        <div className="ledger-tools">
          <p className="ledger-context">
            {name}, {p.n}
          </p>
          <label className="sw">
            <input type="checkbox" checked={S.adv} onChange={e => A.adv(e.target.checked)} /> Mode avancé
          </label>
        </div>
        <OpsTable rows={p.tx[a] || []} sort={S.sort} onSort={A.sort} E={E} onRow={A.op} adv={S.adv} />
        <p className="ledger-note">
          Données de démonstration. Les opérations à venir sont prévisionnelles et ne sont pas incluses dans le solde
          disponible.
        </p>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        <div className="card c6">
          <h3>Détail du compte</h3>
          {kv([
            ['Titulaire', p.n],
            ['IBAN', ac[1]],
            ['BIC', 'Non renseigné'],
            ...chars
          ])}
          <div className="acts">
            <button onClick={A.tfs}>Faire un virement</button>
          </div>
        </div>
        <div className="card c6">
          <h3>Recherche et export</h3>
          <label htmlFor="d1">Du</label>
          <input id="d1" type="date" defaultValue="2026-09-01" />
          <label htmlFor="d2">Jusqu’au</label>
          <input id="d2" type="date" defaultValue="2026-10-15" />
          <div className="acts">
            <button onClick={A.exp}>Exporter</button>
          </div>
        </div>
        <div className="card c12">
          <h3 className="ledger-title">Mes opérations à venir</h3>
          <OpsTable rows={p.up} sort={S.sort} onSort={A.sort} E={E} variant="scheduled" />
        </div>
      </div>
    </>
  )
}

function cartes(x) {
  const { S, p, E, A } = x
  const c = p.card

  if (!c) {
    return (
      <>
        {ptitle('Mes cartes')}
        <div className="card">Aucune carte de paiement pour ce profil.</div>
      </>
    )
  }

  const marie = c.marie || null
  const all = S.cx === -1 && !!marie
  const own = S.cx === 1 && marie ? marie : c
  const ownLimit = own === marie ? marie.lim[0] : S.lims[S.p].payment[2]
  const used = all ? c.used[0] + marie.used[0] : own.used[0]
  const limit = all ? S.lims[S.p].payment[2] + marie.lim[0] : ownLimit
  const exps = all ? [...c.sp, ...marie.sp] : own.sp
  const activated = !!(S.acts && S.acts[S.p])
  const status = S.cs.opp
    ? 'En opposition'
    : S.cs.blk
    ? 'Bloquée temporairement'
    : activated
    ? 'Active'
    : 'À activer'

  if (S.t === 0) {
    return (
      <>
        {hd(x, 'Mes cartes', 3)}
        <label className="card-selector">
          Cartes à consulter
          <Sel value={S.cx} onChange={v => A.cx(+v)} ariaLabel="Cartes à consulter">
            {marie && <option value={-1}>Toutes cartes</option>}
            <option value={0}>{c.label || 'Carte Jean Dupond'}</option>
            {marie && <option value={1}>{marie.label}</option>}
          </Sel>
        </label>

        <section className="card-panel">
          <div className="cp-head">
            <h3>Niveau des dépenses</h3>
            <button className="cp-manage" onClick={() => A.tab(2)}>
              Gérer
            </button>
          </div>
          <div className="cp-title">
            <span>Dépenses carte sur 30 jours</span>
            <b>
              {E(used)} / {E(limit)}
            </b>
          </div>
          {bar(used, limit)}
          <div className="cp-caption">
            <span>
              Utilisé : {E(used)} · {limit ? Math.round((used / limit) * 100) : 0} %
            </span>
            <span>Disponible : {E(Math.max(0, limit - used))}</span>
          </div>
          {all && (
            <p className="cp-note">Dépenses et plafonds cumulés des cartes Jean Dupond et Marie Dupond.</p>
          )}
        </section>

        <section className="card-panel" style={{ marginTop: 20 }}>
          <h3>Dernières dépenses carte</h3>
          <p className="cp-count">
            {exps.length} dépense{exps.length > 1 ? 's' : ''}
          </p>
          {exps.length ? (
            <OpsTable rows={exps} sort={S.sort} onSort={A.sort} E={E} />
          ) : (
            <p className="cp-empty">Aucune dépense carte sur cette période.</p>
          )}
        </section>
      </>
    )
  }

  if (S.t === 1) {
    /* position of the current points total on the three-step cashback scale */
    const pos =
      c.pts >= 100000
        ? 2 + Math.min(1, (c.pts - 100000) / 60000)
        : c.pts >= 20000
        ? 1 + (c.pts - 20000) / 80000
        : c.pts / 20000
    const pct = Math.max(3, Math.min(97, (pos / 3) * 100))

    return (
      <>
        {hd(x, 'Mes cartes', 3)}
        <section className="cb-panel">
          <h3>Mon nombre de points</h3>
          <p>
            Mon nombre de Points Castelval <b>{N(c.pts)}</b>.
          </p>
          <p>
            {c.pts >= 100000 ? (
              <>
                Ce nombre de Points Castelval donne accès au <b>statut Or</b>, avec une carte offrant un cashback de{' '}
                {N(c.rate)} % et des assurances et services niveau Or.
              </>
            ) : (
              <>Ce nombre de Points Castelval donne accès à une carte offrant un cashback de {N(c.rate)} %.</>
            )}
          </p>
          <div className="cb-gauge-wrap">
            <div className="cb-gauge">
              <span>0,2 %</span>
              <span>0,5 %</span>
              <span>1 %</span>
            </div>
            <div className="cb-axis">
              <span style={{ left: '33.333%' }}>20 000</span>
              <span style={{ left: '66.666%' }}>100 000</span>
            </div>
            <div className="cb-now-row">
              <span className="cb-now" style={{ left: pct + '%' }}>
                <i />
                <b>{N(c.pts)}</b>
              </span>
            </div>
          </div>
          <div className="cb-center">
            <button onClick={() => A.modal('pts')}>Comment gagner des Points Castelval</button>
          </div>
        </section>

        <section className="cb-panel">
          <h3>Mon cashback gagné grâce à mes points</h3>
          <div className="cb-row">
            <span>Mon Cashback disponible</span>
            <b>{S.hide ? '••••• €' : N(Math.round(c.avail)) + ' €'}</b>
          </div>
          <p className="cb-hist">Historique de mon Cashback reçu et utilisé</p>
          <div className="cb-actions">
            <button onClick={() => A.modal('cbx')}>Transformer mes Points Castelval en Cashback</button>
            <button onClick={() => A.modal('spend')}>Dépenser mon Cashback</button>
          </div>
        </section>

        <section className="cb-panel">
          <h3>Les autres avantages de ma carte</h3>
          <div className="cb-actions">
            <button onClick={() => A.modal('cassur')}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3l7 3v6c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6z" />
              </svg>
              Mes assurances
            </button>
            <button onClick={() => A.modal('cassist')}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="7" y="2.5" width="10" height="19" rx="2" />
                <path d="M10.5 18.5h3" />
              </svg>
              Mon assistance
            </button>
          </div>
        </section>
      </>
    )
  }

  if (S.t === 2) {
    return (
      <>
        {hd(x, 'Mes cartes', 3)}
        <section className="card-overview">
          <div className="card-art" aria-hidden="true">
            <div className="chip" />
            <div className="brandline">
              <img src={LOGO} alt="" />
              <span>CASTELVAL</span>
            </div>
            <div className="visa">VISA</div>
          </div>
          <div className="card-ident">
            <small className="eyebrow">Compte de paiement · Castelval</small>
            <h3>Carte Castelval · Visa</h3>
            <p className="holder">{c.holder || p.n}</p>
            <p className="num">N° {c.num || c.n.slice(-4)}</p>
            <span className="card-status">{status}</span>
            <div className="card-btns">
              <button onClick={() => A.open('activate')} disabled={activated}>
                {activated ? 'Carte activée' : 'Activer ma carte'}
              </button>
              <button onClick={() => A.open('virtual')}>Carte virtuelle</button>
            </div>
            <div className="card-wallets">
              <button onClick={() => A.open('mobilepay')}>Apple Pay</button>
              <button onClick={() => A.open('mobilepay')}>Google Pay</button>
            </div>
          </div>
        </section>

        <section className="card-panel">
          <h3>Gestion de la carte</h3>
          <div className="cm-list">
            <button onClick={A.block}>
              <span>{S.cs.blk ? 'Débloquer temporairement' : 'Bloquer temporairement'}</span>
            </button>
            <button onClick={() => A.go('plafond-paiement')}>
              <span>Plafond de paiement *</span>
            </button>
            <button onClick={() => A.go('plafond-retrait')}>
              <span>Plafond de retrait *</span>
            </button>
            <button onClick={() => A.open('internet')}>
              <span>Paiement Internet</span>
              <small>{S.cs.on ? 'Activé' : 'Non activé'}</small>
            </button>
            <button onClick={() => A.open('contactless')}>
              <span>Paiement sans contact</span>
              <small>{S.cs.nfc ? 'Activé' : 'Non activé'}</small>
            </button>
            <button onClick={() => A.open('code')}>
              <span>Voir ou changer mon code *</span>
            </button>
            <button onClick={() => A.open('viewcard')}>
              <span>Voir ma carte *</span>
            </button>
            <button onClick={() => A.tab(3)}>
              <span>Faire opposition</span>
            </button>
          </div>
          <p className="cm-note">* Validation sur votre téléphone de confiance.</p>
        </section>

        <p className="cp-demo">
          Carte et opérations de démonstration. Les confirmations sont simulées ; aucune carte réelle n’est modifiée.
        </p>
      </>
    )
  }

  return (
    <>
      {ptitle('Opposition carte et chéquier')}
      <button className="lnk" style={{ marginBottom: 14 }} onClick={() => A.tab(2)}>
        ← Revenir à ma carte
      </button>
      <div className="card">
        {swRow('Blocage temporaire', S.cs.blk, v => A.cs('blk', v))}
        <p>
          État :{' '}
          <span className="tag">
            {S.cs.opp ? 'Opposition enregistrée' : S.cs.blk ? 'Bloquée temporairement' : 'Active'}
          </span>
        </p>
        <button className="btn cta" style={{ width: 'auto' }} onClick={() => A.open('opp')}>
          Faire opposition
        </button>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Historique des oppositions</h3>
        <p>{S.cs.opp ? 'Opposition enregistrée sur la carte ' + (c.num || c.n.slice(-4)) + '.' : 'Aucune opposition n’a été créée.'}</p>
      </div>
    </>
  )
}

function virements(x) {
  const { S, p, E, A, err, refs } = x
  const f = S.tf
  const di = f.d || 0
  const bn = S.ben[S.p].filter(b => b[4] === 'Vérifié')
  const cn = v =>
    v[0] === 'a'
      ? `Mon ${p.acc[v.slice(1)][0].toLowerCase()} — ${p.n}`
      : `${bn[v.slice(1)][0]} (${bn[v.slice(1)][1]})`
  const beneLimit = v =>
    v[0] === 'a' ? 'Sans limite' : bn[v.slice(1)][5] == null ? 'Sans limite' : R(bn[v.slice(1)][5])
  const h = hd(x, 'Virements')

  if (S.t === 0) {
    const st = ['Compte à débiter', 'Compte à créditer', 'Montant et caractéristiques', 'Récapitulatif', 'Confirmation']
    const d = p.acc[di]
    return (
      <>
        {h}
        <div className="st">
          {st.map((s, i) => (
            <span key={i} className={i === S.step ? 'on' : ''}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <div className="card">
          {S.step === 0 && (
            <>
              <label htmlFor="tf0">Compte à débiter</label>
              <Sel id="tf0" value={f.d !== undefined ? f.d : 0} onChange={v => A.tfAcc(+v)}>
                {p.acc.map((y, i) => (
                  <option key={i} value={i}>
                    {y[0]} — {E(y[2])}
                  </option>
                ))}
              </Sel>
            </>
          )}

          {S.step === 1 && (
            <>
              <label htmlFor="tf1">Compte à créditer</label>
              <Sel id="tf1" value={f.c || 'a' + (di === 0 ? 1 : 0)} onChange={A.tfBen}>
                {p.acc.map((y, i) =>
                  i !== di ? (
                    <option key={'a' + i} value={'a' + i}>
                      Mon {y[0].toLowerCase()}
                    </option>
                  ) : null
                )}
                {bn.map((b, i) => (
                  <option key={'b' + i} value={'b' + i}>
                    {b[0]} (bénéficiaire)
                  </option>
                ))}
              </Sel>
            </>
          )}

          {S.step === 2 && (
            <>
              <p>
                Solde disponible : <b>{E(d[2])}</b> · Plafond de virement disponible (1 jour) :{' '}
                <b>{E(LIM[0][1] - LIM[0][2])}</b>
              </p>
              <label htmlFor="tf2">Entrer un montant</label>
              <input id="tf2" ref={refs.tf2} inputMode="decimal" placeholder="0,00" defaultValue={f.m || ''} />
              <div className="row">
                <span>Type de virement</span>
                <b>Virement standard (1-3 j)</b>
              </div>
              <label htmlFor="tf3">Date d’exécution</label>
              <input id="tf3" ref={refs.tf3} type="date" defaultValue={f.dt || '2026-10-15'} />
              <label htmlFor="tf4">Motif du virement (facultatif)</label>
              <input id="tf4" ref={refs.tf4} placeholder="Affiché sur les deux comptes" defaultValue={f.mo || ''} />
              <small>Virement de démonstration. Aucun mouvement bancaire réel ne sera effectué.</small>
            </>
          )}

          {S.step === 3 &&
            kv([
              ['Compte à débiter', `${d[0]} — ${p.n}`],
              ['Compte à créditer', cn(f.c)],
              ['Plafond de virement du bénéficiaire', beneLimit(f.c)],
              ['Montant', R(f.m)],
              ['Quand', 'Ponctuel'],
              ['Type de virement', 'Virement standard (1-3 j)'],
              ['Date d’exécution', D(f.dt)],
              ['Motif du virement', f.mo || 'Non renseigné']
            ])}

          {S.step === 4 && (
            <>
              <h3>Instruction transmise</h3>
              {kv([
                ['Statut', 'En attente de traitement'],
                ['Référence', 'VIR-20261015-0042']
              ])}
              <p>
                Le statut définitif apparaîtra dans « Virements programmés et prélèvements » dès confirmation par le
                service de paiement.
              </p>
            </>
          )}

          <p id="err" className="neg" role="alert">
            {err}
          </p>
          <div className="acts">
            {S.step > 0 && S.step < 4 && <button onClick={A.back}>Retour</button>}
            {S.step < 3 && (
              <button className="btn cta" style={{ width: 'auto', margin: 0 }} onClick={A.next}>
                Continuer
              </button>
            )}
            {S.step === 3 && (
              <button className="btn cta" style={{ width: 'auto', margin: 0 }} onClick={() => A.open('appr')}>
                Approuver le virement
              </button>
            )}
            {S.step === 4 && <button onClick={A.newtf}>Nouveau virement</button>}
          </div>
        </div>
      </>
    )
  }

  if (S.t === 1) {
    return (
      <>
        {h}
        <div className="card">
          {tb(
            ['Nom', 'Titulaire', 'Plafond de virement', 'Statut', ''],
            S.ben[S.p].map((b, i) => [
              b[0],
              b[1],
              b[5] == null ? 'Sans limite' : R(b[5]),
              <span className="tag">{b[4]}</span>,
              <button className="lnk" onClick={() => A.bd(i)}>
                Détail
              </button>
            ])
          )}
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Ajouter un bénéficiaire</h3>
          <label htmlFor="b1">Titulaire du compte</label>
          <input id="b1" ref={refs.b1} />
          <label htmlFor="b2">Nom usuel</label>
          <input id="b2" ref={refs.b2} />
          <label htmlFor="b3">IBAN</label>
          <input id="b3" ref={refs.b3} />
          <label htmlFor="b4">BIC</label>
          <input id="b4" ref={refs.b4} />
          <p id="err" className="neg" role="alert">
            {err}
          </p>
          <button className="btn cta" style={{ width: 'auto' }} onClick={A.addb}>
            Ajouter
          </button>
          <br />
          <small>La vérification de production reste à définir.</small>
        </div>
      </>
    )
  }

  if (S.t === 2) {
    return (
      <>
        {h}
        <div className="card">
          <h3>Plafonds France</h3>
          {LIM.map((l, i) => (
            <Fragment key={i}>
              <div className="row">
                <span>
                  {l[0]}
                  <small>{l[3]}</small>
                </span>
                <span>
                  Montant maximal
                  <br />
                  <b>{E(l[1])}</b>
                </span>
              </div>
              {bar(l[2], l[1])}
              <small>
                Utilisé : {E(l[2])} · {Math.round((l[2] / l[1]) * 100)} %
                <br />
                Disponible : {E(l[1] - l[2])}
              </small>
              <button className="lnk" onClick={() => A.open('lim')}>
                Modifier mon plafond
              </button>
            </Fragment>
          ))}
          <small>Plafonds et utilisations fictifs, présentés pour la démonstration.</small>
        </div>
      </>
    )
  }

  return (
    <>
      {h}
      <div className="card">
        <div className="ledger-head">
          <h3 className="ledger-title">Virements programmés et prélèvements</h3>
        </div>
        <OpsTable rows={p.up} sort={S.sort} onSort={A.sort} E={E} variant="scheduled" />
        <div className="acts">
          <button onClick={() => A.open('upm')}>Gérer un élément</button>
        </div>
        <p className="ledger-note">
          Données de démonstration. Les opérations à venir sont prévisionnelles et ne sont pas incluses dans le solde
          disponible.
        </p>
      </div>
    </>
  )
}

function assurances(x) {
  return (
    <>
      {hd(x, 'Mes assurances')}
      <div className="card">
        <h3>Aucun contrat à afficher</h3>
        <p>Aucun contrat d’assurance n’est associé à ce profil de démonstration.</p>
        <button className="btn cta" style={{ width: 'auto' }} onClick={() => x.A.open('rdv')}>
          Parler à mon conseiller
        </button>
      </div>
    </>
  )
}

function credits(x) {
  const { p, E, A } = x
  const head = ptitle('Mes crédits', 'Situation au 12 octobre 2026')
  if (!p.loan.length) {
    return (
      <>
        {head}
        <div className="card">Aucun crédit Castelval pour ce profil.</div>
      </>
    )
  }
  const total = p.loan.reduce((t, l) => t + l.cap, 0)
  return (
    <>
      {head}
      <div className="card cr-total">
        <small>Total du capital restant dû</small>
        <b className="big">{E(total)}</b>
        <p>{p.n} · Crédits suivis dans cette application</p>
      </div>
      <div className="card cr-group">
        <div className="cr-group-h">
          <b>{p.n}</b>
          <b>{E(total)}</b>
        </div>
        <small className="cr-cap">
          {p.loan.length === 1 ? 'Crédit suivi dans cette application' : 'Crédits suivis dans cette application'}
        </small>
        {p.loan.map((l, i) => (
          <button className="cr-row" key={i} onClick={() => A.loan(l)}>
            <span className="cr-row-l">
              <b>{l.n}</b>
              <small>
                Prochaine échéance {l.next ? D(l.next) : '—'} · {E(l.mens)}
              </small>
            </span>
            <span className="cr-row-r">
              <b>{E(l.cap)}</b>
              <span className="cr-chev" aria-hidden="true">
                ›
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function documents(x) {
  const { S, p, A } = x
  const titles = [
    'Mes relevés de compte',
    'Mes autres documents à disposition',
    'Mes documents à transmettre',
    'Mes devis et contrats à signer'
  ]
  const section = titles[S.t] || titles[0]

  if (S.t === 1) {
    return (
      <>
        {ptitle(section)}
        <div className="card">
          <div className="row">
            <span>
              Relevé d’identité bancaire
              <small>Compte de paiement · {p.n}</small>
            </span>
            <span>
              <button className="lnk" onClick={A.rib}>
                Consulter
              </button>
            </span>
          </div>
        </div>
      </>
    )
  }

  if (S.t === 2 || S.t === 3) {
    const sign = S.t === 3
    return (
      <>
        {ptitle(section)}
        <div className="card">
          <div className="dlg-empty">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={sign ? 'M7 3h7l5 5v13H7zM14 3v5h5' : 'M3 7h6l2 2h10v11H3z'} />
            </svg>
            <b>{sign ? 'Aucune signature en attente' : 'Votre dossier est à jour'}</b>
            <p>
              {sign
                ? 'Vous retrouverez ici les documents nécessitant votre signature.'
                : 'Aucun document n’est demandé dans ce profil de démonstration.'}
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {ptitle(section)}
      <div className="card">
        {p.doc.map((m, i) => (
          <div className="row" key={i}>
            <span>
              {m[1]}
              <small>
                {m[0]} · {p.n}
              </small>
            </span>
            <span>
              <button className="lnk" onClick={A.stm}>
                Consulter
              </button>{' '}
              ·{' '}
              <button className="lnk" onClick={A.stm}>
                Télécharger
              </button>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function profil(x) {
  const { S, p, A, rev, avatar } = x
  const mask = ([k, v]) => {
    if (rev) return [k, v]
    if (k === 'Téléphone portable' && v !== 'Non renseigné') return [k, 'XX XX XX 00 00']
    if (k === 'Courriel') return [k, v.split('@')[0] + '@•••']
    if (k === 'Adresse' && v !== 'Non renseignée') return [k, '12 rue des •••, 75015 Paris, France']
    return [k, v]
  }
  return (
    <>
      {hd(x, 'Mon profil')}
      {S.t === 0 && (
        <div className="pcard">
          <label className="pava" title="Ajouter une photo" aria-label="Ajouter une photo">
            {avatar ? <img src={avatar} alt="" /> : <b>{p.ini || 'JD'}</b>}
            <svg className="pava-ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v12H4z" />
              <circle cx="12" cy="13.5" r="3.4" />
            </svg>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e => {
                A.pic(e.target.files && e.target.files[0])
                e.target.value = ''
              }}
            />
          </label>
          <button className="lnk pset" onClick={() => A.go('param')}>
            Paramètres
          </button>
          <b className="pname">{p.n}</b>
          <span className="pmail">{p.email}</span>
          <button className="lnk pconn" onClick={A.conn}>
            Dernière connexion le {p.login || '06/10/2026 à 18h10'}
          </button>
        </div>
      )}
      {S.t === 0 && (
        <>
          <p>Vos coordonnées sont partiellement masquées sur cet écran.</p>
          <button className="lnk" onClick={A.rev}>
            {rev ? 'Masquer les coordonnées' : 'Afficher les coordonnées en clair'}
          </button>
        </>
      )}
      <div className="card">{kv(p.pf[S.t].map(mask))}</div>
      {S.t === 0 && (
        <small>
          Pour ajouter une coordonnée ou déclarer une adresse fiscale différente, contactez votre conseiller Castelval.
        </small>
      )}
    </>
  )
}

function param(x) {
  const { S, p, A } = x
  const h = hd(x, 'Paramètres')

  if (S.t === 0) {
    return (
      <>
        {h}
        <div className="set-grid">
          <div className="card set-panel">
            <h3>Ma sécurité</h3>
            {[
              ['Mon code de sécurité', () => A.open('appr3')],
              ['Mes téléphones de confiance', () => A.open('appr')],
              ['Modifier mon mot de passe', () => A.open('appr')],
              ['Mon historique de connexion', A.conn]
            ].map(([label, act]) => (
              <button className="set-row" key={label} onClick={act}>
                <span>{label}</span>
                <svg className="set-chev" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
          <div className="set-side">
            {[
              ['Patrimoine financier à agréger', 3],
              ['Mes paramètres de contact', 1],
              ['Alertes et évènements', 2]
            ].map(([label, t]) => (
              <button className="card set-tile" key={label} onClick={() => A.tab(t)}>
                <b>{label}</b>
                <svg className="set-chev" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }

  if (S.t === 1) {
    return (
      <>
        {h}
        <section className="card agg-panel">
          <div className="agg-sec pref-sec">
            {swRow('Me prévenir des messages sécurisés reçus', S.tog.g, v => A.tog('g', v))}
            {swRow('Notifications de l’application', S.tog.h, v => A.tog('h', v))}
          </div>
          <div className="pref-acts">
            <button className="btn cta" onClick={A.saveContact}>
              Enregistrer
            </button>
            <small>Préférences de démonstration. Aucune notification réelle n’est envoyée.</small>
          </div>
        </section>
        <button className="card-back" onClick={() => A.tab(0)}>
          ‹ Revenir aux paramètres
        </button>
      </>
    )
  }

  if (S.t === 2) {
    return (
      <>
        {h}
        <div className="card">
          {swRow('Alerte de mouvement important', S.tog.e, v => A.tog('e', v))}
          {swRow('Alerte d’opération par carte', S.tog.f, v => A.tog('f', v))}
        </div>
      </>
    )
  }

  const allP = P.map((q, i) => i)
  const allSi = ['Castelval', 'Hors Castelval']
  const same = (a, b) => a.length === b.length && a.every(v => b.includes(v))
  const radio = (name, label, note, checked, onChange) => (
    <label className="agg-opt" key={label}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span>
        {label}
        {note && <small>{note}</small>}
      </span>
    </label>
  )

  return (
    <>
      {h}
      <section className="card agg-panel">
        <div className="agg-sec">
          <h4>
            Établissements à agréger <small>(modifie à la fois la page d’accueil et mon patrimoine)</small>
          </h4>
          {radio('agg-est', 'Avec mon conseiller', '', !S.si.includes('Hors Castelval'), () =>
            A.agg('si', ['Castelval'])
          )}
          {radio('agg-est', 'Tous établissements', '', S.si.includes('Hors Castelval'), () => A.agg('si', allSi))}
        </div>
        <div className="agg-sec">
          <h4>
            Profils à agréger <small>(modifie à la fois la page d’accueil et mon patrimoine)</small>
          </h4>
          {radio('agg-prof', p.n, '', same(S.sp, [S.p]), () => A.agg('sp', [S.p]))}
          {radio('agg-prof', 'Tous profils', P.map(q => q.n).join(', '), same(S.sp, allP), () => A.agg('sp', allP))}
        </div>
        <div className="agg-sec">
          <h4>Affichage sur la page d’accueil</h4>
          {swRow('Afficher le total agrégé sur la page d’accueil', S.tog.a, v => A.tog('a', v))}
          {swRow('Masquer le total lorsqu’on arrive la première fois sur la page d’accueil', S.arr, v =>
            A.tog('b', v)
          )}
        </div>
      </section>
      <button className="card-back" onClick={() => A.tab(0)}>
        ‹ Revenir aux paramètres
      </button>
    </>
  )
}

function plafonds(x) {
  const { S, p, E, A } = x
  const c = p.card
  const family = S.r === 'plafond-retrait' ? 'withdrawal' : 'payment'
  const title = family === 'payment' ? 'Plafond de paiement' : 'Plafond de retrait'
  const lims = S.lims[S.p][family]
  const used = (c.ulims && c.ulims[family]) || [0, 0, 0]
  const periods = ['1 jour', '7 jours', '30 jours']

  return (
    <>
      {ptitle(title)}
      <div className="page-rule" />
      <button className="card-back" onClick={() => A.go('cartes', 2)}>
        ‹ Revenir à ma carte
      </button>
      <section className="card-panel">
        <h3>Carte Castelval {c.num || '•••• 1842'}</h3>
        {periods.map((period, i) => (
          <div className="lim-block" key={i}>
            <h4>
              {title} sur {period}
            </h4>
            <div className="lim-row">
              <div className="lim-data">
                <div className="lim-max">
                  <span>Montant maximal</span>
                  <b>{E(lims[i])}</b>
                </div>
                {bar(used[i], lims[i])}
                <div className="lim-cap">
                  <span>
                    Utilisé : {E(used[i])} · {lims[i] ? Math.round((used[i] / lims[i]) * 100) : 0} %
                  </span>
                  <span>Disponible : {E(Math.max(0, lims[i] - used[i]))}</span>
                </div>
              </div>
              <button className="prmbtn" onClick={() => A.plim(family, i)}>
                Modifier mon plafond
              </button>
            </div>
            {i < 2 && <div className="lim-sep" />}
          </div>
        ))}
      </section>
    </>
  )
}

function structures(x) {
  const { S, A } = x
  return (
    <>
      {hd(x, 'Changer de profil')}
      <p>Profils pour lesquels votre accès a été vérifié à la connexion.</p>
      <div className="grid">
        {P.map((q, i) => (
          <div className="card c6" key={i}>
            <h3>{q.n}</h3>
            <span className="tag">{q.t}</span>
            {i === S.p ? (
              <p>
                <b>Profil actif</b>
              </p>
            ) : (
              <p>
                <button className="btn cta" style={{ width: 'auto' }} onClick={() => A.sw(i)}>
                  Accéder
                </button>
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

const SUB_ICONS = {
  epargne: (
    <>
      <path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
    </>
  ),
  credit: <path d="M4 20V9l8-4 8 4v11M8 20v-7h8v7M3 20h18" />,
  assurance: (
    <>
      <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />
      <path d="M8.5 12l2.6 2.6 4.4-5" />
    </>
  ),
  carte: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M3 10h18" />
    </>
  )
}

function souscription(x) {
  const { A } = x
  const SECTIONS = [
    ['epargne', 'Épargne', ['Livret Castelval F', 'Livret Castelval B', 'DAT CFCA']],
    ['credit', 'Crédit', ['Crédit de trésorerie', 'Crédit de financement d’actif', 'Montage patrimonial']],
    ['assurance', 'Assurance', ['Assurance habitation', 'Assurance automobile']],
    ['carte', 'Carte et paiements', ['Ouvrir un nouveau compte', 'Souscrire une nouvelle carte', 'Monter en gamme']]
  ]
  return (
    <>
      <div className="top sc-head">
        <div>
          <h1>Votre espace de souscription</h1>
          <p className="sc-lead">Que souhaitez-vous souscrire ?</p>
        </div>
      </div>
      <div className="sc-grid">
        {SECTIONS.map(([ic, title, rows]) => (
          <section className="sc-panel" key={ic}>
            <h3>
              <svg className="sc-ic" viewBox="0 0 24 24" aria-hidden="true">
                {SUB_ICONS[ic]}
              </svg>
              {title}
            </h3>
            <ul className="sc-list">
              {rows.map(r => (
                <li key={r}>
                  <button onClick={A.sub}>
                    <span>{r}</span>
                    <svg className="sc-chev" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <small>Aperçu des rubriques de la démonstration. Aucune souscription ni demande de financement ne peut être réalisée ici.</small>
    </>
  )
}

const V = {
  home,
  patrimoine,
  comptes,
  cartes,
  virements,
  assurances,
  credits,
  documents,
  profil,
  param,
  plafonds,
  'plafond-paiement': plafonds,
  'plafond-retrait': plafonds,
  structures,
  souscription
}

export default function View({ x }) {
  const fn = V[x.S.r] || home
  return tr(fn(x), x.en)
}
