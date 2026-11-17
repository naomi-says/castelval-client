# Castelval — Espace client (mobile)

Expo SDK 58 · React Native 0.88 · TypeScript · React Navigation (drawer ⊃ bottom tabs ⊃ stack).
Mobile counterpart of the website in `../` (which is left untouched). See **[FEATURE_PARITY.md](./FEATURE_PARITY.md)** for the
website → mobile mapping, what is tested and what is not.

> The website has no backend (see FEATURE_PARITY.md). The app runs on the same demo dataset and the same business rules.
> Demo login is pre-filled (`DEMO2026` / `demo1234`).

## Run

```bash
cd mobile
npm install
npx expo start          # scan with Expo Go (Android / iOS), or press a / i / w
```

Everything used is available in Expo Go (secure-store, local-authentication, print, sharing, image/document pickers, slider, date picker).

## Checks

```bash
npm run typecheck       # tsc --noEmit
npm test                # 14 unit tests for the business rules (tests/rules.test.ts)
npx expo-doctor
# UI smoke test on react-native-web (see header of tests/e2e/smoke.cjs for the one-off setup)
```

## Layout

```
App.tsx                 providers, fonts, splash gate
src/data/data.ts        the website's dataset (typed)
src/services/rules.ts   business rules & validation (pure, unit-tested)
src/services/auth.ts    session token (keystore) + inactivity timeout
src/services/exporter.ts  PDF generation + share sheet
src/state/portal.tsx    portal state & actions (persisted), auth.tsx  session context
src/navigation/         root stack, drawer, tabs, route types
src/screens/            one file per module (Accounts, Cards, Transfers, Wealth, Credits, Messages, Profile, Misc)
src/components/         UI kit (Txt, Card, Button, SelectField → bottom sheet, …), Icon, TrustedApproval
src/i18n/               FR→EN dictionary (website's, plus mobile-only strings)
tests/                  unit tests + e2e smoke script
```
