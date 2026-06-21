# 9TH HOUR — PRD ADDENDUM (Architecture & Coin Economy)

**Version:** 1.0 — companion to client PRD v2.0
**Read alongside:** `9TH_HOUR_FINAL_PRD.md` (client-authoritative, unchanged)
**Purpose:** This addendum does not alter any product, business, or policy decision in the client's PRD v2.0. It exists solely to make the *technical specifics* of the coin economy precise enough to build against, since PRD v2.0 correctly leaves exchange-rate mechanics to the infrastructure spec ("Standard margin to be defined in infrastructure spec," §7.8).

---

## A.1 — Coin Exchange Rate (Final)

| Direction | Rate | Example |
|---|---|---|
| **Purchase** (NGN → Coins) | 1 NGN = 0.85 coins | ₦1,000 → 850 coins |
| **Internal book value** (Coins → NGN, for fees/giving/withdrawal) | 1 coin = ₦1.00 flat | 850 coins = ₦850 book value |

**Why two different-looking numbers don't create two exchange rates:** Real currency converts to coins exactly once — at the moment of purchase via Paystack. After that, coins behave as a fixed-value internal unit (1 coin = ₦1) for every subsequent operation: tithes, offerings, gifts, fees, and minister withdrawal. There is only one rate in the entire system, configured once, versioned, and never duplicated across services. Full implementation detail is in `TRD.md` §4 and `SCHEMA.md` (ExchangeRateConfig collection).

This is consistent with PRD §7.1 ("Users buy in-app coins with real money via Paystack") and §15.1 ("Payment: Paystack — users buy in-app coins with real money; all platform payments use coins") — both remain accurate as written. This addendum only fixes the specific numeric rate and the rule for how it's enforced.

---

## A.2 — Schema Gaps Closed (No Policy Change)

The following collections did not exist in the SCHEMA.md shared by the client and are added in this build pass purely to support features **already specified** in PRD v2.0. None of these represent new product decisions:

| Collection Added | PRD Section It Implements |
|---|---|
| `Fellowship` | §7.7, §3.1 — referenced throughout but never defined |
| `MinisterProfile` | §11.6, §13.5 — "Public ministry page," verification badge, complaint count, member count |
| `VerificationRequest` | §11.2 — ID/photo upload, admin review workflow |
| `Report` | §7.11, §14.4 — moderation queue, complaint ratio monitoring |
| `Comment` | §7.2 — "Users can leave comments on prayer requests" |
| `Attendance` | §7.5 — "minister sees who missed live sessions" |
| `Gift` | §9.2, §9.3 — Seed of Faith + Live Session Gifting (V2, modeled now for forward compatibility) |
| `DailyQuizAttempt` | §7.4, §9.5 — Daily Bible Quiz scoring/badges |
| `ExchangeRateConfig` | A.1 above — single source of truth for the coin rate |

---

## A.3 — Architecture Confirmation

PRD §15.1 leaves "Backend stack — to be defined in infrastructure spec." This is now confirmed as:

- **Frontend:** Next.js 14 (App Router), TypeScript
- **Backend:** Node.js + Express, dedicated server (not Next.js serverless functions) — see TRD.md for the BFF rationale
- **Database:** MongoDB Atlas via Mongoose, with mandatory ACID transactions on all financial writes
- **Real-time:** Socket.io (chat, gifting, prayer dispatch) running on the same Node.js backend
- **Auth:** Firebase Auth (client + Admin SDK) — strictly identity only, no Firestore
- **Push:** Firebase Cloud Messaging
- **Live Video:** Agora RTC (confirmed per PRD §15.1)
- **Inbound payments:** Paystack | **Outbound utility:** Flutterwave (airtime/data fulfilment)
- **Email:** Resend

No product feature, fee rate, ad policy, or feed behavior in the client's PRD v2.0 is altered by this addendum.
