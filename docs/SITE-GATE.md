# Site gate — password before the portal

When someone opens the portal URL, the browser first shows a small **"Sign in"** box (username + password). Only after the correct credentials are entered does the real site — starting with the portal's own login page — load.

This is the standard **HTTP Basic Auth** prompt (the same box used by many demo/staging sites).

---

## What a visitor sees

1. Opens `https://demo-cfcal.castelval.fr`.
2. The browser shows **Sign in** with *Username* and *Password*. Nothing of the site has loaded yet.
3. After the right credentials → the portal's normal login page opens, exactly as before.
4. **Cancel** or a wrong password → a plain "Authentication required" page. No portal content.
5. The browser remembers the credentials until the browser is closed, so the box does not reappear on every click.

---

## Credentials

| | Value |
|---|---|
| Username | `client_demo` (change with `SITE_USER`) |
| Password | set with `SITE_PASSWORD`. If not set, a random one is generated **once**, saved in `server/data/site-password.txt` and printed in the server console at startup. |

The password is **not** written in the source code or in git. For a demo you hand to clients, choose a memorable one and set it on the server:

```bash
SITE_PASSWORD='something-memorable-2026' npm start
```

| Variable | Meaning | Default |
|---|---|---|
| `SITE_GATE` | `off` disables the gate | on |
| `SITE_USER` | username | `client_demo` |
| `SITE_PASSWORD` | password | random, saved in `server/data/site-password.txt` |

The gate is on in both `npm run dev` and `npm start`. For local work you can switch it off with `SITE_GATE=off npm run dev`.

---

## Why it is done on the server (and not in React)

A password screen built in React is only decoration: the page's JavaScript is downloaded **before** the screen appears, so anyone can read it or skip the screen.

Here the check happens in `server/gate.js`, **before the server sends anything** — pages, scripts, styles, images and the API are all blocked until the credentials are correct.

---

## How it is connected

```
browser ──request──►  gate(req, res)  ──blocked?──► 401 + "WWW-Authenticate: Basic" → browser shows the Sign in box
                           │ allowed
                           ▼
                     handleApi(req, res)  ──►  /api/branding …
                           │ not an API call
                           ▼
                     the website (Vite in dev, dist/ in production)
```

- `server/gate.js` — the whole feature. `gate(req, res)` returns `true` when it has answered (blocked) and `false` to let the request continue.
- `server/vite-plugin.js` (dev) and `server/index.js` (production) call `gate()` **first**, before anything else.
- The browser, once the user has typed the credentials, attaches them automatically to every later request to the same site (pages, `fetch`, the studio's preview iframe).

### Details worth knowing
- Credentials are compared in **constant time** (both values are hashed first), so response timing reveals nothing.
- 20 wrong attempts from one address within a minute → `429 Too Many Requests` for the rest of that minute (even correct credentials are refused during it).
- Every blocked response has `Cache-Control: no-store`.
- The Brand studio keeps its **own** password and token. Its token travels in the `X-Studio-Token` header — not in `Authorization` — so it never clashes with the gate's Basic credentials.

---

## Limits and good practice

- **Use HTTPS.** Basic Auth sends the credentials with every request (base64, not encrypted). Over `https://` that is safe.
- **No real "log out"** — the browser keeps the credentials until it is closed. Share the password only with people who may see the demo.
- **The box is the browser's own** and cannot be restyled (logo, colours). If a branded login screen is needed later, the alternative is a server-checked login page that sets a secure cookie; it needs more code but can look like the portal.
- A single shared username/password — fine for a demo, not for individual accounts.
- Behind a reverse proxy (nginx, a load balancer) the server may see the proxy's address for every visitor, so the attempt limit is shared by all of them. If that matters, do the Basic Auth in the proxy instead (it is a two-line setting there) and set `SITE_GATE=off` here.

---

## Testing it

```bash
# no credentials → 401 and the "WWW-Authenticate" header
curl -i https://demo-cfcal.castelval.fr/

# right credentials → 200
curl -i -u client_demo:YOUR_PASSWORD https://demo-cfcal.castelval.fr/
```

| Case | Expected |
|---|---|
| No credentials | `401`, browser shows the Sign in box |
| Wrong username or password | `401` |
| Page, scripts, images or `/api/branding` without credentials | `401` |
| Correct credentials | `200`, portal login page |
| 20+ wrong attempts in a minute | `429` |
