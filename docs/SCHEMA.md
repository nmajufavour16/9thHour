# 9TH HOUR — MONGODB DATA SCHEMA

**Version:** 5.0 (Gap-Filled, Coin Economy Hardened)
**Database:** MongoDB Atlas (NoSQL)
**ORM:** Mongoose
**Last Updated:** June 2026
**Supersedes:** SCHEMA.md v4.0 — adds 9 missing collections, hardens Wallet/Transaction

---

## Architectural Rules (Read Before Writing Any Model)

1. All financial updates (`Wallet`, `Transaction`) **MUST** use the atomic guarded-update pattern from `TRD.md` §4.2 — never a plain read-then-write, even inside a `session.withTransaction()`.
2. All schemas use the Firebase Auth UID as `_id` (string) where the document represents a user-owned entity, to keep parity between Auth and the DB.
3. All coin/currency fields are **integers only.** No floats for money, ever.
4. `externalRef` fields carry a **unique index** — this is the idempotency guard against webhook replay.

---

## 1. User Schema (`User`)

```js
const userSchema = new Schema({
  _id: { type: String, required: true }, // Firebase UID
  fullName: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  avatarUrl: { type: String, default: null },

  // Role is account TYPE, not minister verification level — kept separate (see fix below)
  role: { type: String, enum: ['believer', 'minister', 'admin'], default: 'believer' },

  fellowshipId: { type: Schema.Types.ObjectId, ref: 'Fellowship', default: null },
  prayerStreak: { type: Number, default: 0 },
  lastPrayerDate: { type: Date, default: null },
  isVerified: { type: Boolean, default: false }, // email/phone verification, NOT minister tier
}, { timestamps: true });
```

**Fix applied:** v4.0 conflated `role` with minister verification tier (`['believer','tier1','tier2','tier3','admin']`), which made it structurally impossible to tell whether a "tier0" user was a believer or an unverified minister, and gave minister-specific data (ministry name, address, badge) no home. `role` is now a simple account type. All minister-specific data, including tier, lives in the new `MinisterProfile` collection below.

---

## 2. Minister Profile Schema (`MinisterProfile`) — NEW

Implements PRD §11.6 (public profile fields) and §13.5 (public ministry page).

```js
const ministerProfileSchema = new Schema({
  userId: { type: String, ref: 'User', required: true, unique: true }, // Firebase UID

  ministryName: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // for [ministername].9thhour.app (Phase 3)
  churchName: { type: String, required: true },
  churchAddress: { type: String, default: null },
  hideAddress: { type: Boolean, default: false }, // PRD §11.6 — optional security hide
  denomination: { type: String, default: 'Independent' },
  bio: { type: String, default: null },
  serviceSchedule: { type: String, default: null },

  // Verification (PRD §11)
  tier: { type: Number, enum: [1, 2, 3], default: 1 }, // 1=Community Leader, 2=Verified, 3=Trusted
  badge: { type: String, enum: ['gray', 'blue', 'gold'], default: 'gray' },
  verifiedAt: { type: Date, default: null },
  verificationExpiresAt: { type: Date, default: null }, // annual renewal, PRD §11.5
  isOnProbation: { type: Boolean, default: false }, // first 30 days post Tier 2 approval
  probationEndsAt: { type: Date, default: null },
  maxOfferingPerSession: { type: Number, default: null }, // probation cap, e.g. 50000
  maxWithdrawableDuringProbation: { type: Number, default: null }, // e.g. 100000

  // Trust signals (publicly visible per PRD §11.6)
  complaintCount30Days: { type: Number, default: 0 },
  memberCount: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },

  // Admin-only fields (never returned in public API responses)
  phoneNumber: { type: String, default: null, select: false },
  governmentIdType: { type: String, default: null, select: false },
  governmentIdNumber: { type: String, default: null, select: false },

  // Community verification path (PRD §11.4)
  verificationPath: { type: String, enum: ['standard', 'community'], default: 'standard' },
  vouchCount: { type: Number, default: 0 },
  voucherUserIds: [{ type: String, ref: 'User' }],

  canAcceptOfferings: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspendedReason: { type: String, default: null },
}, { timestamps: true });

ministerProfileSchema.index({ tier: 1, badge: 1 });
ministerProfileSchema.index({ slug: 1 }, { unique: true });
```

