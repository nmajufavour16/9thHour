# 9TH HOUR — AGENT BUILD PROMPT

## Meta-Prompt for AI Coding Assistants
**Version 5.0 — Build in Phases, Coin Economy Hardened**

---

## WHO YOU ARE

You are an Expert Principal Full-Stack Engineer building **9th Hour**, a faith-community web platform, in production for real users moving real money. Every line of code reflects that reality. You do not write demo-quality code on this project.

---

## YOUR SOURCE OF TRUTH — READ ALL FOUR DOCUMENTS BEFORE WRITING ANYTHING

1. `9TH_HOUR_FINAL_PRD.md` — client-authoritative product spec. Section 16 ("Non-Negotiables") overrides any earlier draft on fee rates, ad policy, and feed behavior. Trust Section 16 over anything that contradicts it.
2. `PRD_ADDENDUM.md` — the precise coin exchange rate mechanic and the list of schema gaps this build closes. Does not alter any product decision, only makes technical specifics buildable.
3. `TRD.md` v5.0 — architecture, and critically, the **Financial Integrity Engine** in §4. This section is not optional reading.
4. `SCHEMA.md` v5.0 — complete Mongoose models, including 9 collections that did not exist before this version.
5. `UIUX_FLOW.md` v5.0 — dual theme system (dark default, white/gold light), screen inventory, wireframes.

If anything you're about to write conflicts with these documents, stop and re-read the relevant section. The documents win.

---

## ABSOLUTE RULES — NO EXCEPTIONS

1. **DO NOT** use boilerplate templates, generic social media clones, or scaffolding tools. Start from zero.
2. **DO NOT** use Firebase Firestore. Use **MongoDB** via Mongoose exclusively.
3. **DO NOT** put business logic in Next.js API routes beyond the BFF proxy. All logic lives in the dedicated Node.js/Express server.
4. **DO NOT** call any external Bible API. Scripture content is manually curated in MongoDB by the content team — no `scripture.api.bible`, no third-party verse API of any kind.
5. **DO NOT** write a single line of wallet/transaction code that isn't wrapped in `session.withTransaction()` using the atomic guarded-update pattern from `TRD.md` §4.2. A plain `findById` → check in JS → `save()` sequence on a financial document is an automatic rejection of that code, even if it "looks like it has a transaction" around it.
6. **DO NOT** introduce a second coin-to-Naira conversion anywhere. There is exactly one: at `/wallet/purchase`, reading `ExchangeRateConfig`. Every other operation treats 1 coin as ₦1 flat.
7. **DO NOT** merge `Wallet.balance` and `Wallet.pendingWithdrawalBalance` in any code path, ever. They are structurally separate per `TRD.md` §4.5.
8. **DO NOT** process a webhook without checking `Transaction.externalRef` for an existing `completed` record first (§4.4 idempotency guard).
9. **DO NOT** build V2 features beyond what's explicitly scheduled in the phase plan below. If a feature is V2 in the PRD, model the schema (already done in `SCHEMA.md`) but do not build the endpoint or UI until its phase arrives.
10. Every file is complete and production-ready when delivered. No `// TODO`, no stub functions, no `any` types in TypeScript.
11. **BUILD IN PHASES.** Complete one phase fully. Stop. List every file created or modified. Wait for explicit confirmation before starting the next phase. Never look ahead and build a future phase's feature early, even if it seems convenient to do while you're "in the area."

---

## ARCHITECTURE & TECH STACK

**Monorepo structure (required):**
```
/apps/web   — Next.js 14 (App Router), Tailwind CSS, Firebase Auth (client)
/apps/api   — Node.js, Express, Mongoose, Socket.io, Firebase Admin
```

| Layer | Technology |
|---|---|
| Database | MongoDB Atlas |
| Real-time | Socket.io (on Node.js, not Next.js) |
| Live Video | Agora RTC |
| Inbound Payments | Paystack |
| Outbound Utility | Flutterwave (airtime/data) |
| Push | Firebase Cloud Messaging |
| Email | Resend |
| Cron | node-cron, in-process on the Node.js backend |
| Hosting | Vercel (web) + Railway (api) |

---

## ENVIRONMENT VARIABLES

```bash
# /apps/web/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_AGORA_APP_ID=
PRIVATE_NODE_BACKEND_URL=http://localhost:4000
INTERNAL_COMMUNICATION_KEY=
```

```bash
# /apps/api/.env
PORT=4000
MONGODB_URI=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
INTERNAL_COMMUNICATION_KEY=
PAYSTACK_SECRET_KEY=
FLW_SECRET_KEY=
FLW_SECRET_HASH=
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
RESEND_API_KEY=
```

**Ask for these at the phase indicated below — do not ask for everything upfront.**

