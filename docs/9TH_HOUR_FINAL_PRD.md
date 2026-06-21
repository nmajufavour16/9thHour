# 9TH HOUR

*Faith Community Platform*

**Product Requirements Document** | Version 2.0 | June 2026

*Confidential — Internal Use Only*

---

## Table of Contents

1. Product Identity & Overview
2. Vision & Mission
3. Target Audience & Market Segmentation
4. Brand Identity
5. Platform Type & Architecture
6. User Roles
7. Core Features — V1 Launch (Month 0–3)
8. Core Features — V2 Phase 1 (Month 4–6)
9. Core Features — V2 Phase 2 (Month 7–9)
10. Core Features — V2 Phase 3 (Month 10–12)
11. Minister Verification System
12. Prayer Systems
13. Monetisation & Fee Structure
14. Content Policies & Moderation
15. Technical Requirements
16. Non-Negotiables (Superseding Policies)
17. Success Metrics
18. Out of Scope — V1
19. Future Roadmap

---

## 1. Product Identity & Overview

| Field | Detail |
|---|---|
| Platform Name | 9th Hour |
| Document Version | 2.0 (supersedes all prior versions) |
| Date | June 2026 |
| Status | Active Development |
| Primary Market | University students & young adults |
| Platform Type | Faith Community / Spiritual Growth Platform |
| Author | THE CJ BRAND / Phayvo |

### 1.1 Biblical Origin

Acts 3:1 — "Peter and John went to the temple at the ninth hour, the hour of prayer."

The ninth hour (3:00 PM) is traditionally the hour of prayer in Christian tradition.

### 1.2 Tagline

"9th Hour — the hour of prayer is now."

### 1.3 Onboarding Explanation

"In the Bible, Peter and John went to the temple at the ninth hour — the hour of prayer (Acts 3:1). 9th Hour is your digital temple. A place to pray, share, give, and belong — any hour of the day."

---

## 2. Vision & Mission

### 2.1 Vision

To be the most trusted digital home for Christians — a place where faith is lived, expressed, grown, and given freely.

A purpose-built platform where faith communities connect with churches, ministries, and ministers through live interactive prayer sessions, in-app giving, daily spiritual content, community testimony, and material support (school fees, airtime, meals) — replacing the fragmented stack of YouTube + WhatsApp + bank transfers.

### 2.2 Mission

9th Hour connects Christians across universities and communities by providing a platform for worship, real-time prayer, daily spiritual nourishment, gospel culture, and digital giving — all within a safe, ad-minimal environment.

"Bring the sanctuary wherever you are. Make every hour the ninth hour."

---

## 3. Target Audience & Market Segmentation

> **⚠ NOTE:** Update (v2.0): The primary segment is now defined by institutions (universities), not geography.

### 3.1 Primary Segment — University Students

University students across campuses worldwide (ages 18–30) form the core user base. This group is:

- Digitally native with high smartphone penetration
- Actively involved in campus fellowship groups (CAN, NIFES, Scripture Union, etc.)
- Seeking community, discipleship resources, and peer accountability
- Price-sensitive, with limited but growing digital payment adoption

### 3.2 Secondary Segment — Pastors, Churches & Campus Fellowships

Church leaders and campus fellowships seeking digital reach and giving infrastructure. Also includes:

- Young Christian professionals (ages 22–35) who have graduated and are establishing careers
- Active church attendees seeking digital tools to supplement their faith life
- More financially capable of paid tier subscriptions
- Influential in sharing platforms within their social networks

### 3.3 Tertiary Segment — Broader Faith Community

Working-class adults who want to support indigent students and access prayer. This also covers:

- Faith-based NGOs and campus ministries
- Gospel artists seeking platform visibility
- Intercessory and prayer network groups
- Spiritual growth communities and discipleship cohorts

---

## 4. Brand Identity

### 4.1 Color Palette

