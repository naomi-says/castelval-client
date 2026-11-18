# Branding Admin — how it works

A hidden admin page (`/admin/branding`) that lets an administrator change the portal's **logo, name and colours** without touching code. The change is saved on a small backend, so **every visitor** sees it.

This document explains what was built, how the pieces are connected, and how to extend it.

---

## 1. Why this exists (the problem)

Before this feature the logo, the name "CASTELVAL" and every colour (for example `#0f2a4d`) were written directly into the source code. Changing them meant a developer editing code and redeploying.

To let a non-developer change them we needed three things:

1. **Colours and logo that can change while the app is running** → CSS variables + a small JS store.
2. **A place to save the choice, shared by every visitor** → a tiny backend (this is why a backend is required; `localStorage` would only work in one browser).
3. **A page to edit it, hidden from normal users and protected by a password** → the *Brand studio*.

---

## 2. Big picture

```
 ADMIN                                                         VISITOR
 /admin/branding                                               /  (portal)
      │                                                            │
      │ Publish                                                    │ page load
      ▼                                                            ▼
 POST /api/branding/login  → token                      GET /api/branding
 PUT  /api/branding        ─┐                                      │
 POST /api/branding/logo   ─┼──►  server/api.js  ◄────────────────┘
 DELETE /api/branding/logo ─┘        │  reads / writes
                                     ▼
                        server/data/branding.json
                        server/data/logo.(png|jpg|svg…)
                                     │
        JSON comes back to the browser
                                     ▼
              src/branding.js  setBranding(json)
                                     │
                          applyBranding() → CSS variables on <html>
                                     │
              src/styles.css reads var(--th-…)  →  the page recolours
              components read name/logo through useBranding()
```

---

## 3. File map

| File | Role |
|---|---|
| `server/api.js` | **The backend.** One function, `handleApi(req, res)`, handles every `/api/branding…` request. Zero dependencies (Node built-ins only). |
| `server/vite-plugin.js` | Mounts `handleApi` inside the Vite dev/preview server, so `npm run dev` runs site + API together. |
| `server/index.js` | Production server: serves `dist/` **and** the API from one process (`npm start`). |
| `vite.config.js` | Registers the plugin: `plugins: [react(), brandingApi()]`. |
| `server/data/` | Created at runtime (git-ignored): `branding.json`, the logo file, `admin-password.txt`, `secret.key`. |
| `src/branding.js` | **Frontend core.** Defaults, presets, colour maths, the live store, `useBranding()`, `applyBranding()`, `initBranding()`. |
| `src/main.jsx` | Calls `initBranding()` before React renders. |
| `src/styles.css` | Hard-coded colours were replaced by `var(--th-…)`; defaults live at the top in `:root`. |
| `src/App.jsx` | Routing: `/admin/branding` → `BrandStudio` (lazy-loaded); `?preview=…` support for the preview iframe. |
| `src/BrandStudio.jsx` + `.css` | **The admin page**: sign-in, logo, name, themes, colours, live preview, Publish. |
| `src/Portal.jsx`, `Login.jsx`, `views.jsx` | Read name/logo via `useBranding()` / `getBranding()`. |

---

## 4. The settings (data model)

Stored in `server/data/branding.json` and returned by `GET /api/branding`:

```json
{
  "name": "CASTELVAL",
  "tagline": "FINANCE",
  "showLogo": true,
  "showName": true,
  "logoScale": 1,
  "logoTone": "auto",
  "preset": "castelval",
  "colors": {
    "header": null, "button": null, "background": null,
    "light": null, "highlight": null, "title": null
  },
  "logoUrl": null
}
```

- A colour of `null` means **"use the original default"**. Only customised colours are applied.
- `logoScale`: 0.4 – 2.5 (the zoom, shown as 40% – 250%).
- `logoTone`: `"auto"` = single colour matching the header, `"original"` = keep the logo's own colours.
- `logoUrl`: `null` = the bundled Castelval logo; otherwise `/api/branding/logo?v=<version>`.
  (The server also keeps `logoFile` / `logoVersion` internally; they are not sent to the client as such.)

---

## 5. Backend — `server/api.js`

### 5.1 The one entry point

```js
export async function handleApi(req, res) // returns true if it handled the request, false otherwise
```

It checks the URL. If it starts with `/api/branding` it handles it and returns `true`; otherwise `false`, and the normal website serves the request.

### 5.2 Where it is plugged in