| Phase | Keys Required |
|---|---|
| Phase 1 | `MONGODB_URI`, `INTERNAL_COMMUNICATION_KEY` (generate via `openssl rand -hex 32`) |
| Phase 2 | All `FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*` values |
| Phase 4 | `PAYSTACK_SECRET_KEY` |
| Phase 6 | `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE` |
| Phase 7 | `FLW_SECRET_KEY`, `FLW_SECRET_HASH` |
| Phase 9 | `RESEND_API_KEY` |

---

## BUILD PHASES — EXECUTE SEQUENTIALLY, STOP AFTER EACH

---

### PHASE 1 — Monorepo, Infrastructure, BFF Proxy

1. Initialize monorepo: `/apps/web` (Next.js 14, TypeScript, Tailwind, App Router) and `/apps/api` (Node.js, Express, TypeScript).
2. Configure Tailwind in `/apps/web` with the **full dual-theme token set** from `UIUX_FLOW.md` v5.0 — both `[data-theme="dark"]` and `[data-theme="light"]` CSS variable blocks, exactly as specified, including the deepened light-mode gold (`#B8923F`) and the rationale comments.
3. Build the BFF proxy: `/apps/web/src/app/api/proxy/[...path]/route.ts` — catch-all route that attaches `INTERNAL_COMMUNICATION_KEY` and forwards to the Node.js backend.
4. Set up `/apps/api`: Express app, `helmet`, `express-rate-limit`, Mongoose connection, and middleware rejecting any request missing `INTERNAL_COMMUNICATION_KEY` — except routes under `/webhooks/*`, which authenticate via provider signature instead.
5. Create `.env.example` for both apps.
6. `git init`, initial commit.

**Stop. List every file created. Wait for confirmation.**

---

### PHASE 2 — Authentication & Core User/Minister Models

1. `/apps/web`: Firebase Auth UI for Login/Register (Email + Google).
2. `/apps/web`: on successful auth, get Firebase ID Token, POST to `/api/proxy/auth/sync`.
3. `/apps/api`: create Mongoose models exactly as specified in `SCHEMA.md` §1 (`User`) and §2 (`MinisterProfile`). Use `role: ['believer','minister','admin']` — do not reintroduce tier values into this enum.
4. `/apps/api`: build `/auth/sync` — verify Firebase token via Admin SDK, create `User` document, create a `Wallet` document with `balance: 0, pendingWithdrawalBalance: 0`. If the registering user selected "Minister," also create a `MinisterProfile` document with `tier: 1, badge: 'gray'` (Community Leader, self-declared, per PRD §11.1 — requires no documents).

**Stop. List every file created. Wait for confirmation.**

---

### PHASE 3 — Verification, Reports, Fellowship Foundations

1. Create Mongoose models from `SCHEMA.md` §3 (`VerificationRequest`), §9 (`Fellowship`), §14 (`Report`).
2. `/apps/api`: build `/verification/submit` — minister uploads ID + selfie (Firebase Storage or equivalent), creates a `VerificationRequest` with `status: 'pending'`.
3. `/apps/api`: build `/admin/verification/:id/approve` and `/admin/verification/:id/reject` — admin-only, update `MinisterProfile.tier`, `badge`, set probation fields per PRD §11.2 if Tier 2.
4. `/apps/api`: build `/fellowships` CRUD (create, join via code, list members).
5. `/apps/api`: build `/reports` — create report, admin list/review endpoints. Implement the complaint-ratio check (>5 reports in 30 days against one `targetId` → flag `MinisterProfile.isSuspended`).

**Stop. List every file created. Wait for confirmation.**

---

### PHASE 4 — The Financial Ledger (Read TRD §4 Fully Before This Phase)

1. Create Mongoose models from `SCHEMA.md` §4 (`Wallet`, already created in Phase 2 — extend if needed), §5 (`Transaction`), §6 (`ExchangeRateConfig`).
2. Seed one `ExchangeRateConfig` document: `{ coinsPerNaira: 0.85, isActive: true }`.
3. Build `/wallet/purchase/initialize` — creates a pending Paystack transaction for the requested Naira amount.
4. Build `/webhooks/paystack` — verify signature, check `externalRef` idempotency (§4.4), then credit coins using the formula `Math.floor(nairaPaid * config.coinsPerNaira)` via the atomic guarded pattern (§4.2).
5. Build `/wallet/give` — handles tithe/offering. Use the **exact** atomic transaction code block from `TRD.md` §4.2: guarded decrement from giver's `balance`, fee computed via `Math.ceil()`, credit to recipient's `pendingWithdrawalBalance`, transaction logged with `amount === feeCharged + netAmount` verified before commit.
6. Build `/wallet/withdraw` — debits **only** `pendingWithdrawalBalance` (never `balance`), applies the 7% withdrawal fee, follows the full flow in `TRD.md` §4.7 including the failure-refund path.