| Usage | Hex Code |
|---|---|
| Background (primary) | #0A0A14 — near black, purple-tinted |
| Background (surface) | #13131F — card/panel |
| Background (elevated) | #1A1A2E — modals, overlays |
| Primary (purple) | #6D28D9 — primary actions, CTA |
| Primary light | #8B5CF6 — hover states, highlights |
| Gold | #C9A84C — offerings, badges, premium |
| Gold light | #E8B86D — warm accents |
| Text (primary) | #F5F3FF — warm white, purple-tinted |
| Text (secondary) | #A89FC0 — muted labels |
| Text (muted) | #5C5272 — placeholders, disabled |
| Live | #E53E3E — live badge |
| Success | #48BB78 |
| Error | #F56565 |
| Border | #2A2040 |

### 4.2 Typography

| Usage | Font |
|---|---|
| Display / Headings | Playfair Display — 600, 700 (sacred weight) |
| Body / UI | DM Sans — 400, 500, 600 (clean, readable) |
| Currency / Numbers | JetBrains Mono — wallet amounts, streaks, stats |

### 4.3 Logo Direction

> **⚠ NOTE:** The logo and branding assets referenced in earlier drafts are no longer applicable. Branding is being updated separately by the creative team. This section reflects current direction only.

### 4.4 Design Principles

- Mobile-first, clean, and spiritual in aesthetic
- Dark-capable UI with warm, faith-inspired tones
- Accessible typography and inclusive iconography
- Infinite scroll patterns optimised for engagement without distraction

---

## 5. Platform Type & Architecture

Progressive Web App (PWA) — runs in a browser, installable to home screen, supports push notifications via Firebase Cloud Messaging service worker.

- Native iOS/Android app is out of scope for V1
- PWA-first enables fast launch, no app store approval needed, and works on low-end Android devices common among target users

---

## 6. User Roles

| Role | Description |
|---|---|
| Visitor | Unauthenticated — can view public ministry profiles |
| Believer | Registered user, primary app user |
| Community Leader (Tier 1) | Self-declared fellowship leader — gray badge, can collect offerings |
| Verified Minister (Tier 2) | Blue badge — basic verification, can collect offerings |
| Trusted Minister (Tier 3) | Gold badge — advanced verification, priority placement |
| Admin | Platform operator |

---

## 7. Core Features — V1 Launch (Month 0–3)

### 7.1 Paystack Payment Integration

> Users buy in-app coins with real money via Paystack. All platform payments use in-app coins (tithe, offerings, seeds, gifts, bookings, etc.). Webhook-verified, server-side balance management only.

- Users buy coins with real money via Paystack
- Webhook-verified, server-side balance management only
- Paystack integration for all giving, fees, and subscriptions

### 7.2 Anonymous Prayer Request Feed

- Any authenticated user can post a prayer request
- User chooses: Public with name OR Fully anonymous
- Feed is chronological — no algorithm, no sorting
- Other users tap "Praying for you" — requester gets notification
- Users can leave comments on prayer requests
- Campus minister can see user's real name behind anonymous requests (for follow-up)
- Peers only see "Anonymous Member" for anonymous posts
- No ads on this feed

### 7.3 Prayer Streak Counter & Daily Check-In

- User prays for 5 minutes → taps "I prayed today" once per day
- Streak counter increments; resets if missed
- Leaderboard shows top streakers in each fellowship
- Daily check-in requires: reading verse + answering 1 reflection question + tapping "I prayed"
- Campus pastor can see each member's streak — accountability feature

> **⚠ NOTE:** The ₦500 missed streak penalty has been permanently removed from the platform.

### 7.4 Daily Bible Verse & Devotional

Daily Bible verse drops at 5:30 AM WAT every day.

> **⚠ NOTE:** Scripture API integration has been ruled out. Bible content will be curated and published manually by the 9th Hour team. This ensures quality, denominational sensitivity, and editorial control.

- Verse of the Day with short devotional context
- Manual curation by internal content team — admin can manually override verse
- Push notification at 5:30 AM WAT
- Daily Bible Quiz — a short interactive quiz tied to the day's scripture or devotional theme
- Part of daily check-in flow
- No ads on daily verse

