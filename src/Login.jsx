import { useState } from 'react'
import { LOGO } from './data'

export default function Login({ onLogin }) {
  const [id, setId] = useState('DEMO2026')
  const [pw, setPw] = useState('demo1234')

  return (
    <section id="login">
      <div className="lv">
        <img src={LOGO} alt="Castelval Finance" />
        <h1>CASTELVAL</h1>
        <p>FINANCE</p>
        <small>Votre patrimoine, suivi en toute transparence avec votre conseiller dédié.</small>
      </div>
      <div className="lf">
        <form
          onSubmit={e => {
            e.preventDefault()
            onLogin()
          }}
        >
          <h2>Votre espace client Castelval</h2>
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
