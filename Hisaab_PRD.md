# Hisaab — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Date:** May 2026  
**Platform:** Android (Expo / React Native)  
**Tagline:** *Hisaab barabar.*

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Target Users](#3-target-users)
4. [Tech Stack](#4-tech-stack)
5. [Core Features](#5-core-features)
6. [Suggested Additional Features](#6-suggested-additional-features)
7. [UI / UX Requirements](#7-ui--ux-requirements)
8. [Data Model](#8-data-model)
9. [Phased Roadmap](#9-phased-roadmap)
10. [Success Metrics](#10-success-metrics)
11. [Risks & Mitigations](#11-risks--mitigations)

---

## 1. Overview

### Problem Statement

You lend money to friends and forget about it. There is no lightweight, offline-first app that tracks informal loans between friends with reminders, history, and settlement flows — without requiring the other person to sign up.

### What is Hisaab

Hisaab is a personal, offline-first mobile app that helps you track money lent to and borrowed from friends. It replaces the mental overhead of remembering who owes what, surfaces overdue debts, and lets you nudge friends discreetly — all wrapped in a premium cinematic UI with glassmorphism aesthetics.

The name comes from the Hindi/Urdu word for "account" or "calculation" — commonly used in everyday Indian speech when settling dues between friends.

---

## 2. Goals & Non-Goals

### Goals

- Give users a clear, at-a-glance view of all outstanding debts
- Log a new debt in under 10 seconds
- Send contextual reminders without opening a chat app
- Work 100% offline — no account required to use core features
- Support both directions: money you lent and money you borrowed
- Provide a full settlement history per friend

### Non-Goals (v1.0)

- Real payment integration (UPI, GPay) — considered for v2
- Multi-currency support — INR only in v1
- Group splits (Splitwise-style) — out of scope
- Social features or requiring other users to have the app

---

## 3. Target Users

**Primary persona:** Indian college students and young professionals aged 18–28 who frequently lend small amounts (₹50–₹5000) to friends for food, travel, or daily expenses and lose track over time.

### Personas

**Ayush, 21, CS student**
Lends money at canteen, fests, outings. Forgets after 2 weeks. Feels awkward asking. Needs a zero-friction logger.

**Priya, 24, working professional**
Manages shared expenses in a friend group. Wants history and summaries, not full group accounting.

---

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 51 + Expo Router (file-based navigation) |
| Language | TypeScript (strict mode) |
| Styling | NativeWind v4 (Tailwind CSS for React Native) |
| Animations | React Native Reanimated 3 + Moti |
| Local DB | Expo SQLite (expo-sqlite) with Drizzle ORM |
| State Management | Zustand |
| Notifications | Expo Notifications (local, scheduled) |
| Contacts | Expo Contacts (optional, for name autocomplete) |
| Fast KV Storage | MMKV via expo-community-flipper |
| Icons | Lucide React Native |
| Haptics | Expo Haptics |

---

## 5. Core Features

### 5.1 Dashboard / Home

| Feature | Description | Priority | Phase |
|---|---|---|---|
| Total Owed Banner | Large amber number showing net amount owed to user across all active debts | P0 | 1 |
| Stats Row | 3 mini-cards: Active, Settled, Overdue counts with colored indicators | P0 | 1 |
| Debt List | Scrollable list of all active debts sorted by recency — friend avatar, amount, note, date, status | P0 | 1 |
| Search & Filter | Search by name; filter by status (baaki / overdue / chukta) | P1 | 1 |
| FAB | Floating action button to log new debt, amber glow, haptic on press | P0 | 1 |

### 5.2 Log Debt (Add Screen)

| Feature | Description | Priority | Phase |
|---|---|---|---|
| Friend Name | Text input with contact picker — autocomplete from device contacts | P0 | 1 |
| Amount | Numeric input with ₹ prefix, large display, amber text | P0 | 1 |
| Note | Short text field: what it was for (e.g. "Chai & snacks") | P0 | 1 |
| Date Borrowed | Date picker, defaults to today | P0 | 1 |
| Due Date | Optional toggle — set a due date and get a reminder | P1 | 1 |
| Direction Toggle | Segmented control: "Unhone lena hai" (they owe me) vs "Maine lena hai" (I owe them) | P0 | 1 |
| Log It CTA | Full-width amber button, validates required fields, haptic on submit | P0 | 1 |

### 5.3 Friend Detail Screen

| Feature | Description | Priority | Phase |
|---|---|---|---|
| Hero Card | Friend avatar, name, total owed, status badge at top | P0 | 1 |
| Transaction Timeline | All past debts with this friend — amount, note, date, status icon | P0 | 1 |
| Swipe to Settle | Swipe left on any transaction to mark as chukta (with confirmation) | P0 | 1 |
| Settle All | Ghost button to mark all pending debts with this friend as chukta | P1 | 1 |
| Remind Button | Bell icon — opens WhatsApp with pre-drafted nudge message | P1 | 2 |
| Edit / Delete | Long press on any transaction to edit or delete | P1 | 1 |

### 5.4 Notifications & Reminders

| Feature | Description | Priority | Phase |
|---|---|---|---|
| Due Date Alerts | Local push notification on due date and 1 day before | P0 | 1 |
| Overdue Badge | App icon badge count for number of overdue debts | P1 | 2 |
| Weekly Digest | Optional: Sunday morning summary of outstanding amounts | P2 | 2 |
| Nudge Screen | Dedicated tab listing all upcoming/overdue with quick-nudge action | P1 | 1 |

### 5.5 History

| Feature | Description | Priority | Phase |
|---|---|---|---|
| Full Log | All-time list of every transaction, settled and pending | P0 | 1 |
| Monthly Grouping | Transactions grouped by month with monthly total | P1 | 2 |
| Export | Export to CSV or PDF for record-keeping | P2 | 2 |

---

## 6. Suggested Additional Features

> These are beyond the core v1 scope but are strong candidates for v1.1 or v2.

### 6.1 WhatsApp Nudge Integration
When tapping "Remind", auto-open WhatsApp with a pre-filled message:
> *"Bhai, ₹[Amount] baaki hai — [Note], [Date] se. No rush, bas yaad dila raha tha 😅"*

Saves the awkward moment of composing it yourself.

### 6.2 Recurring Debt Templates
Save a template for common recurring debts. E.g. "Monthly Netflix split with Rohan, ₹199, every 1st". One tap to log it each month without re-entering details.

### 6.3 Debt Forgiveness Mode
A "Maaf kiya" option per transaction — marks a debt as forgiven rather than paid. Useful for small amounts where you decide not to chase. Tracked separately in history with a distinct icon.

### 6.4 Mutual Debt Netting
If Friend A owes you ₹500 and you owe Friend A ₹200, automatically show the net balance as ₹300. Reduces cognitive load and reflects the real state.

### 6.5 Debt Aging Indicator
A subtle visual on each card showing how long the debt has been pending — a faint progress bar or color shift from amber to red as time passes. Creates urgency without being aggressive.

### 6.6 Private Friend Reliability Score
A local-only metric per friend: average days to repay across all settled debts. Never shown to the friend. Displayed as a small stat on the friend detail screen to inform future decisions.

### 6.7 Android Homescreen Widget
A widget showing total owed to you and the top 2 overdue debts — glanceable without opening the app. Built via `react-native-android-widget`.

### 6.8 Photo Receipt Attachment
Attach a photo or screenshot to a debt entry as proof — useful for higher amounts. Stored locally, displayed as a thumbnail on the transaction card.

### 6.9 Optional Cloud Backup
Optional Google Drive backup of the local SQLite database. Off by default — backup is an opt-in power feature. Useful when switching devices. No account required for core usage.

### 6.10 Settlement Celebration
When marking a debt as chukta, trigger a confetti animation with a haptic burst and show: **"Hisaab saaf! 🎉"**

---

## 7. UI / UX Requirements

### Visual Design

- Dark cinematic theme with a fixed atmospheric background (forest / mountain mist)
- All cards use glassmorphism: `rgba(255,255,255,0.06)`, `backdrop-filter: blur(20px)`, 1px white border at 12% opacity, 20px border radius
- Accent: amber `#F5A320` — primary amounts, CTAs, active states, left-border status indicator
- Typography: Cormorant Garamond or Playfair Display for display; DM Sans for body and labels
- Status labels and colors:
  - Baaki (Pending) — amber `#F5A320`
  - Chukta (Settled) — green `#4ADE80`
  - Overdue — red `#FF5252`
  - Maaf kiya (Forgiven) — muted purple `#A78BFA`

### Interaction Design

- Log a new debt in under 3 taps from any screen
- Swipe-to-settle on individual transactions with spring animation + haptic confirmation
- All destructive actions require a confirmation bottom sheet
- Empty states use atmospheric illustrations with ambient glow
- All inputs show amber focus border on focus

### Navigation

Bottom tab bar with 4 tabs:
- **Ghar** (Home) — house icon
- **Dost** (Friends) — people icon
- **Itihaas** (History) — clock icon
- **Settings** — gear icon

Active tab: amber underline + filled icon. Inactive: muted grey.

### Accessibility

- Minimum touch target: 44x44dp on all interactive elements
- Amount text respects device font size settings
- All status indicators use both color AND icon (not color alone)
- TalkBack screen reader support on core flows

---

## 8. Data Model

### Table: `friends`

```sql
CREATE TABLE friends (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  initials    TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
```

### Table: `debts`

```sql
CREATE TABLE debts (
  id              TEXT PRIMARY KEY,
  friend_id       TEXT NOT NULL REFERENCES friends(id),
  amount          REAL NOT NULL,
  note            TEXT,
  direction       TEXT NOT NULL CHECK(direction IN ('lent', 'borrowed')),
  date_borrowed   INTEGER NOT NULL,
  due_date        INTEGER,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending', 'settled', 'overdue', 'forgiven')),
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
```

### Table: `reminders`

```sql
CREATE TABLE reminders (
  id            TEXT PRIMARY KEY,
  debt_id       TEXT NOT NULL REFERENCES debts(id),
  scheduled_at  INTEGER NOT NULL,
  sent          INTEGER NOT NULL DEFAULT 0,
  type          TEXT NOT NULL CHECK(type IN ('due_soon', 'overdue', 'weekly_digest'))
);
```

---

## 9. Phased Roadmap

| Phase | Scope | Priority |
|---|---|---|
| Phase 1 — Core | Dashboard, Add Debt, Friend Detail, History tab, Local Notifications, Swipe to Settle | P0 / P1 |
| Phase 1.1 — Polish | Search/Filter, Edit/Delete, Debt aging indicator, Mutual netting, WhatsApp nudge | P1 |
| Phase 2 — Delight | Homescreen widget, Photo attachments, Export CSV/PDF, Weekly digest, Settlement celebration | P2 |
| Phase 3 — Sync | Optional cloud backup, Cross-device sync, Recurring templates, Reliability score | P2 |

---

## 10. Success Metrics

- Time to log first debt: < 30 seconds from install
- Core logging flow: < 3 taps
- D7 retention: > 40%
- Settlement rate: % of logged debts eventually marked chukta or maaf kiya
- Reminder open rate: > 60%
- Crash-free session rate: > 99.5%

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Users forget to log at time of lending | Homescreen widget + FAB shortcut reduce friction; consider a quick-log notification shortcut |
| Contact picker permission denied | Fall back to manual name entry gracefully; contacts are optional |
| Data loss on uninstall | Warn user that data is local-only; surface export option early in onboarding |
| Notification permission denied (Android 13+) | Request at first meaningful moment (when user sets a due date), with clear explanation |
| Glassmorphism performance on low-end devices | Test blur on mid-range devices; add "Reduce visual effects" toggle in settings |

---

*Hisaab PRD v1.0 — May 2026*
