# Hisaab

Offline-first Android money ledger built from `Hisaab_PRD.md`.

## Stack

- Expo SDK 51 + Expo Router
- TypeScript strict mode
- NativeWind v4, Reanimated, Moti
- Expo SQLite with a Drizzle schema definition
- Zustand state layer
- Expo Notifications, Contacts, Haptics
- Lucide React Native icons

## Implemented scope

- Four-tab shell: Ghar, Dost, Itihaas, Settings
- SQLite tables for friends, debts, and reminders
- Dashboard net balance, stats, search, filters, and FAB quick logging
- Add/edit debt flow with amount, note, direction, borrowed date, optional due date, and contact picker
- Friend detail with netting, timeline, swipe-to-settle, settle all, WhatsApp nudge, edit/delete/forgive actions
- Full history grouped by month
- Local due-date notifications and app badge update attempts
- Cinematic dark glass UI using the PRD amber accent and display/body typography

## Run

```bash
npm install
npm run start
```

Then open the app in Expo Go or an Android emulator.

## Validation

```bash
npm run typecheck
npx expo install --check
npx expo export --platform android --output-dir dist-test
```

`dist-test` is only a generated verification folder and does not need to be kept.