```js
// dev — server/vite-plugin.js
server.middlewares.use((req, res, next) => {
  handleApi(req, res).then(done => done || next(), next)
})

// production — server/index.js
http.createServer(async (req, res) => {
  if (await handleApi(req, res)) return
  // …otherwise serve files from dist/ (with SPA fallback to index.html)
})
```

### 5.3 Endpoints

| Method & path | Who | What it does |
|---|---|---|
| `GET /api/branding` | public | Returns the current settings. |
| `POST /api/branding/login` | public | Body `{ "password": "…" }` → `{ "token": "…" }`. |
| `PUT /api/branding` | admin | Replaces the settings (after validation). |
| `POST /api/branding/logo` | admin | Body = the raw image file. Replaces the logo. |
| `DELETE /api/branding/logo` | admin | Removes the custom logo (back to the bundled one). |
| `GET /api/branding/logo` | public | Serves the logo file. |

### 5.4 Calling it (examples)

```bash
# 1. log in → token
curl -X POST http://localhost:5173/api/branding/login -d '{"password":"YOUR_PASSWORD"}'

# 2. read (no token)
curl http://localhost:5173/api/branding

# 3. save (token required)
curl -X PUT http://localhost:5173/api/branding \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"name":"Acme","colors":{"header":"#0b4f6c"}}'

# 4. upload a logo (the file itself is the body)
curl -X POST http://localhost:5173/api/branding/logo \
  -H "Authorization: Bearer <token>" -H "Content-Type: image/png" --data-binary @logo.png
```

### 5.5 Security (what protects it)

- **Password**: from the `BRAND_ADMIN_PASSWORD` env variable. If not set, a random one is generated once, saved in `server/data/admin-password.txt` and printed in the server console. Compared with `crypto.timingSafeEqual`.
- **Token**: `expiry.signature`, signed with HMAC-SHA256 using `server/data/secret.key`. Valid 8 hours. Sent as `Authorization: Bearer <token>`.
- **Brute-force guard**: 5 wrong passwords from one IP → locked for 60 seconds (HTTP 429).
- **Input is never trusted** — `sanitize()` validates everything on every save: colours must match `#rrggbb` (otherwise `null`), zoom is clamped, text has control characters and `<>` stripped and is length-limited, unknown fields are dropped.
- **Uploads**: max 2 MB. `sniff()` reads the file's **first bytes** to find the real type (a `.png` that is really HTML is rejected). SVGs containing `<script>`, `on…=` handlers, `javascript:`, `<foreignObject>` etc. are rejected. The logo is served with `X-Content-Type-Options: nosniff` and a restrictive `Content-Security-Policy`.
- **Writes are atomic**: written to a temp file and renamed, so a crash cannot leave a half-written JSON.

### 5.6 Configuration

| Variable | Meaning | Default |
|---|---|---|
| `BRAND_ADMIN_PASSWORD` | Studio password | random, saved in `server/data/admin-password.txt` |
| `BRAND_DATA_DIR` | Where data is stored | `server/data` |
| `PORT` | Production server port (`npm start`) | `3000` |

---

## 6. Frontend — how the portal applies the branding

### 6.1 CSS variables (the key idea)

In `src/styles.css`, hard-coded colours became variables, e.g.

```css
.ah { background: var(--th-hdr); }
```

The **defaults equal the original look** and sit at the top of the file:

```css
:root { --th-hdr:#0f2a4d; --th-btn:#0f2a4d; --th-bg:#fff; /* … */ }
```

When a colour is customised, JavaScript sets the same variable on `<html>` (an inline value beats the stylesheet). The whole page recolours instantly, no reload, no rebuild. With nothing customised, the portal looks exactly like before.

### 6.2 Which setting drives which variables

| Setting | CSS variables set | Used for |
|---|---|---|
| `header` | `--th-hdr`, `--th-hdr-ink`, `--th-hdr-dim`, `--th-hdr-dim2`, `--th-hdr-hover` | Top bar, login left panel. `*-ink` = auto black/white text. |
| `button` | `--th-btn`, `--th-btn-hover`, `--th-btn-deep`, `--th-btn-ink`, `--accent` | Buttons, active menu item, selected options, progress bars. |
| `background` | `--th-bg`, `--th-lf` | Page background and the login form side. |
| `light` | `--th-soft`, `--th-tint`, `--th-line0`, `--th-line`, `--th-line2` | Hover/selected rows, soft panels, borders (derived from the light colour). |
| `highlight` | `--gold` | Underlines and small accents. |
| `title` | `--th-title`, `--th-deep` | Headings, links, icons. |
| `logoScale` | `--th-logo-scale` | Multiplies the logo width. |
| `logoTone` (+ header) | `--th-logo-filter` | `none` (original colours) or white/black single colour. |

