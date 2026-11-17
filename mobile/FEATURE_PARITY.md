# Castelval — Website → Mobile feature parity

Source of truth: the website in `../src` (`Login.jsx`, `Portal.jsx`, `views.jsx`, `ui.jsx`, `data.js`, `i18n.js`).
This file is both the **website-to-mobile mapping document** (phase 2) and the **parity tracker**.

## Read this first — what the website actually is

The website is a **static front-end demo**. It has **no backend, no HTTP calls, no authentication and no database**:

* `data.js` holds the whole dataset (two profiles: *M Jean Dupond* and *Holding Famille Dupond*);
* the login form accepts anything (pre-filled `DEMO2026` / `demo1234`);
* every "action" (transfer, new beneficiary, card block, messages…) only changes in-memory React state or shows a toast saying *"(démonstration)"*.

So there are **no APIs to connect to**. The mobile app is therefore a faithful port of the website's **data, state model and business rules** — not a re-implementation against an invented API:

| Website | Mobile |
|---|---|
| `data.js` | `src/data/data.ts` (verbatim, typed) |
| `Portal.jsx` state + actions (`A.*`) | `src/state/portal.tsx` (same state shape, same actions) |
| validation / computation inside `views.jsx` / `Portal.jsx` | `src/services/rules.ts` (pure functions, unit-tested) |
| `i18n.js` FR→EN dictionary | `src/i18n/dictionary.ts` (verbatim) + `src/i18n/extra.ts` (mobile-only strings) |
| login (no auth) | `src/services/auth.ts` — session token in the device keystore + inactivity timeout (the single seam to swap for a real identity provider) |

When a real API exists, only `portal.tsx` (reads/writes) and `auth.ts` need to change; screens do not.

## Legend

**Implementation** — ✅ implemented · 🔀 implemented, adapted for mobile · ➕ mobile-only addition · ⛔ intentionally not ported (web-only)
**API** — `n/a` = the website has no API for this (local data + rules, same as the website)
**Testing**
* **U** = covered by the unit tests (`npm test`, `tests/rules.test.ts`, 14 tests, passing)
* **W** = exercised end-to-end by the automated UI smoke test (`tests/e2e/smoke.cjs`: the real app on react-native-web, headless Chrome 390×844, 0 JS errors)
* **T** = type-checked only (`npm run typecheck`)
* **N** = depends on a native API (Alert, picker, biometrics, PDF/share sheet, slider, date picker) that the web smoke test cannot exercise → **not yet tested on a device**

Nothing marked **N** should be considered done until it has been tried on an Android and an iOS device/emulator.

---

## 1. Authentication & shell

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Login | `Login.jsx` | `Login` | identifier + code, pre-filled demo creds, "Suivant", EN/FR switch | n/a | ✅ | W |
| Session | — (none) | `state/auth.tsx`, `services/auth.ts` | opaque token in Keychain/Keystore, 30-min inactivity timeout, expired-session message on login | n/a | ➕ | T (timeout path not exercised) |
| Header | `.ah` | `TabHeader` (tabs) / native headers | menu, brand, show/hide amounts (eye), Messages with unread badge, profile menu (Mon profil / Changer de profil / Paramètres / Déconnexion) as a bottom sheet | n/a | 🔀 | W |
| Header | "Téléphone", "Rendez-vous" buttons | drawer entries | → Contact / Appointment screens | n/a | 🔀 | W |
| Sidebar | `#sb` | drawer (`DrawerContent`) + bottom tabs | all 8 nav items, expandable sub-sections for Comptes / Cartes / Virements, Messages/Téléphone/RDV, language switch, logout | n/a | 🔀 | W |
| Sidebar | collapse button, tooltips, hover | — | desktop-only | — | ⛔ | — |
| Footer | FAQ, Notre offre, Nous contacter, Mentions légales, Cookies, Accessibilité | `Settings` (bottom card) + drawer | → `InfoPage` / `Subscribe` / `Contact` | n/a | 🔀 | W |
| Language | FR/EN toggle (`tr()` walker) | drawer + login | same dictionary; `<Txt>` translates French source strings; dates/amounts follow locale | n/a | ✅ | W (home, points); dynamic strings with embedded values (e.g. card number sentences) stay French |
| Amount masking | `E()`, eye | `fmt.E`, eye in header | masks every balance; default hidden after login | n/a | ✅ | W |

## 2. Accueil

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Home | `home()` | `Home` (tab) | greeting, accounts list (tap → account), aggregated net worth with show/hide, scope text, points + cashback, "Souscrire" | n/a | ✅ | W, U (net worth formula) |

## 3. Mon patrimoine

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Wealth | "Mes avoirs" tab | `Wealth` (tab, segmented) | aggregated total, advisor / external frames per profile & category, scope link | n/a | ✅ | W, U |
| Wealth | "Patrimoine net total" tab | `Wealth` (segmented) | financial / real-estate / other / gross / loans / net, per profile | n/a | ✅ | W, U (matches website `W()` for 12 scope combinations) |
| Wealth | 'man' dialog (add / edit) | `ManualItem` (full screen) | profile, category, label, amount; validation; single-main-residence rule | n/a | 🔀 | W (add, edit), U (rules) |
| Wealth | "Supprimer" row action | `Wealth` + `ManualItem` (confirm alert) | delete declared item | n/a | ✅ | N (Alert) |
| Wealth | "Exporter le détail" (toast only) | `Wealth` | real PDF of the wealth detail → share sheet | n/a | ➕ | N |

