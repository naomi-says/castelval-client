import { useState } from 'react'
import { useBranding } from './branding'

export default function Login({ onLogin }) {
  const [id, setId] = useState('DEMO2026')
  const [pw, setPw] = useState('demo1234')
  const brand = useBranding()

  return (
    <section id="login">
      <div className="lv">
        {brand.showLogo && <img src={brand.logoSrc} alt={brand.name} />}
        {brand.showName && brand.name && <h1>{brand.name}</h1>}
        {brand.tagline && <p>{brand.tagline}</p>}
        <small>Votre patrimoine, suivi en toute transparence avec votre conseiller dédié.</small>
      </div>
      <div className="lf">
        <form
          onSubmit={e => {
            e.preventDefault()
            onLogin()
          }}
        >
          <h2>Votre espace client {brand.plainName}</h2>
          <span className="hint">Démonstration : cliquez sur « Suivant ».</span>

          <label htmlFor="id">Votre identifiant</label>
          <input id="id" value={id} onChange={e => setId(e.target.value)} autoComplete="username" />

          <label htmlFor="pw">Code secret</label>
          <input
            id="pw"
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoComplete="current-password"
          />

          <button className="btn" type="submit">Suivant</button>
        </form>
      </div>
    </section>
  )
}
