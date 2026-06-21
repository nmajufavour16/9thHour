# 9TH HOUR — TECHNICAL REQUIREMENTS DOCUMENT (TRD)

**Version:** 5.0 (Coin Economy Hardened)
**Status:** Active Development — Build-Ready
**Last Updated:** June 2026
**Supersedes:** TRD v4.0 — adds financial integrity engine, retains BFF architecture

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router), TypeScript strict mode |
| Backend Framework | Node.js + Express — dedicated server |
| Styling | Tailwind CSS, dual-theme tokens (dark default, white/gold light) |
| Authentication | Firebase Auth (Client) + Firebase Admin (Server) — identity only |
| Database | MongoDB Atlas, Mongoose ORM |
| Real-time | Socket.io (chat, gifting, prayer dispatch) |
| Live Video/Audio | Agora RTC SDK Web, audio-only fallback on poor network |
| Inbound Payments | Paystack (coin purchase, direct tithes/offerings) |
| Outbound Utility | Flutterwave (airtime & data fulfilment) |
| Push Notifications | Firebase Cloud Messaging |
| Email | Resend |
| Cron Jobs | node-cron (in-process on the Node.js backend) |
| Hosting | Vercel (frontend) + Railway (backend + MongoDB connection) |

**No VPS required.** No Python in V1 — confirmed single-language (TypeScript/Node) backend for all financial logic and real-time systems, per architecture decision.

---

## 2. System Architecture (BFF Pattern — Unchanged)

```
┌─────────────────────────────────────────┐
│ CLIENT (Browser / PWA)                   │
│ Next.js 14 App Router                    │
│ ├── Firebase Auth (JWT generation)       │
│ ├── Agora RTC Web SDK                    │
│ └── Socket.io Client                     │
└──────────────────┬────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ NEXT.JS API ROUTES (Vercel Serverless)   │
│ /api/proxy/[...path] → attaches internal key │
└──────────────┬─────────────┬─────────────┘
               │             │
               ▼             ▼
┌──────────────────────┐  ┌──────────────────────┐
│ NODE.JS BACKEND        │  │ EXTERNAL SERVICES     │
│ Express + Mongoose     │  │ Paystack / Flutterwave│
│ Socket.io Server        │  │ Agora.io / FCM         │
│ Cron Scheduler           │  │                        │
│ FINANCIAL INTEGRITY     │  │                        │
│ ENGINE (§4 below)        │  │                        │
└──────────┬──────────────┘  └──────────────────────┘
           ▼
┌──────────────────────┐
│ MONGODB ATLAS          │
└──────────────────────┘
```

---

## 3. Authentication Flow (Unchanged)

1. Firebase Auth handles Email/Password and Google OAuth client-side.
2. Client retrieves Firebase ID Token, sends as `Authorization: Bearer <token>` to the Next.js proxy.
3. Proxy forwards request + token + `INTERNAL_COMMUNICATION_KEY` to Node.js.
4. Node.js verifies the token via firebase-admin, extracts `uid`, performs MongoDB operations.
5. WebSocket connections authenticate at the `connect` event using the same token — **never** defer auth checks to individual events. An unauthenticated socket must be rejected at handshake, before it can listen to any broadcast channel.

---

## 4. Financial Integrity Engine

This section is the single most important part of this document. Every endpoint that touches `Wallet` or `Transaction` must follow these rules without exception. This is not a style guide — these patterns prevent real, exploitable loss of real money.

### 4.1 The Coin Exchange Rate — Single Source of Truth

```js
// ExchangeRateConfig collection — exactly one active document at a time
{
  _id: ObjectId,
  coinsPerNaira: 0.85,          // ₦1,000 → 850 coins
  effectiveFrom: Date,
  isActive: Boolean,
  setByAdminId: String
}
```