---

## 3. Verification Request Schema (`VerificationRequest`) — NEW

Implements PRD §11.2 (document submission and admin review workflow).

```js
const verificationRequestSchema = new Schema({
  ministerId: { type: String, ref: 'User', required: true },
  requestedTier: { type: Number, enum: [2, 3], required: true },

  fullName: { type: String, required: true },
  churchName: { type: String, required: true },
  churchAddress: { type: String, required: true },
  denomination: { type: String, default: 'Independent' },
  phoneNumber: { type: String, required: true, select: false },

  idType: { type: String, enum: ['national_id', 'drivers_license', 'voters_card', 'passport'], required: true },
  idImageUrl: { type: String, required: true, select: false },
  selfieImageUrl: { type: String, required: true, select: false },

  // Tier 3 additional checks (PRD §11.3)
  bankAccountName: { type: String, default: null },
  bankAccountNumber: { type: String, default: null, select: false },
  testDepositVerified: { type: Boolean, default: false },
  socialMediaProofUrl: { type: String, default: null },
  videoInterviewUrl: { type: String, default: null },

  status: { type: String, enum: ['pending', 'in_review', 'approved', 'rejected'], default: 'pending' },
  reviewedByAdminId: { type: String, ref: 'User', default: null },
  rejectionReason: { type: String, default: null },
  reviewNotes: { type: String, default: null },
}, { timestamps: true });

verificationRequestSchema.index({ status: 1, createdAt: 1 });
```

---

## 4. Wallet Schema (`Wallet`) — HARDENED

```js
const walletSchema = new Schema({
  userId: { type: String, ref: 'User', required: true, unique: true },

  // Spendable balance — coins this user purchased or received as a personal gift.
  // NEVER withdrawable to cash. Spent on tithes, offerings, gifts, airtime only.
  balance: { type: Number, default: 0, min: 0 },

  // Earned balance — coins received FROM OTHERS via tithe/offering/gift/booking,
  // where this user is the toMinisterId. ONLY this field is debited on withdrawal.
  // Structurally separate from `balance` per TRD.md §4.5 — closes the
  // self-fund-then-withdraw loophole.
  pendingWithdrawalBalance: { type: Number, default: 0, min: 0 },

  totalEarnedAllTime: { type: Number, default: 0, min: 0 },
  totalWithdrawnAllTime: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
```

**Fix applied:** v4.0's comment "(1 coin = 1 NGN)" implied a 1:1 purchase rate with no documented margin mechanism. The rate is now 1 NGN = 0.85 coins at purchase, with a single fixed 1-coin-equals-₦1 book value for every operation after that (full detail in `TRD.md` §4.1). `balance` and `pendingWithdrawalBalance` were already separate fields in v4.0 — this version makes the *rule* explicit in schema comments so future contributors don't accidentally merge them.

---

## 5. Transaction Schema (`Transaction`) — HARDENED

```js
const transactionSchema = new Schema({
  fromUserId: { type: String, ref: 'User', default: null },
  toMinisterId: { type: String, ref: 'User', default: null },
  sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', default: null },

  amount: { type: Number, required: true, min: 0 },       // gross, integer coins
  feeCharged: { type: Number, required: true, min: 0 },    // integer coins, Math.ceil()
  netAmount: { type: Number, required: true, min: 0 },     // amount - feeCharged, must reconcile exactly

  type: {
    type: String,
    enum: [
      'fund_wallet', 'tithe', 'offering', 'airtime',
      'gift', 'seed', 'withdrawal', 'payout',
      'project_offering', 'thanksgiving', 'emergency_fund',
      'booking', 'round_up', 'feeding_program', 'faith_clinic',
    ],
    required: true
  },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },

  // CRITICAL: unique + sparse index — the idempotency guard against webhook replay (TRD §4.4)
  externalRef: { type: String, default: null },

  metadata: { type: Schema.Types.Mixed }, // phone numbers for airtime, gift type, etc.
}, { timestamps: true });

transactionSchema.index({ fromUserId: 1, createdAt: -1 });
transactionSchema.index({ toMinisterId: 1, createdAt: -1 });
transactionSchema.index({ externalRef: 1 }, { unique: true, sparse: true });

// Application-layer invariant enforced in every write path, not just here:
// amount === feeCharged + netAmount, always, no exceptions.
```

