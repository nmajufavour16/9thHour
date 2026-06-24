# 9th Hour

> _"The hour of prayer is now."_

**9th Hour** is a production faith-community web platform for believers and
ministers, handling real payments and community at scale. It brings live prayer
sessions, a campus-fellowship feed, a daily devotional rhythm, and a hardened
in-app coin economy (tithes, offerings, giving, withdrawals) into a single PWA.

This is not a social-media clone. Feeds are strictly chronological, scripture is
curated by hand (no Bible API), and every naira that moves through the system is
guarded by an atomic financial ledger.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Roadmap](#roadmap)
- [Core Principles](#core-principles)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Surface](#api-surface)
- [Data Models](#data-models)
- [Background Jobs](#background-jobs)
- [Contributing & Conventions](#contributing--conventions)

---

## Architecture

9th Hour uses a **Backend-for-Frontend (BFF)** monorepo split. The browser never
talks to the API server directly — it calls a thin Next.js proxy that injects the
internal service key and forwards the request to the dedicated Node.js backend,
where all business logic and the financial engine live.

```
Browser
  │  Firebase ID token (Authorization: Bearer …)
  ▼
Next.js (apps/web)  ──►  /api/proxy/[...path]   ── injects INTERNAL_COMMUNICATION_KEY
  │
  ▼
Express API (apps/api)  ──►  MongoDB Atlas (Mongoose)
  │                       ├─►  Paystack / Flutterwave (payments)
  │                       ├─►  Agora RTC (live video tokens)
  │                       └─►  Firebase Admin (auth verify, FCM)
```

- **No business logic in Next.js** beyond the proxy. The API server is the single
  source of truth.
- **Webhooks bypass the proxy** and authenticate via provider signature instead of
  the internal key.

---

## Tech Stack

| Layer              | Technology                                             |
| ------------------ | ------------------------------------------------------ |
| Web                | Next.js 14 (App Router), TypeScript, Tailwind CSS      |
| API                | Node.js, Express, Mongoose, TypeScript                 |
| Database           | MongoDB Atlas                                          |
| Auth               | Firebase Authentication (client) + Firebase Admin SDK  |
| Live video         | Agora RTC                                              |
| Inbound payments   | Paystack                                               |
| Outbound utility   | Flutterwave (airtime/data)                             |
| Push notifications | Firebase Cloud Messaging                               |
| Email              | Resend                                                 |
| Real-time          | Socket.io _(in progress)_                              |
| Scheduled jobs     | node-cron (in-process on the API)                      |
| Hosting            | Vercel (web) · Railway (api)                           |

---

## Repository Layout

```
9thHour/
├─ apps/
│  ├─ web/                      Next.js 14 frontend (BFF proxy + UI)
│  │  └─ src/
│  │     ├─ app/               App Router pages & the /api/proxy route
│  │     ├─ components/        Shared UI (LiveSession, theme, legal, …)
│  │     ├─ hooks/             useAuth, …
│  │     └─ lib/               firebase client, apiFetch helper
│  └─ api/                      Express + Mongoose backend
│     └─ src/
│        ├─ config/            db, firebase, fcm, paystack, agora, seeds
│        ├─ middleware/        internal-key guard, Firebase auth guard
│        ├─ models/            Mongoose schemas (one file per collection)
│        ├─ routes/            HTTP route handlers per domain
│        ├─ services/          walletService (financial transaction logic)
│        ├─ cron/              scheduled jobs
│        ├─ utils/             fees, WAT date helpers
│        ├─ scripts/           one-off / test scripts (concurrency, indexes)
│        └─ index.ts           app entry — wiring, middleware, boot
└─ package.json                 npm workspaces root
```

---

## Roadmap

Feature areas are delivered and verified incrementally. Current status:

| Area                                                 | Status         |
| ---------------------------------------------------- | -------------- |
| Monorepo, infrastructure, BFF proxy                  | ✅ Shipped     |
| Authentication, User & Minister profiles             | ✅ Shipped     |
| Verification, reports, fellowships                   | ✅ Shipped     |
| Financial ledger (wallet, transactions, payments)    | ✅ Shipped     |
| Daily verse, quiz, prayer streak                     | ✅ Shipped     |
| Live sessions, Agora tokens, attendance              | ✅ Shipped     |
| Real-time (Socket.io), prayer dispatch, chat         | ⏳ In progress |
| Fellowship feeds, airtime/data, utility              | ⏳ Planned     |
| Email receipts, admin dashboard, hardening           | ⏳ Planned     |

---

## Core Principles

These are non-negotiable throughout the codebase:

- **Atomic financial integrity.** Every `Wallet`/`Transaction` write uses the
  guarded-update pattern (`findOneAndUpdate` with the balance condition in the same
  call as the `$inc`) inside `session.withTransaction()`. Never read-then-write.
- **Separate balances.** `Wallet.balance` (spendable) and
  `Wallet.pendingWithdrawalBalance` (minister earnings) are structurally distinct
  and never merged — only the latter is withdrawable.
- **One exchange rate.** Exactly one coin↔naira conversion exists, at
  `/wallet/purchase`, read from `ExchangeRateConfig`. Everywhere else 1 coin = ₦1.
- **Idempotent webhooks.** Every webhook checks `Transaction.externalRef` for an
  existing `completed` record before crediting — the replay guard.
- **Fees favor the platform.** Fees round with `Math.ceil()`; the invariant
  `amount === feeCharged + netAmount` holds on every transaction.
- **MongoDB only.** No Firestore, no second database.
- **No external Bible API.** Scripture is manually curated in the `DailyVerse`
  collection.
- **No Python** anywhere in the codebase.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A MongoDB Atlas connection string (or a local MongoDB instance)
- A Firebase project (Authentication enabled) for client auth and the Admin SDK

### Install

```bash
# from the repo root — installs both workspaces
npm install
```

### Configure environment

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Fill in the values (see [Environment Variables](#environment-variables)). Generate
the shared internal key with:

```bash
openssl rand -hex 32
```

Use the **same value** for `INTERNAL_COMMUNICATION_KEY` in both `.env` files.

### Run in development

```bash
npm run dev:api      # terminal 1 → http://localhost:4000
npm run dev:web      # terminal 2 → http://localhost:3000
```

The API logs warnings (not failures) for any unconfigured optional service
(Paystack, Agora, …), so you can run and develop locally before every credential
is in place.

---

## Environment Variables

### `apps/web/.env.local`

| Variable                            | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`      | Firebase web client config                |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`  | Firebase web client config                |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`   | Firebase web client config                |
| `NEXT_PUBLIC_AGORA_APP_ID`          | Agora app id (live video)                 |
| `PRIVATE_NODE_BACKEND_URL`          | API base URL (server-side only)           |
| `INTERNAL_COMMUNICATION_KEY`        | Shared BFF→API key (server-side only)     |

### `apps/api/.env`

| Variable                                                     | Purpose                              |
| ------------------------------------------------------------ | ------------------------------------ |
| `PORT`                                                       | API port (default 4000)              |
| `MONGODB_URI`                                                | MongoDB Atlas connection string      |
| `INTERNAL_COMMUNICATION_KEY`                                 | Shared BFF→API key                   |
| `FIREBASE_ADMIN_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Firebase Admin SDK credentials     |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_WEBHOOK_SECRET`            | Inbound payments + webhook verify    |
| `FLW_SECRET_KEY` / `FLW_SECRET_HASH`                         | Flutterwave airtime _(planned)_      |
| `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE`                     | Live session token signing           |
| `RESEND_API_KEY`                                             | Transactional email _(planned)_      |

> You don't need every credential to start. `MONGODB_URI`,
> `INTERNAL_COMMUNICATION_KEY`, and the Firebase values are enough to run the core
> app; payments, live video, and email keys are only required for those features.

---

## Scripts

### Root (npm workspaces)

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm install`     | Install all workspaces               |
| `npm run dev:web` | Start the Next.js dev server         |
| `npm run dev:api` | Start the Express dev server (tsx)   |

### `apps/api`

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Watch-mode dev server (tsx)       |
| `npm run build`  | Compile TypeScript to `dist/`     |
| `npm run start`  | Run the compiled server           |

Operational and verification scripts live in `apps/api/src/scripts/` and run via
`tsx`, e.g.:

```bash
cd apps/api
npx tsx src/scripts/syncIndexes.ts        # sync Mongoose indexes
npx tsx src/scripts/concurrencyTest.ts    # 20 concurrent /wallet/give — exactly 1 must succeed
npx tsx src/scripts/withdrawalTest.ts     # withdrawal flow incl. failure refund
npx tsx src/scripts/eligibilityTest.ts    # minister offering/withdrawal eligibility
```

### `apps/web`

| Command          | Description                  |
| ---------------- | --------------------------- |
| `npm run dev`    | Next.js dev server          |
| `npm run build`  | Production build            |
| `npm run start`  | Serve the production build  |
| `npm run lint`   | ESLint (next/core-web-vitals) |

---

## API Surface

All routes (except `/webhooks/*`) require the internal key from the BFF proxy, and
user-facing routes additionally require a valid Firebase ID token.

| Domain         | Representative endpoints                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| Auth           | `POST /auth/sync`                                                                     |
| Fellowships    | `POST /fellowships`, `POST /fellowships/:id/join`, `GET /fellowships/:id/members`     |
| Verification   | `POST /verification/submit`, `POST /admin/verification/:id/approve` \| `/reject`      |
| Reports        | `POST /reports`, admin review & complaint-ratio queue                                 |
| Wallet         | `POST /wallet/purchase/initialize`, `POST /wallet/give`, `POST /wallet/withdraw`      |
| Webhooks       | `POST /webhooks/paystack` _(signature-verified, idempotent)_                          |
| Daily verse    | `POST /admin/daily-verse`, `GET /daily-verse/today`                                   |
| Quiz           | `GET /quiz/today`, `POST /quiz/attempt`                                               |
| Streak         | `GET /streak/me`, `POST /streak/checkin`                                              |
| Live sessions  | `POST /sessions`, `POST /sessions/:id/start` \| `/end`, `GET /sessions/:id/missed`    |
| Attendance     | `POST /sessions/:id/attendance/join` \| `/leave`                                      |
| Agora          | `POST /agora/token` _(App Certificate never leaves the server)_                       |

---

## Data Models

Mongoose models live in `apps/api/src/models/`, one file per collection:

`User`, `MinisterProfile`, `VerificationRequest`, `Wallet`, `Transaction`,
`ExchangeRateConfig`, `LiveSession`, `Attendance`, `Fellowship`, `Report`,
`DailyVerse`, `DailyQuizAttempt`.

> V2-only collections (e.g. `Gift`, `Comment`, `Post`, `PrayerRequest`) are modeled
> ahead of time but only wired up once their features land.

---

## Background Jobs

Cron jobs run in-process on the API via `node-cron` (timezone `Africa/Lagos`),
registered in `apps/api/src/cron/`:

| Job                    | Schedule         | Action                                                  |
| ---------------------- | ---------------- | ------------------------------------------------------ |
| Daily verse broadcast  | 5:30 AM WAT      | Fetch today's `DailyVerse`, FCM broadcast to all users |
| Streak reset sweep     | Midnight WAT     | Reset `prayerStreak` for anyone who missed yesterday   |

> No penalty of any kind is applied on a missed streak — the streak simply resets.

---

## Contributing & Conventions

- **Comments are short and purposeful.** Explain the _why_ where it isn't obvious;
  don't restate what the code already says, and avoid banner comments.
- **No stubs in delivered code.** No `// TODO`, no `any` types, no placeholder
  functions — every file ships production-ready.
- **Verify before merging.** TypeScript and ESLint must be clean, and financial
  changes are validated with the concurrency/withdrawal scripts above.

> The detailed product, technical, and schema specifications are maintained
> privately and are not part of this repository.

---

_Private project. All rights reserved._