## 4. Mes comptes

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Accounts | "Mes opérations" | `AccountsScreen` (tab) | account picker, balance, upcoming total, Virement / Gestion shortcuts, operations as cards | n/a | 🔀 | W |
| Accounts | operations table sort | `OpsList` | sort by date / label / amount, direction toggle, website default orders | n/a | 🔀 | W, U |
| Accounts | — | `OpsList` | free-text search in operations | n/a | ➕ | W, U |
| Accounts | row → `op` dialog / `loan` dialog | `OperationDetail` / `LoanDetail` | loan instalments open the loan, others open details | n/a | 🔀 | W, U |
| Accounts | "Gérer le compte" tab | `AccountManage` | picker, balance, Virement, Relevés, Télécharger, RIB, advanced mode, account details (+ savings / term-deposit characteristics) | n/a | 🔀 | W |
| Accounts | "Recherche et export" (Du / Jusqu'au) | `AccountManage` | date-range filter + real PDF export (website: toast) | n/a | ➕ | N (date picker, PDF) |
| Accounts | "Mes opérations à venir" | `AccountManage`, `Scheduled` | upcoming list incl. transfers created in-session | n/a | ✅ | W |
| Accounts | "Mes autres comptes" (→ profile dialog) | `ProfileSwitch` | procuration profiles | n/a | ✅ | W |

## 5. Mes cartes

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Cards | "Mes dépenses carte" | `CardsScreen` (tab) | card selector (all / Jean / Marie), 30-day level, bar, expenses list | n/a | ✅ | W |
| Cards | "Mes points et cashback" | `CardPoints` | points, gauge, cashback, how-to / convert / spend, insurance, assistance | n/a | ✅ | W |
| Cards | "Mes réglages de carte" | `CardSettings` | card art, status, activate, virtual card, Apple/Google Pay, block/unblock, limits, internet, contactless, code, view card, opposition | n/a | ✅ | W (screen) · N (activate / block / unblock confirm alerts) |
| Cards | "Mes blocages de carte" + `opp` dialog | `CardBlocks` + `CardInfo(opp)` | temporary-block switch, opposition (status becomes "En opposition"), history | n/a | ✅ | W |
| Cards | `plafond-paiement` / `plafond-retrait` pages | `CardLimit` | 3 periods, max, usage bar, available | n/a | ✅ | W |
| Cards | `plim` dialog | `CardLimitEdit` | slider + numeric field, 500 € steps, clamped per family | n/a | 🔀 | W (save path), U (clamping), N (slider drag) |
| Cards | internet / contactless dialogs | `CardInfo(internet / contactless)` | on/off with trusted-phone notice | n/a | 🔀 | W |
| Cards | virtual, mobile-pay, code, view-card, pts, cbx, spend, cassur, cassist dialogs | `CardInfo(kind)` | informational screens, same content | n/a | 🔀 | T |

## 6. Virements

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Transfers | 4 tabs | `TransfersHub` (tab) → screens below | | n/a | 🔀 | W |
| Transfers | "Nouveau virement" (5 steps) | `TfFrom` → `TfTo` → `TfAmount` → `TfReview` → `TfApproval` → `TfDone` | one screen per step; draft kept in the store; same validations (zero, balance, 5 000 € cap, beneficiary cap); reference; new pending entry in scheduled list | n/a | 🔀 | W, U |
| Transfers | `appr` dialog ("J'ai validé (simulation)") | `TrustedApproval` | device biometrics / passcode where available, otherwise the website's simulated confirmation | n/a | 🔀 | W (simulated path) · N (biometrics) |
| Transfers | "Mes bénéficiaires" + `bd` dialog | `Beneficiaries`, `BeneficiaryDetail` | list, detail, status tag | n/a | 🔀 | W |
| Transfers | add-beneficiary form | `AddBeneficiary` | holder, usual name, IBAN regex, BIC; "En attente de vérification" | n/a | 🔀 | W, U |
| Transfers | "Plafonds de virement" + `lim` dialog | `TransferLimits`, `LimitInfo` | 1 / 7 / 30-day caps with usage | n/a | ✅ | W |
| Transfers | "Virements programmés et prélèvements" + `upm` dialog | `Scheduled`, `ManageUpcoming` | list, send "manage" request | n/a | 🔀 | W (list) · T (request screen) |

## 7. Crédits, assurances, relevés, documents

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Loans | "Mes crédits" | `Credits` | total outstanding, per-loan rows | n/a | ✅ | W |
| Loans | `loan` dialog | `LoanDetail` | header, repayment, characteristics, 6-row amortisation preview, "gérer le prélèvement" | n/a | 🔀 | W, U (amortisation maths) |
| Loans | "Télécharger le tableau d'amortissement" (toast) | `LoanDetail` | real full-term PDF | n/a | ➕ | N |
| Insurance | "Mes assurances" dialog | `Insurance` | empty state + "Parler à mon conseiller" → appointment | n/a | 🔀 | T |
| Statements | "Mes relevés de compte" page + `d-stm` | `Statements` | account filter, list, "Consulter", "Télécharger le PDF", "Imprimer un relevé à aujourd'hui" — real PDFs (website: toasts) | n/a | 🔀 | W (screen) · N (PDF) |
| Documents | `d-other`, `rib` | `OtherDocuments`, `Rib` | RIB details, share IBAN, PDF | n/a | 🔀 | W (Rib) · N |
| Documents | `d-send`, `d-sign` | `DocsToSend`, `DocsToSign` | empty states | n/a | ✅ | T |

## 8. Profil, paramètres, profils

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Profile | 6 tabs | `Profile` (segmented) | contact / identity / family / professional / declared wealth / investor profile | n/a | ✅ | W, U (masking) |
| Profile | reveal / mask contact data | `Profile` | same masking rules | n/a | ✅ | W, U |
| Profile | avatar upload (`<input type=file>`) | `Profile` | image library picker (square crop) | n/a | 🔀 | N |
| Profile | `conn` dialog | `ConnectionHistory` | history + the current mobile session | n/a | 🔀 | W |
| Switch profile | `profile` dialog / `structures` | `ProfileSwitch` | switch Jean ⇄ Holding, returns to Home | n/a | 🔀 | W |
| Settings | "Ma sécurité" (4 rows) | `Settings`, `Approval`, `ConnectionHistory` | code / trusted phones / password need approval; history | n/a | 🔀 | W (password path, simulated) · N (biometrics) |
| Settings | "Mes paramètres de contact" | `SettingsContact` | 2 switches + save | n/a | ✅ | W |
| Settings | "Alertes et évènements" | `SettingsAlerts` | 2 switches | n/a | ✅ | W |
| Settings | "Patrimoine financier à agréger" | `SettingsAggregation` | institutions, profiles, home-page display switches (drive Home & Wealth) | n/a | ✅ | W, U |

## 9. Messagerie, contact, rendez-vous, souscription

| Website module | Website screen | Mobile screen | Functionality | API | Impl. | Testing |
|---|---|---|---|---|---|---|
| Messages | `msg` dialog (list) | `Messages` | Reçu / Envoyé / Brouillon, search, unread badge, empty states | n/a | 🔀 | W, U |
| Messages | read view | `MessageRead` | date / from / subject / body, reply | n/a | 🔀 | W |
| Messages | compose view | `MessageCompose` | subject picker, body, send / save draft with the website's validation messages; draft survives navigation and restarts | n/a | 🔀 | W (validation, draft), U |
| Messages | "Joindre un document" (fake `Relevé_octobre_2026.pdf`) | `MessageCompose` | real document picker | n/a | ➕ | N |
| Messages | — | `MessageRead` | continue / delete a draft | n/a | ➕ | T |
| Phone | `tel` dialog | `Contact` | both contact cards; **Appeler** really dials; video call = "not supported" like the website | n/a | 🔀 | W · N (dial) |
| Appointment | `rdv` dialog | `Appointment` | subject picker + confirm | n/a | 🔀 | W |
| Subscription | `souscription` | `Subscribe` | 4 sections, request toast | n/a | ✅ | W |
| Info | faq / legal / cookies / a11y dialogs | `InfoPage` | texts adapted to the app (secure store, screen readers) | n/a | 🔀 | W (FAQ) |

---

## Deliberate differences from the website

* **Modals → screens.** Every website dialog is a stack screen; only short confirmations use `Alert` (activate card, block / unblock, delete) and only small selections use bottom sheets (pickers, profile menu).
* **Card state is per profile** (website keeps one shared `cs` object across both profiles).
* **Website bug not ported:** in Settings → security, the website's "J'ai validé (simulation)" button runs the *transfer* approval and would push a bogus `Virement — sans motif / NaN` into the upcoming list. The mobile approval screens do not.
* **Fresh state on every login** (as the website remounts `Portal`), but drafts persist while a session is active; language is a device preference.
* Messages "unread" is tracked (website shows a static "1").
* Wealth "Mes avoirs" also lists manually-declared financial items under *other institutions* (the website counts them in the total but does not list them there).
* The website's desktop-only affordances (sidebar collapse, tooltips, table scroll-edge buttons, Esc handling) are not ported.
* Navigation library is React Navigation (stack + bottom tabs + drawer) rather than Expo Router, because the structure requested (drawer ⊃ tabs ⊃ many stack screens) maps directly onto it.

## Not done / open items

* **Device testing** of everything marked **N** (Android + iOS).
* **No backend exists**, so there is no API integration, token refresh or server-side session expiry to test; see the seam described above.
* Dynamic sentences that interpolate values (e.g. *"Activez votre carte Castelval •••• 1842 …"*) are not in the EN dictionary and stay French.
* No push notifications (the website's "Notifications de l'application" switch is a preference only, as on the website).