**Rule:** This is the *only* place a Naira-to-coin conversion ever happens. After purchase, 1 coin = ₦1.00 internally, forever, for every other operation (fees, giving, withdrawal). There is no second exchange rate anywhere in the codebase. If you find yourself writing a conversion calculation outside the `/wallet/purchase` endpoint, stop — that calculation should not exist.

```js
// /wallet/purchase — the ONLY conversion point in the system
const config = await ExchangeRateConfig.findOne({ isActive: true });
const coinsCredited = Math.floor(nairaPaid * config.coinsPerNaira);
// Math.floor — NEVER round up in the user's favor. Residual fraction is platform margin by design.
```

### 4.2 Atomic Guarded Balance Mutations — Closes the Double-Spend Race Condition

**The single most common real-world wallet bug:** reading a balance, checking it in application code, then writing a new value — even inside a transaction session — leaves a race window where two concurrent requests can both pass the check before either commits.

**The fix — condition and mutation must be the same atomic database operation:**

```js
const session = await mongoose.startSession();
session.startTransaction();
try {
  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },   // condition checked atomically by MongoDB
    { $inc: { balance: -amount } },
    { new: true, session }
  );

  if (!updatedWallet) {
    await session.abortTransaction();
    throw new InsufficientBalanceError(userId, amount);
  }

  // Fee calculation — see §4.3
  const feeCharged = Math.ceil(amount * feeRate);   // ROUND UP — always platform-favoring, never shorts the platform
  const netAmount = amount - feeCharged;

  await Wallet.findOneAndUpdate(
    { userId: toMinisterId },
    { $inc: { pendingWithdrawalBalance: netAmount, totalEarnedAllTime: netAmount } },
    { session }
  );

  await Transaction.create([{
    fromUserId: userId,
    toMinisterId,
    amount,
    feeCharged,
    netAmount,
    type: 'tithe',
    status: 'completed',
    externalRef: idempotencyKey, // see §4.4
  }], { session });

  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

**Invariant that must always hold, checked in tests:** `amount === feeCharged + netAmount` exactly, with zero leakage either direction.

### 4.3 Fee Calculation Rules (Per PRD §13.2)

```js
const FEE_SCHEDULE = {
  tithe: 0.03,
  offering: 0.03,
  withdrawal: 0.07,
  project_offering: 0.015,
  thanksgiving: 0.015,
  emergency_fund: 0.015,
  booking: 0.10,
  seed: 0.10,
  gift: 0.10,
  round_up: 0.0075,
  feeding_program: 0.01,
  faith_clinic: 0.05,
};

function computeFee(type, amount) {
  const rate = FEE_SCHEDULE[type] ?? 0;
  return Math.ceil(amount * rate);   // round up, platform-favoring, never user-favoring
}
```

**The frontend must display this breakdown before every confirmation** — e.g. "₦1,000 → ₦970 to minister, ₦30 platform fee (3%)." Per PRD §14, transparency is the trust mechanism now that the fee is non-zero. Silent deduction is not acceptable at any fee rate.

### 4.4 Webhook Idempotency — Closes the Replay Attack Loophole

Paystack and Flutterwave webhooks can arrive more than once — by provider retry, network duplication, or deliberate replay by an attacker who captured a valid payload. Without an idempotency check, the same payment confirmation could credit a wallet multiple times.

```js
// externalRef has a UNIQUE index in the Transaction schema — non-negotiable
transactionSchema.index({ externalRef: 1 }, { unique: true, sparse: true });