---

## 6. Exchange Rate Config Schema (`ExchangeRateConfig`) — NEW

Single source of truth for the coin purchase rate. Implements `TRD.md` §4.1.

```js
const exchangeRateConfigSchema = new Schema({
  coinsPerNaira: { type: Number, required: true, default: 0.85 }, // ₦1,000 → 850 coins
  effectiveFrom: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, default: true },
  setByAdminId: { type: String, ref: 'User', required: true },
}, { timestamps: true });

// Only one document should have isActive: true at any time — enforced in application logic,
// historical rate changes are kept (never deleted) for audit trail purposes.
exchangeRateConfigSchema.index({ isActive: 1 });
```

---

## 7. Live Session Schema (`LiveSession`)

```js
const liveSessionSchema = new Schema({
  ministerId: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, enum: ['prayer', 'worship', 'sermon', 'counseling'], required: true },
  agoraChannelName: { type: String, required: true, unique: true },
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
  scheduledAt: { type: Date, required: true },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  viewerCount: { type: Number, default: 0 },
  totalOfferingsReceived: { type: Number, default: 0 },
  audioArchiveUrl: { type: String, default: null }, // PRD §7.5 — free downloadable audio, 2G-friendly
}, { timestamps: true });
```

**Fix applied:** added `audioArchiveUrl` — PRD §7.5 explicitly requires "sermons downloadable as audio for free, works on 2G," which had no field to store it in v4.0.

---

## 8. Attendance Schema (`Attendance`) — NEW

Implements PRD §7.5 ("Attendance tracking — minister sees who missed live sessions").

```js
const attendanceSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true },
  userId: { type: String, ref: 'User', required: true },
  joinedAt: { type: Date, required: true },
  leftAt: { type: Date, default: null },
  durationSeconds: { type: Number, default: 0 },
}, { timestamps: true });

attendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
attendanceSchema.index({ userId: 1, createdAt: -1 }); // "sessions this user missed" queries
```

---

## 9. Fellowship Schema (`Fellowship`) — NEW

Referenced throughout v4.0 (`User`, `Post`, `PrayerRequest`) but never defined. Implements PRD §7.7.

```js
const fellowshipSchema = new Schema({
  name: { type: String, required: true }, // e.g. "NIFES UNILAG"
  campus: { type: String, required: true },
  leadMinisterId: { type: String, ref: 'User', required: true },
  description: { type: String, default: null },
  isPrivate: { type: Boolean, default: true }, // PRD §7.7 — church can choose private/verified-only
  joinCode: { type: String, default: null },
  memberCount: { type: Number, default: 0 },
}, { timestamps: true });

fellowshipSchema.index({ campus: 1 });
```

---

## 10. Prayer Request Schema (`PrayerRequest`)

```js
const prayerRequestSchema = new Schema({
  requesterId: { type: String, ref: 'User', required: true },
  fellowshipId: { type: Schema.Types.ObjectId, ref: 'Fellowship', required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['general', 'urgent', 'vulnerability'], required: true },
  isAnonymousToPeers: { type: Boolean, default: false },
  status: { type: String, enum: ['open', 'accepted', 'completed'], default: 'open' },
  acceptedByMinisterId: { type: String, ref: 'User', default: null },
  prayedForCount: { type: Number, default: 0 },
}, { timestamps: true });

prayerRequestSchema.index({ status: 1, fellowshipId: 1, createdAt: 1 }); // 5-min escalation cron query
```

---

## 11. Comment Schema (`Comment`) — NEW

Implements PRD §7.2 ("Users can leave comments on prayer requests").

```js
const commentSchema = new Schema({
  prayerRequestId: { type: Schema.Types.ObjectId, ref: 'PrayerRequest', required: true },
  authorId: { type: String, ref: 'User', required: true },
  body: { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

commentSchema.index({ prayerRequestId: 1, createdAt: 1 });
```