### 7.5 Live Streaming & Church Services

- Minister profiles with live sessions powered by Agora RTC (unlimited duration)
- Users browse active/upcoming sessions
- In-session chat (structured — prayer requests go to minister queue, not public chat)
- Real-time viewer count
- Gifting system during live sessions — users send animated gifts (Bronze/Silver/Gold/Diamond)
- Attendance tracking — minister sees who missed live sessions
- Post-stream follow-up messages sent to attendees after each session
- Offline access for poor connectivity — audio-only mode, sermons downloadable as audio for free, works on 2G
- No ads during live sessions
- Pasting of account details during live sessions is NOT allowed unless the minister is Tier 1+ or pays for the feature

### 7.6 Tithe & Offerings

> **v2 OVERRIDE:** v2 PRD supersedes the Full PRD on all fee rates. The 0% fee on tithe/offerings from the Full PRD is overridden. v2 applies a 3% transaction fee on all tithes and offerings charged to the giver, plus a 7% withdrawal fee when the pastor withdraws their balance.

- Give button present during all live sessions
- Preset amounts: ₦500, ₦1,000, ₦5,000 + "Other" (custom input)
- Tithe transaction fee: 3% per transaction charged to the giver
- Offering transaction fee: 3% per transaction charged to the giver
- Receipt emailed with explicit fee breakdown
- Minister's pending balance credited instantly
- Withdrawal fee: 7% on each withdrawal by the pastor/minister
- Tier 1 ministers can collect both tithes AND offerings
- All tiers can accept tithes and offerings
- No ads during giving flows

### 7.7 Fellowship Feed

- Each campus fellowship has a private feed
- Chronological — no algorithm, no sorting
- Only verified members see the feed
- Content types: prayer points, announcements, testimonies, check-in updates
- Every announcement seen by every member — no suppression
- Minister/admin can post; members can post with moderation
- A ministry/church can choose to have its page private — only for verified members
- Infinite scroll on the main feed for seamless content browsing
- Ads allowed between posts

### 7.8 Airtime & Data Purchase

- Students can buy airtime and data within the app using in-app coins
- Standard margin (to be defined in infrastructure spec)

### 7.9 Anonymous Vulnerability Feature

**Problem:** "I have a secret struggle I cannot tell anyone, but I desperately need prayer and help."

**9th Hour Solution:**