// In the webhook handler — check BEFORE any balance mutation
app.post('/webhooks/paystack', async (req, res) => {
  const signatureValid = verifyPaystackSignature(req);
  if (!signatureValid) return res.sendStatus(401);

  const existing = await Transaction.findOne({ externalRef: req.body.data.reference });
  if (existing && existing.status === 'completed') {
    return res.sendStatus(200); // already processed — acknowledge, do nothing further
  }

  // proceed with the atomic credit flow from §4.2
});
```

**Always return 200 to the webhook provider once verified and processed (or already-processed) — never let provider retries pile up due to slow responses.**

### 4.5 Minister Earnings Separation — Closes the Self-Fund-Then-Withdraw Loophole

A user's `Wallet.balance` (coins they personally purchased or hold for spending) and a minister's `Wallet.pendingWithdrawalBalance` (coins earned from tithes/offerings/gifts *received from other users*) are **structurally separate fields and must never merge.**

- `balance` → spendable on tithes, offerings, gifts, airtime. **Never withdrawable to cash.**
- `pendingWithdrawalBalance` → accumulated only via `$inc` from incoming `tithe`/`offering`/`gift`/`booking` transactions where this user is `toMinisterId`. **Only this field can be debited by the withdrawal endpoint.**

The withdrawal endpoint must verify the requested amount against `pendingWithdrawalBalance` specifically — never against `balance`, and never allow a transfer from `balance` into `pendingWithdrawalBalance` via any code path. If such a transfer is ever needed for a legitimate product reason, it requires a new, explicitly-named transaction type and admin sign-off — it must never happen implicitly.

### 4.6 Integer-Only Currency Storage — Closes Float Rounding Leakage

All coin balances and all Naira amounts are stored as **integers only.** JavaScript floating-point arithmetic is never used for money.

- Coins: whole numbers, no fractional coins, ever.
- Naira amounts received from Paystack/Flutterwave: already integers (kobo), used directly — never converted to floats for intermediate calculation.
- Any operation producing a fractional result (fee percentages) is resolved with `Math.ceil()` for fees and `Math.floor()` for credits — both rules consistently favor the platform's ledger integrity over silently favoring either party through accumulated rounding.

### 4.7 Withdrawal Flow (Full, With Fee)

```
1. Minister requests withdrawal of X coins from pendingWithdrawalBalance.
2. Verify X <= pendingWithdrawalBalance (atomic guarded check, same pattern as §4.2).
3. feeCharged = computeFee('withdrawal', X)  // 7%
4. netPayout = X - feeCharged
5. Atomic transaction:
   - Decrement pendingWithdrawalBalance by X (guarded, same operation)
   - Insert Transaction { type: 'withdrawal', amount: X, feeCharged, netAmount: netPayout, status: 'pending' }