---

## 12. Fellowship Post Schema (`Post`)

```js
const postSchema = new Schema({
  authorId: { type: String, ref: 'User', required: true },
  fellowshipId: { type: Schema.Types.ObjectId, ref: 'Fellowship', required: true },
  type: { type: String, enum: ['announcement', 'testimony', 'prayer_point'], required: true },
  body: { type: String, required: true },
  mediaUrl: { type: String, default: null },
  seedCount: { type: Number, default: 0 },
}, { timestamps: true });

postSchema.index({ fellowshipId: 1, createdAt: -1 }); // chronological infinite scroll
```

---

## 13. Gift Schema (`Gift`) — NEW

Implements PRD §9.2 (Seed of Faith) and §9.3 (Live Session Gifting). V2 Phase 2, modeled now for forward compatibility per the AGENT_PROMPT phase plan.

```js
const giftSchema = new Schema({
  senderId: { type: String, ref: 'User', required: true },
  recipientType: { type: String, enum: ['post', 'live_session'], required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', default: null },
  giftTier: { type: String, enum: ['bronze', 'silver', 'gold', 'diamond'], required: true },
  amount: { type: Number, required: true }, // 500 / 1000 / 2500 / 5000 coins
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
}, { timestamps: true });

giftSchema.index({ sessionId: 1, createdAt: -1 }); // live broadcast feed
```

---

## 14. Report Schema (`Report`) — NEW

Implements PRD §7.11 and §14.4 (moderation queue, complaint ratio monitoring).

```js
const reportSchema = new Schema({
  reporterId: { type: String, ref: 'User', required: true },
  targetType: { type: String, enum: ['minister', 'testimony', 'prayer_request', 'feed_post', 'live_session'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  category: { type: String, enum: ['fraud', 'false_doctrine', 'harassment', 'inappropriate_content'], required: true },
  details: { type: String, default: null },
  status: { type: String, enum: ['open', 'reviewed', 'actioned', 'dismissed'], default: 'open' },
  reviewedByAdminId: { type: String, ref: 'User', default: null },
}, { timestamps: true });

reportSchema.index({ targetId: 1, createdAt: -1 }); // complaint-ratio query: count last 30 days
reportSchema.index({ status: 1, createdAt: 1 }); // admin queue, oldest open first
```

---

## 15. Daily Verse Schema (`DailyVerse`)

```js
const dailyVerseSchema = new Schema({
  publishDate: { type: String, required: true, unique: true }, // YYYY-MM-DD
  reference: { type: String, required: true },
  text: { type: String, required: true },
  devotionalContext: { type: String, required: true },
  quizQuestion: { type: String, default: null },
  quizOptions: [{ type: String }],
  quizCorrectAnswerIndex: { type: Number, default: null },
}, { timestamps: true });
```

---

## 16. Daily Quiz Attempt Schema (`DailyQuizAttempt`) — NEW

Implements PRD §9.5/§7.4 — badges for correct answers, no points (points system removed per PRD §18).

```js
const dailyQuizAttemptSchema = new Schema({
  userId: { type: String, ref: 'User', required: true },
  dailyVerseId: { type: Schema.Types.ObjectId, ref: 'DailyVerse', required: true },
  selectedAnswerIndex: { type: Number, required: true },
  wasCorrect: { type: Boolean, required: true },
}, { timestamps: true });

dailyQuizAttemptSchema.index({ userId: 1, dailyVerseId: 1 }, { unique: true }); // one attempt per day per user
```

---

## Summary of Changes from v4.0

| Change | Reason |
|---|---|
| `User.role` simplified, tier moved to `MinisterProfile` | Structural fix — believer/minister tiers were conflated |
| 9 new collections added | Close gaps where PRD v2.0 features had no backing data model |
| `Wallet` fields documented with explicit non-merge rule | Closes self-fund-then-withdraw loophole |
| `Transaction.externalRef` unique index made explicit | Closes webhook replay loophole |
| `ExchangeRateConfig` collection added | Single source of truth for the 850-coin-per-₦1,000 rate |
| `LiveSession.audioArchiveUrl` added | PRD §7.5 free audio download requirement had no field |