`computeVars()` derives the related shades automatically (hover = darker, ink = whichever of black/white has better contrast).

### 6.3 The store — `src/branding.js`

| Function | What it does |
|---|---|
| `computeVars(settings)` | Settings → `{ '--th-hdr': '#…', … }` (only customised ones). |
| `applyBranding(settings)` | Writes those variables on `<html>`, removes the others, updates the tab title and favicon. |
| `setBranding(settings, {persist})` | Updates the store → `applyBranding()` → saves a cache in `localStorage` → notifies listeners. |
| `useBranding()` | React hook (`useSyncExternalStore`). Components re-render when the branding changes. Returns the settings plus `logoSrc` (custom logo or bundled one). |
| `getBranding()` | Non-reactive read (used in `views.jsx`, which has plain functions, not components). |
| `fetchBranding()` | `GET /api/branding`. |
| `initBranding()` | Startup routine (below). |
| `validate()` | Checks colours (light fields must be light, contrast warning) — used by the studio. |

### 6.4 What runs when a visitor opens the portal

1. `src/main.jsx` calls **`initBranding()`** before React renders.
2. `initBranding()` applies the **cached copy** from `localStorage` immediately → no flash of the old look.
3. It calls **`fetchBranding()`** (`GET /api/branding`).
4. The result goes to **`setBranding(data)`** → `applyBranding()` writes the CSS variables → the page recolours.
5. Components show the name and logo through the hook:

```jsx
const brand = useBranding()
{brand.showLogo && <img src={brand.logoSrc} alt="" />}
{brand.showName && <span>{brand.name}</span>}
```

If the backend is unreachable, the portal silently keeps the cached copy or the defaults.

---

## 7. The Brand studio — `/admin/branding`

### 7.1 Routing
`src/App.jsx` checks the URL. If it is `/admin/branding` (or `#/admin/branding`) it renders `BrandStudio`. It is loaded with `React.lazy`, so normal visitors never download it. The route is defined by `STUDIO_PATH` in `branding.js`. The page also adds `noindex` so search engines skip it.

> A hidden URL is **not** the security — the password and token are. The URL is just not linked anywhere.

### 7.2 Sign-in
The studio's own `api()` helper calls `POST /api/branding/login`, keeps the token in `sessionStorage` (cleared when the tab closes) and sends it as `Authorization: Bearer …` on every write. A `401` sends the admin back to the sign-in form.

### 7.3 Draft vs saved
The studio keeps two copies of the settings:

- **`saved`** — what the server has.
- **`draft`** — what is being edited.

Nothing reaches visitors until **Publish**. The bottom bar shows "Unpublished changes" and offers **Discard** (draft = saved) and **Publish**. Leaving the page with unpublished changes triggers a browser warning.

### 7.4 What the user can edit

- **Logo** — upload (click or drag & drop; PNG, JPG, WEBP, GIF, SVG; 2 MB max), replace, delete (restores the Castelval logo), zoom 40–250 %, show/hide, original colours vs single colour.
- **Name** — name beside the logo, login tagline, show/hide.
- **Themes** — 8 ready-made colour sets; any single colour can then be fine-tuned.
- **Colours** — header, button, background, light, highlight, title/link. Each has swatches, a colour picker and a hex field. *Background* and *Light* only accept light colours (so text stays readable).

### 7.5 Publish — the exact order

```
1. logo changed?   POST /api/branding/logo   (or DELETE if it was removed)
2. settings        PUT  /api/branding
3. setBranding(result)   → this tab's portal + cache update immediately
```

A chosen logo is kept in the browser (a temporary `blob:` URL for preview) and is **only uploaded on Publish**.

---

## 8. The live preview

The preview is the **real portal inside an `<iframe>`** (`/?preview=portal` or `/?preview=login`), not a copy of it, so it can never look different from what visitors will get.

On every edit the studio sends the draft into the iframe:

```js
frame.contentWindow.postMessage(
  { type: 'cv-preview', branding: draft },
  location.origin
)
```

Inside the iframe, `initBranding()` detects that it is a preview frame (`isPreviewFrame()`), listens for the message and calls `setBranding(draft, { persist: false })`.