6. Trigger Paystack Transfer API to minister's verified bank account for netPayout (converted 1 coin = ₦1).
7. On Paystack transfer webhook success → Transaction.status = 'completed'.
8. On transfer failure → Transaction.status = 'failed', REFUND pendingWithdrawalBalance by X (reverse the atomic decrement) — minister is never left in limbo with deducted-but-unpaid coins.
```

---

## 5. Payment & Virtual Economy — Inbound Flow (Paystack)

1. User clicks "Buy Coins," selects a Naira amount.
2. Node.js initializes Paystack transaction for that Naira amount (kobo).
3. User completes payment on Paystack's hosted page.
4. Paystack webhook hits Node.js — signature verified, idempotency checked (§4.4).
5. Coin credit calculated via §4.1, applied via the atomic guarded pattern (§4.2 logic, credit variant).
6. Transaction logged with `type: 'fund_wallet'`, `feeCharged: 0` (no fee on purchase itself — the margin is the exchange rate, not a separate fee).

## 6. Utility Flow (Flutterwave Airtime)

1. User requests airtime, selects amount in coins.
2. Atomic guarded decrement from `Wallet.balance` (§4.2 pattern) — **debit happens before calling Flutterwave**, transaction logged as `pending`.
3. Node.js calls Flutterwave Bill Payment API.
4. On Flutterwave success → `Transaction.status = 'completed'`.
5. On Flutterwave failure → `Transaction.status = 'failed'`, **refund the coins** (reverse the atomic decrement) — user is never charged for a failed airtime delivery.

---

## 7. Live Streaming & WebSockets

### 7.1 Agora RTC

- Minister hosts via signed token issued by Node.js backend only — `App Certificate` never reaches the client.
- **Mandatory:** client listens to network quality events. If `downlinkNetworkQuality >= 4` (Bad/Very Bad/Down), force-disable video track, switch to audio-only, display "Audio-only mode (Poor Connection)."
- Per PRD §7.5: sessions support unlimited duration, no recording in V1 (Phase 3 premium feature).

### 7.2 Socket.io

- Runs directly on the Node.js Express server (not on Next.js — serverless functions cannot hold persistent WebSocket connections).
- Handles: real-time chat, viewer count, prayer-request queue updates, live gifting animation broadcasts (V2).
- **Auth at handshake, not per-event** (§3, final point) — reject unauthenticated connections immediately.
- **Horizontal scaling note:** if the backend ever runs more than one instance, Socket.io requires a Redis adapter (`socket.io-redis`) so broadcasts reach clients connected to a different instance. Not required for V1 single-instance Railway deployment, but the dependency should be added to `package.json` now so it's a config change, not a re-architecture, later.

---

## 8. Uber-Style Prayer Request System (PRD §12.1)

1. User submits request → Node.js saves to MongoDB, `status: 'open'`.
2. Node.js triggers FCM broadcast to all verified ministers in the user's fellowship.
3. **Race-condition-safe acceptance** — the first minister to accept must claim the request atomically:

```js
const claimed = await PrayerRequest.findOneAndUpdate(
  { _id: requestId, status: 'open' },   // only succeeds if still open
  { status: 'accepted', acceptedByMinisterId: ministerId },
  { new: true }
);
if (!claimed) {
  return res.status(409).json({ error: 'Already claimed by another minister' });
}
```

4. If no response in 5 minutes (checked via cron, §10), broadcast to all online ministers in the fellowship.
5. FCM pushes confirmation to user. Platform fee: ₦0 — confirmed permanently free per PRD §12.1.

---

## 9. Daily Bible Verse & Quiz (PRD §7.4)

- **No external Bible API.** Content is pre-seeded and curated manually in the `DailyVerse` collection by the internal content team via an admin interface.
- node-cron job fires at exactly **5:30 AM WAT** daily: reads the `DailyVerse` document matching today's date, triggers FCM broadcast to all users.
- Daily Bible Quiz (3 questions) is attached to the same `DailyVerse` document; user attempts are logged in `DailyQuizAttempt` (badges only, no points per PRD §9.5/§18).

---

## 10. Cron Jobs (node-cron, in-process on Node.js backend)

| Job | Schedule | Action |
|---|---|---|
| Daily Verse Broadcast | 5:30 AM WAT | Fetch today's `DailyVerse`, FCM broadcast to all users |
| Prayer Request Escalation | Every minute | Find `open` requests older than 5 minutes, broadcast to fellowship-wide ministers |
| Midnight Prayer Chain Reminder | Per user slot, 5 min before | FCM reminder for scheduled midnight prayer slot |
| Streak Reset Sweep | Midnight WAT | For users with no check-in yesterday, reset `prayerStreak` to 0 (no penalty per PRD §16 item 11) |
| Verification Badge Expiry Check | Daily | Flag any Tier 2/3 minister whose annual verification has lapsed |

---

## 11. Security Requirements

- `helmet` middleware on all Express routes.
- Rate limiting (`express-rate-limit`) on `/auth/sync`, `/wallet/purchase`, and all webhook endpoints to blunt brute-force and replay attempts.
- All financial endpoints require the `INTERNAL_COMMUNICATION_KEY` header from the Next.js proxy — direct calls to the Node.js backend bypassing the proxy are rejected, except for verified external webhooks.
- `pip-audit`-equivalent for Node: `npm audit` run in CI on every deploy.
- Sentry (or equivalent) wired in from day one — not retrofitted after the first incident.