1. User taps "Anonymous Prayer Request"
2. Types struggle (e.g., "I am struggling with pornography")
3. Request goes to: Fellowship feed (anonymous to peers), Campus minister (sees user's name, can follow up), Prayer team members (anonymous to them)
4. Within 1 hour: people tap "Praying for you," minister sends private message, user realises they are not alone

This is impossible on Facebook, TikTok, Instagram, or YouTube.

### 7.10 Physical-to-Digital Bridge Features

- Prayer Request to Minister — Student taps "Request Prayer" in app → minister prays at next physical service → user notified
- Testimony of the Week — Student posts testimony in app → if selected, announced at physical fellowship + reward
- Offering Goal Thermometer — Physical screen shows "App offerings this week: ₦50,000" → students see real-time impact

### 7.11 User Complaints & Reporting System

- Report button on: ministers, testimonies, prayer requests, feed posts, live sessions
- Report categories: fraud, false doctrine, harassment, inappropriate content
- Reports go to admin queue for review
- Complaint ratio monitoring: >5 complaints in 30 days → suspension

### 7.12 Admin Dashboard (Manual Minister Verification)

- V1 verification is manual — admin reviews submitted documents
- Admin can: approve, reject (with reason), suspend, restore ministers
- Admin sees: complaint counts, withdrawal patterns, verification status
- Admin can set minister tier (1/2/3)
- Admin can manage daily verse overrides

### 7.13 Push Notifications (Firebase Cloud Messaging)

- Prayer request notifications to ministers — works when app is closed
- Prayer request accepted/declined notification to users
- Live session start notifications to followers
- Streak reminder notifications (daily)
- Fellowship announcements
- Urgent prayer request broadcast — "Pray now for [anonymous] — exam in 1 hour"

---

## 8. Core Features — V2 Phase 1 (Month 4–6)

Revenue targets introduced. Platform begins taking fees on non-tithe transactions.

### 8.1 Project Offering (1.5% fee)

- Building fund, missions, convention contributions
- Progress bar on minister profile showing goal vs raised
- Users contribute with named purpose

### 8.2 Birthday/Thanksgiving Offering (1.5% fee)

- Special offering tied to a minister's or church's event
- User dedicates offering to occasion

### 8.3 Emergency Medical Fund (1.5% fee)

- Church creates urgent need with goal amount
- Progress bar shows donations

### 8.4 Convention/Retreat Registration (₦200–500 flat)

- Event creation by minister
- User pays via in-app coins

### 8.5 Fellowship Feed — Full Completion

- Full fellowship join/leave flow
- Fellowship member list (ministers see all, members see each other)
- Private group structure per campus

### 8.6 Intercessory Teams

- 5-person prayer teams within fellowships
- Team chat inside app
- Each member prays for the other four daily
- Team check-in: tap "I prayed for my team" — visible to teammates

### 8.7 Spiritual Goal Tracker

- User sets a goal: e.g., "Read Bible in 30 days", "Fast weekly for 3 months"
- App tracks progress, sends daily reminders
- Progress visible within fellowship — completion earns badge

### 8.8 Live Prayer Alerts

- Urgent request → notification: "Pray now for [anonymous] — exam in 1 hour"

### 8.9 Exam Prayer Schedule

- Student enters exam dates
- Personalised prayer schedule with daily reminders
- Anxiety reduction — app gives sense of control and spiritual preparation

---

## 9. Core Features — V2 Phase 2 (Month 7–9)

### 9.1 Prophetic Prayer/Counseling Booking (10% fee)

- Minister sets available time slots
- User books slot and pays via in-app coins
- Private live video/audio session inside app
- Session lasts minimum 20 minutes; pastor can extend
- Minister receives payment minus platform fee after session ends
- Booking dashboard: minister sees queue, can cancel; user can cancel for refund

### 9.2 Seed of Faith — Posts Only (10% fee)

Virtual gifts for feed posts and testimonies.

| Seed Type | Price (NGN) | Animation |
|---|---|---|
| Bronze Seed | ₦500 | Small flame or cross |
| Silver Seed | ₦1,000 | Angel wings or dove |
| Gold Seed | ₦2,500 | Glowing cross or open Bible |
| Diamond Seed | ₦5,000 | Heavenly light scene |

### 9.3 Live Session Gifting System (10% fee)

Users send animated gifts during live sessions. Separate from Seed of Faith.

| Gift Type | Price (NGN) | Animation |
|---|---|---|
| Bronze Gift | ₦500 | Small flame or cross |
| Silver Gift | ₦1,000 | Angel wings or dove |
| Gold Gift | ₦2,500 | Glowing cross or open Bible |
| Diamond Gift | ₦5,000 | Heavenly light scene |

- Animation plays 3–5 seconds on screen for all viewers
- Everyone sees: "[User Name] sent a Gold gift!"

### 9.4 Midnight Prayer Chain

- User signs up for 15-minute time slot
- App reminds 5 minutes before; user taps "completed"

### 9.5 Daily Bible Quiz

- 3-question Bible quiz daily
- Correct answers earn badges (no points)
- Leaderboard based on streaks only

### 9.6 Badges & Titles

- "Fire Prayer" (7-day streak)
- "Intercessor" (prayed for 50 requests)
- "Giver" status
- Badges appear next to name in fellowship feed

### 9.7 Fasting Tracker

- User logs fast (start time, end time, type)
- App sends encouragement; public fasting streaks for accountability

### 9.8 Round-Up Giving (0.75% fee)

- Users round up purchases to nearest ₦100 or ₦500
- Difference goes to chosen ministry or cause

### 9.9 Feeding Program (1% fee)

- Users contribute weekly to fellowship feeding fund
- Church reports meals served

---

## 10. Core Features — V2 Phase 3 (Month 10–12)

### 10.1 Faith Clinic (5% fee)

- Minister creates multi-day spiritual intensive (e.g., 3 evenings, 2 hours each)
- Users can gift in the session
- Sessions are live and public — anyone can see notification and choose to join
- Includes downloadable materials, prayer points, prophetic declarations

### 10.2 Live Session Recording (Premium Service)

- Sermon recording and archive — permanent storage
- Included in single premium package

### 10.3 Gospel Artist Profiles

- Dedicated space for gospel artists, separate from but visually consistent with minister profiles
- Profile fields: artist name, bio, ministry description, links to music, social media
- Artists can post content, share releases, and engage with the community
- Searchable and discoverable within the platform directory

### 10.4 Testimony Page

Users can share testimonies with the community. The testimony page supports rich media:

- Text testimonies
- Video uploads
- Photo/image uploads
- Community reactions and encouragements

---

## 11. Minister Verification System

### 11.1 Tier 1 — Community Leader

- Self-declared, no verification required
- Gray "Community Leader" badge
- Can: post prayers, share testimonies, host small groups
- Can collect offerings

### 11.2 Tier 2 — Verified Minister (Blue Badge)

V1: Manual admin review. Documents required:

- Full name (as used in ministry), church name, physical address
- Denomination (or "Independent")
- Phone number
- Government ID (National ID, Driver's License, Voter's Card, or Passport)
- Photo of themselves

V1 human review (~5 minutes): church name legitimacy, address on Google Maps, ID authenticity, face match.

**Probation period (30 days after approval):**

- Offerings held 7 days before payout
- Max offering per session: ₦50,000; max withdrawable during probation: ₦100,000 total
- "New Minister" warning badge on profile — removed after 30 days clean

### 11.3 Tier 3 — Trusted Minister (Gold Badge)

All of Tier 2 plus:

| Additional Check | How It Works |
|---|---|
| Denominational confirmation | Call denomination office to confirm affiliation |
| Social media presence | 1+ year of consistent church content on Facebook/YouTube showing real services |
| Bank account verification | Church bank account name matches church name — test deposit (₦50) to confirm |
| Video interview (5 minutes) | "Tell us about your ministry. Show us your church." Record for records |

Timeline: 2–7 days. Cost to platform: ~₦2,000–₦5,000 per pastor.

### 11.4 Community Verification (No Documents)

For rural pastors with no government ID or bank account:

| Step | How It Works |
|---|---|
| 1 | Pastor asks 10 congregation members to download app and "vouch" for them |
| 2 | Each member submits: "I attend [Church Name] pastored by [Name]. I confirm this is my pastor." |
| 3 | Members must have been on app for at least 7 days (prevents fake accounts) |
| 4 | If 10 unique members vouch, pastor gets Tier 2 verification (limited: max offering ₦20,000 per session) |
| 5 | After 90 days with no complaints, upgrade to full Tier 2 |

Cost: ₦0 — members do the verification work.

### 11.5 Ongoing Monitoring

| Method | Frequency |
|---|---|
| User reports (fraud, false doctrine, harassment) | Real-time |
| Complaint ratio (>5 complaints in 30 days → suspension) | Daily |
| Verification badge expiry (renew annually) | Yearly |

### 11.6 What Users See on Minister Profile

| Field | Visible? |
|---|---|
| Verification badge (Blue/Gold/None) | Yes |
| Date verified | Yes |
| Church physical address | Yes (optional hide for security) |
| Denomination | Yes |
| Number of complaints (last 30 days) | Yes ("0 complaints") |
| Member count | Yes |
| Government ID details | Admin only |
| Phone number | Admin only (optional: show if minister agrees) |
| Exact home address | Admin only |

---

## 12. Prayer Systems

### 12.1 Uber-Style Prayer Request System

**User Side**

1. Tap "Request Prayer"
2. Choose: Urgent / General / Confidential
3. Type request
4. Tap "Send to available minister"

**Minister Side**

1. Push notification (works with app closed via FCM)
2. Shows: "Prayer request from [Name] — Urgent"
3. Tap "Accept" or "Decline"
4. If accepted: private chat opens (text only in V1)

**If No Response in 5 Minutes**

- Broadcast to all online ministers in the fellowship
- User notification: "Your request is being prayed for by multiple ministers"

**Post-Request**

- User receives: "[Minister Name] prayed for you"
- Minister can send follow-up message: "How are you feeling now?"
- User rates the session (1–5 stars)
- Minister earns "Faithful Servant" badge after 100 accepted requests

Platform fee: ₦0 — this is a free service to build trust.

### 12.2 Prayer Requests During Live Sessions

1. User types prayer request in chat
2. Request goes to minister queue (NOT public chat)
3. Minister sees requests on their dashboard overlay
4. Minister selects a request and reads it aloud
5. Minister prays for that person by name (or anonymously if requested)
6. User receives notification: "The minister prayed for your request"

**User Options When Submitting**

- Pray for me publicly (minister reads my name)
- Pray for me anonymously (minister reads "someone requested prayer for...")
- This is urgent (priority queue)

**Minister Dashboard During Live Session**

| Element | Description |
|---|---|
| Prayer request queue | List of incoming requests with timestamps |
| "Read aloud" button | Highlights request for minister to read |
| "Prayed" button | Removes from queue, notifies user |
| "Later" button | Saves request for after session |

**Post-Stream Follow-Up**

- Post-stream summary to minister
- Message attendees directly

### 12.3 Public Prayer Wall

- Users post prayer requests for community intercession
- Live prayer alerts — real-time notification when a user in distress submits a live prayer request
- Midnight prayer chain — organised midnight intercession sessions with participant coordination

---

## 13. Monetisation & Fee Structure

### 13.1 Minister Tier Structure

| Tier | Included Features |
|---|---|
| Free Tier | Basic access — feed with ads, prayer wall, daily verse, limited giving |
| Tier 1 (Bronze / Community Leader) | Collect tithes & offerings, post-stream messages, attendance tracking, no ads, reduced fees |
| Tier 2 (Silver / Verified Minister) | All Bronze + advanced analytics, featured placement, gospel artist profile boost |
| Tier 3 (Gold / Trusted Minister) | All Silver + priority verification, dedicated support, platform co-branding options |

### 13.2 Fee Schedule

> **v2 OVERRIDE:** v2 PRD supersedes the Full PRD on tithe/offering fee rates. The Full PRD's "0% fee on tithe and normal offerings" is overridden by v2. The fee structure below is authoritative.

| Fee Type | Rate / Policy |
|---|---|
| Tithe transaction fee | 3% per transaction — charged to the giver |
| Offering transaction fee | 3% per transaction — charged to the giver |
| Pastor/Minister withdrawal fee | 7% on each withdrawal of collected tithes/offerings |
| Project/Special offerings | 1.5% per transaction (Phase 1+) |
| Prophetic prayer/counseling booking | 10% per booking (Phase 2+) |
| Seed of Faith (posts) | 10% (Phase 2+) |
| Live session gifting | 10% (Phase 2+) |
| Round-up giving | 0.75% (Phase 2+) |
| Feeding program | 1% (Phase 2+) |
| Faith Clinic | 5% (Phase 3+) |
| Premium package (3-monthly) | ₦50,000 per 3 months (Phase 3+) |
| Uber-style prayer request | ₦0 — permanently free |
| Airtime & Data purchase | Standard margin (to be defined in infrastructure spec) |

### 13.3 Revenue by Phase

| Phase | Revenue Sources |
|---|---|
| Phase 0 (Month 0–3) | 3% tithe/offering fee + 7% withdrawal fee + Google AdSense on feeds |
| Phase 1 (Month 4–6) | Phase 0 + 1.5% project/special offerings + ₦200–500 flat for events |
| Phase 2 (Month 7–9) | Phase 1 + 10% bookings/gifting/seeds + 0.75% round-up + 1% feeding |
| Phase 3 (Month 10–12) | Phase 2 + 5% Faith Clinic + ₦50,000 per 3 months premium package |

### 13.4 Premium Services Package (Single Package, 3-Monthly Billing)

| Service | Description |
|---|---|
| Donor CRM & export | Required for end-of-year tithe statements |
| Push notification to followers | Increases session attendance by 40–60% |
| Sermon recording & archive | Permanent storage |
| Remove "Powered by 9th Hour" | Professional appearance; minister's brand only |
| Priority support & setup | Emergency insurance for live session failures |
| Advanced analytics | Heatmaps, follower growth, engagement scores |
| Team access (3–5 admins) | Assistant pastor, treasurer, media team |
| Custom ministry landing page | [ministername].9thhour.app with custom branding |
| Offering goal tracker | Progress bar on profile; increases offerings |
| Bulk SMS to followers | Pay-per-use (₦4/SMS) — reaches members without smartphone or data |
| Export all data | One-time export — minister owns their data |

### 13.5 Free Features for Ministers (Forever)

These are permanently free. No freemium, no bait-and-switch.

- Verified minister profile (photo, bio, denomination, location, service times, follower count)
- Unlimited live sessions (real-time chat, viewer count)
- In-session offerings and gifting system
- Basic giving dashboard (list of transactions per session, total received, basic CSV export)
- Testimonies on profile
- Follow system (follower count, list of followers — names only, no contact info)
- Daily Bible verse displayed on minister's profile and believer dashboard
- One-on-one believer messaging (in-app — text only)
- Schedule sessions (title, description, category, time; appear in browse feed)
- Public ministry page (anyone can view minister's profile, upcoming sessions, past offerings)
- Basic moderation tools (block user, hide testimony, end session early)
- Prayer request notifications (works when app is closed; accept/decline)

---

## 14. Content Policies & Moderation

### 14.1 Ad Policy

> **v2 OVERRIDE:** v2 PRD supersedes the Full PRD on ad placement. The Full PRD allowed ads on minister profile pages. v2 restricts ads to feeds only. No ads on minister profile pages.

- Ads appear on the community feed only — between posts
- No ads during live sessions, prayer sessions, giving flows, devotionals, or counseling
- No ads on the Anonymous Prayer Request Feed
- No ads on minister profile pages
- Paid tier users (any paid tier) see zero ads

### 14.2 Prohibited Content

- Account/bank details shared in live sessions (unless Tier 1+ or feature-paid)
- Non-faith-aligned commercial promotion
- Unverified spiritual claims or false prophecy
- Content that incites disunity among denominations
- Memes, politics, gossip — only prayer, testimony, teaching, giving

### 14.3 Feed Rules

- No algorithmic feed — ever. All feeds are chronological
- No memes, no politics, no gossip

### 14.4 Moderation Principles

- Community reporting tools available to all users
- Admin review required for all flagged content within 24 hours
- Ministers are accountable for content posted under their profile
- Complaint ratio monitoring: >5 complaints in 30 days → suspension

---

## 15. Technical Requirements

### 15.1 Infrastructure

> Agora RTC is confirmed as the real-time communication provider for live sessions (unlimited duration).

| Component | Decision |
|---|---|
| Payment | Paystack — users buy in-app coins with real money; all platform payments use coins |
| Bible/Devotional content | Manually curated — no external scripture API |
| Real-time communication (RTC) | Agora RTC (confirmed) — unlimited duration live sessions |
| Push notifications | Firebase Cloud Messaging (FCM) |
| DNS | Cloudflare + Namecheap/Porkbun recommended |
| Backend stack | To be defined in infrastructure spec |
| Email receipts | Resend |
| Face verification | Amazon Rekognition or Face++ (V2) |

### 15.2 Feed & UX

- Infinite scroll implemented on all main feeds
- Push notifications required for: Daily verse (5:30 AM WAT), live prayer alerts, midnight prayer chain
- Attendance tracking hooks tied to live session entry/exit events

### 15.3 Content Storage

- Testimony page requires support for video and image uploads
- Gospel artist and minister profiles require media hosting for profile images and links
- Video storage and streaming infrastructure to be scoped in technical spec

---

## 16. Non-Negotiables (Superseding Policies)

> **⚠ NOTE:** This section supersedes ALL prior PRD versions including the Full 9th Hour PRD. Where any conflict exists between the Full PRD and v2, v2 takes precedence without exception.

1. Infinite scroll is required on all community and content feeds
2. The primary audience segment is defined by university affiliation, not by country
3. The daily verse drops at exactly 5:30 AM WAT — no exceptions
4. Bible content is manually curated. Scripture API integration is not permitted
5. Ads appear on feeds only — no ads in live sessions, prayer, giving, devotional flows, or minister profile pages
6. Paid tier users see zero ads
7. No algorithmic feed — ever. All feeds are chronological
8. Tithe transaction fee is 3% per transaction charged to the giver — the Full PRD's 0% tithe fee is overridden
9. Offering transaction fee is 3% per transaction charged to the giver
10. Withdrawal fee for pastors is 7% on each withdrawal
11. The ₦500 missed streak penalty is permanently removed
12. Pasting account details during live sessions is blocked unless the minister is Tier 1+ or pays for the feature
13. The testimony page must support both video and photo/image uploads
14. Gospel artists must have a dedicated profile space, separate from but consistent with minister profiles
15. All payments are made via in-app coins — users buy coins with real money via Paystack and use coins to access all paid services
16. No memes, no politics, no gossip — only prayer, testimony, teaching, giving
17. Agora RTC is the confirmed real-time communication provider for live sessions
18. AI integration for minister search is planned for a future release, not MVP
19. Old logo/branding references are superseded — use updated branding assets from the creative team

---

## 17. Success Metrics

| Metric | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Daily active users (DAU) | 500 | 2,000 | 10,000 |
| Average prayer streak length | 7 days | 21 days | 30 days |
| Sessions per user per day | 2x | 4x | 5x |
| Fellowship adoption rate | 40% | 80% | 90% |
| Prayer requests per day | 50 | 200 | 1,000 |
| Verified ministers (Tier 2) | 10 | 20 | 100 |
| Verified ministers (Tier 3) | — | 5 | 20 |
| Monthly transaction volume | — | ₦5M | ₦50M |
| Active fellowships | — | 10 | 50 |
| 30-day churn | <40% | <20% | <10% |

---

## 18. Out of Scope — V1

| Feature | Reason |
|---|---|
| Native mobile app (iOS/Android) | PWA first |
| Sermon/audio archive library | Phase 3 |
| Multi-language support | Phase 3 |
| Automated minister payouts | Admin-triggered manual V1 |
| Face verification automation | V2 upgrade |
| Giving history export | Premium service |
| Points system | Removed |
| QR code | Removed |
| Skill Acquisition Program | Removed |
| Widow/Orphan Support | Removed |
| USSD/Airtime Giving | Removed |
| Advanced analytics | After launch |
| SMS/USSD | Phase 3 |
| Premium services | Add after launch |
| Live session recording | Premium service |
| In-app coin/virtual currency system | Included — in-app coin system is part of the platform |

---

## 19. Future Roadmap

| Feature | Description |
|---|---|
| AI Minister Search | Brief AI-generated bio appears when a user searches for a minister or gospel artist |
| Expanded Giving | Peer-to-peer giving, fundraising campaigns for campus ministries |
| Community Groups | Private group spaces for campus fellowships and prayer cells |
| Sermon Archive | Searchable library of past live sessions and sermons |
| International Expansion | Platform expansion once core product is validated |
| Discipleship Tracks | Structured Bible study and spiritual growth pathways |
| Multi-language Support | Phase 3 expansion |
| Native Mobile Apps | iOS/Android after PWA is validated |
| Automated Face Verification | Amazon Rekognition or Face++ integration |

---

*9th Hour — Product Requirements Document v2.0*

*Confidential. Internal use only. © THE CJ BRAND 2026.*