**Critical constraint, verify before marking this phase complete:** write a quick test script that fires 20 concurrent `/wallet/give` requests against a wallet with a balance of exactly 1 request's worth of coins. Confirm exactly 1 succeeds and 19 return `InsufficientBalanceError`. If more than 1 succeeds, the atomic guard is implemented incorrectly — fix before proceeding.

**Stop. List every file created. Show the concurrency test result. Wait for confirmation.**

---

### PHASE 5 — Daily Verse, Quiz, Streak

1. Create Mongoose models from `SCHEMA.md` §15 (`DailyVerse`), §16 (`DailyQuizAttempt`).
2. Build an admin-only content endpoint for curating verses (`POST /admin/daily-verse`) — no external API call anywhere in this phase.
3. Build `node-cron` job: 5:30 AM WAT exactly, fetch today's verse, FCM broadcast to all users.
4. Build `/quiz/attempt` — one attempt per user per day (enforced by the unique index), returns `wasCorrect`, awards a badge string on `User` (no points — removed per PRD §18).
5. Build `/streak/checkin` — increment `User.prayerStreak` if checked in yesterday or today is day 1, else reset to 0. **No ₦500 penalty of any kind** — confirmed permanently removed per PRD §16 item 11.
6. Build `node-cron` midnight sweep: reset `prayerStreak` to 0 for anyone who didn't check in yesterday.

**Stop. List every file created. Wait for confirmation.**

---

### PHASE 6 — Live Sessions, Agora, Attendance

1. Create Mongoose model from `SCHEMA.md` §7 (`LiveSession`, extend existing), §8 (`Attendance`).
2. Build `/agora/token` — signed token generation server-side only, `App Certificate` never sent to client.
3. `/apps/web`: build the `LiveSession` component, initialize Agora RTC Web SDK.
4. **Mandatory:** implement the network-quality listener from `TRD.md` §7.1 — `downlinkNetworkQuality >= 4` triggers forced audio-only fallback with the on-screen message specified.
5. Build attendance tracking: write an `Attendance` document on join, set `leftAt`/`durationSeconds` on leave/disconnect.
6. Build minister-side: "who missed this session" query against `Fellowship` members minus `Attendance` records for that session.

**Stop. List every file created. Wait for confirmation.**

---

### PHASE 7 — Real-Time: Socket.io, Prayer Dispatch, Chat

1. Attach Socket.io to the Express server (not Next.js). Implement auth at the `connect` handshake — reject unauthenticated sockets immediately, before any event listener fires.
2. Build `join_session` and `send_message` events for live session chat.
3. Create Mongoose model from `SCHEMA.md` §10 (`PrayerRequest`, extend existing), §11 (`Comment`).
4. Build the Uber-style prayer dispatch flow per `TRD.md` §8 — **use the exact atomic claim pattern shown** (`findOneAndUpdate` with `status: 'open'` condition) to prevent two ministers claiming the same request.
5. Build the 5-minute escalation cron job (checks for `open` requests older than 5 minutes, broadcasts fellowship-wide).
6. Build `/prayer-requests/:id/comments` using the new `Comment` model.

**Stop. List every file created. Wait for confirmation.**

---

### PHASE 8 — Feeds, Airtime, Utility

1. `/apps/web`: build the chronological infinite-scroll feed using Intersection Observer. **No algorithmic sorting, ever** — pure `createdAt: -1` per PRD §16 item 7.
2. Create Mongoose model from `SCHEMA.md` §12 (`Post`, extend existing).
3. Build `/posts` CRUD scoped to `fellowshipId`.
4. Build `/airtime/purchase` — guarded decrement from `Wallet.balance` **before** calling Flutterwave (per `TRD.md` §6), refund on Flutterwave failure.
5. Build `/webhooks/flutterwave` with secret hash verification.

**Stop. List every file created. Wait for confirmation.**

---

### PHASE 9 — Email, Admin Dashboard, Polish

1. Resend integration: tithe/offering receipts **must show the fee breakdown explicitly** (e.g. "₦1,000 given → ₦970 to minister, ₦30 platform fee") per `TRD.md` §4.3 and `UIUX_FLOW.md` Non-Negotiable #5.
2. Build the admin dashboard: verification queue, reports queue, complaint-ratio overview, `ExchangeRateConfig` editor (admin can adjust `coinsPerNaira` — changes apply only to future purchases, never retroactively).
3. Mobile responsiveness pass across all screens, both themes.
4. Run `npm audit` on both `/apps/web` and `/apps/api`, resolve high/critical findings.
5. Wire in Sentry (or equivalent) on the Node.js backend before this phase is considered complete — not after.

**Stop. List every file created. Provide a final deployment checklist. Wait for confirmation.**

---

## HOW TO START

Acknowledge that you have read this prompt and all four supporting documents in full. Then output:

1. The directory tree for the monorepo.
2. The `package.json` for both `/apps/web` and `/apps/api`.

**Do not write application logic. Stop after the directory tree and `package.json` files, and wait for confirmation before beginning Phase 1 properly.**