- `persist: false` → the preview never overwrites the real saved cache.
- Both sides check `event.origin === location.origin`, so only the same site can send these messages.
- The iframe is rendered at 1280 px (desktop) or 390 px (mobile) wide and shrunk with CSS `transform: scale()` to fit.
- `?preview=portal` makes `App.jsx` skip the login screen inside the iframe.

---

## 9. End-to-end example

*An admin picks the "Emerald" theme and clicks Publish.*

1. Clicking the preset updates `draft.colors` in the studio.
2. React re-renders → the draft is `postMessage`d to the iframe → the preview recolours instantly.
3. **Publish** → `PUT /api/branding`. `sanitize()` validates, `save()` writes `branding.json`.
4. The next visitor loads the portal → `initBranding()` → `GET /api/branding` → `setBranding()` → `computeVars()` → CSS variables set on `<html>` → `styles.css` reads them → the page is emerald.

---

## 10. Running it

```bash
npm run dev          # site + API together. The console prints the studio URL and password.
npm run build        # production build into dist/
npm start            # production: serves dist/ + the API from one process (PORT=3000)
```

- After pulling this feature, **restart** any running `npm run dev` (the API is loaded through `vite.config.js`).
- In production the `server/data/` folder **must persist** between deployments (and be backed up) — it holds the saved branding and the logo.
- A static-only host (no Node process) cannot save settings; the portal would simply show the defaults.

---

## 11. How to extend it

| I want to… | Change |
|---|---|
| Add a new API endpoint | `server/api.js`, inside `handleApi`. |
| Add a new colour option | 1) `DEFAULT_COLORS`, `COLOR_FIELDS`, `SWATCHES`, `computeVars` (and `VAR_NAMES`) in `src/branding.js` · 2) use `var(--th-…)` plus its default in `:root` in `src/styles.css` · 3) add the key to `colors` in `server/api.js` (`DEFAULTS`). |
| Add a new preset theme | Add an entry to `PRESETS` in `src/branding.js`. |
| Add another editable text/setting | Add it to `DEFAULT_BRANDING` (`branding.js`), `DEFAULTS` + `sanitize()` (`server/api.js`), a field in `BrandStudio.jsx`, and read it with `useBranding()`. |
| Change the hidden URL | `STUDIO_PATH` in `src/branding.js`. |
| Change the session length | `TOKEN_TTL` in `server/api.js`. |
| Change the logo size limit | `MAX_LOGO` in `server/api.js` (and `MAX_LOGO` in `BrandStudio.jsx`). |

---

## 12. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/api/branding` returns the HTML page | The dev server was started before the plugin existed — restart `npm run dev`. |
| Forgot the studio password | Read `server/data/admin-password.txt`, or set `BRAND_ADMIN_PASSWORD` and restart. |
| "Too many attempts" (429) | Wait 60 seconds. |
| "Cannot reach the server" in the studio | The backend is not running (static host, or `npm start` not launched). |
| Logo upload rejected | Must be PNG/JPG/WEBP/GIF/SVG, ≤ 2 MB, and SVG must contain no scripts. |
| A colour was refused | *Background* and *Light* must be light colours (the message explains). |
| Change published but an old look appears | Hard-refresh once; the browser may show its cached copy until the fresh one loads. |

---

## 13. Known limits

- Some body texts still say "Castelval" (for example the small "VOTRE ESPACE CASTELVAL" labels and "Points Castelval"). They are content, not branding, and are not changed by the studio.
- The `mobile/` app is a separate project and is not connected to this.
- There is a single shared admin password (no per-user accounts) and the storage is a JSON file — fine for one portal, not meant for many simultaneous server instances.

---

## 14. Glossary

- **CSS variable (custom property)** — a value like `--th-hdr` defined once and reused with `var(--th-hdr)`; change it and every use changes.
- **Store** — one shared object holding the current branding, with a way for components to subscribe to changes.
- **Token** — a signed string proving the admin logged in; sent with each write request.
- **HMAC** — a keyed hash; the server uses it to sign tokens so they cannot be forged without the secret.
- **Sanitize** — clean and validate input before trusting it.
- **Middleware** — a function that sees every request and either handles it or passes it on (`next()`).
- **`postMessage`** — the browser's safe way for two windows (here, the studio and the preview iframe) to send data to each other.
- **SPA fallback** — serving `index.html` for any URL so the React app can read the path itself.
