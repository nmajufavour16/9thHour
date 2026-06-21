# 9TH HOUR — UI/UX DESIGN FLOW

**Version:** 5.0 (Dual Theme)
**Author:** 9th Hour Design Team
**Last Updated:** June 2026

---

## Design Language

### Visual Identity

**The Digital Temple.** The platform feels deep, focused, and free from distraction. It replaces the noise of general social media with a purpose-built environment for spiritual growth.

### Theme System

9th Hour ships with **two themes**: Dark (default) and Light. Layout, component structure, and spacing are identical across both — only color token values change. The agent should implement this via a `data-theme="dark" | "light"` attribute on the root element, with Tailwind CSS variables resolving accordingly. Dark is the brand-primary experience; Light is a user-selectable preference in Settings, intended for daytime use and accessibility needs.

---

### Dark Theme (Default)

```css
[data-theme="dark"] {
  --color-bg-primary:     #0A0A14; /* near black, purple-tinted */
  --color-bg-surface:     #13131F; /* card/panel */
  --color-bg-elevated:    #1A1A2E; /* modals, overlays */
  --color-primary:        #6D28D9; /* primary actions, CTA */
  --color-primary-light:  #8B5CF6; /* hover states, highlights */
  --color-gold:           #C9A84C; /* offerings, badges, premium */
  --color-gold-light:     #E8B86D; /* warm accents */
  --color-text-primary:   #F5F3FF; /* warm white, purple-tinted */
  --color-text-secondary: #A89FC0; /* muted labels */
  --color-text-muted:     #5C5272; /* placeholders, disabled */
  --color-live:           #E53E3E; /* live badge */
  --color-success:        #48BB78;
  --color-error:          #F56565;
  --color-border:         #2A2040;
}
```

---

### Light Theme — White & Gold

```css
[data-theme="light"] {
  --color-bg-primary:     #FFFFFF; /* clean white */
  --color-bg-surface:     #FAF8F3; /* warm off-white, card/panel */
  --color-bg-elevated:    #FFFFFF; /* modals — pure white, lifted with shadow */
  --color-primary:        #6D28D9; /* same brand purple — kept for recognition */
  --color-primary-light:  #7C3AED; /* slightly deeper for contrast on white */
  --color-gold:           #B8923F; /* deepened gold — needs more weight on white */
  --color-gold-light:     #C9A84C; /* original gold now used as the lighter accent */
  --color-text-primary:   #1A1426; /* near-black, purple-tinted (inverse of dark bg) */
  --color-text-secondary: #6B5F7A; /* muted purple-gray */
  --color-text-muted:     #9B92A8; /* placeholders, disabled */
  --color-live:           #E53E3E; /* unchanged — semantic colors stay constant */
  --color-success:        #2F9E5B; /* deepened slightly for contrast on white */
  --color-error:          #DC3545; /* deepened slightly for contrast on white */
  --color-border:         #E5E0EC; /* soft lavender-gray */
}
```

**Why gold shifts darker in light mode:** `#C9A84C` and `#E8B86D` were tuned for contrast against near-black. On white, both read as washed-out and fail accessible contrast ratios for text/badge use. `#B8923F` keeps the same gold identity at a luminance that holds up against `#FFFFFF`. The original lighter gold (`#C9A84C`) is repurposed as the secondary accent rather than dropped.

**Why purple stays nearly identical:** Brand primary colors should survive a theme switch — it's how users recognize the product is still 9th Hour. Only a marginal deepening (`#6D28D9` → `#7C3AED` for hover/light variant) was needed to keep WCAG AA contrast on white backgrounds.

**Component-level notes for Light Theme:**
- Card borders (`--color-border`) need to carry more visual weight on white than the near-invisible dark-mode border does on black — hence the visible lavender-gray rather than a near-transparent tint
- Gold offering/badge elements should use `--color-gold` (deepened) as the fill, never the lighter `--color-gold-light` directly on white — too low contrast for small badge text
- The Live badge, Success, and Error colors are semantic/status colors and intentionally stay near-constant across both themes — users learn "red = live" once, it shouldn't change meaning when they switch themes

---

### Typography (Unchanged Across Themes)

- **Headings:** Playfair Display (600, 700) — Sacred weight.
- **Body/UI:** DM Sans (400, 500, 600) — Clean, readable.
- **Currency/Streaks:** JetBrains Mono — Technical clarity.

---

## Screen Inventory

**PUBLIC**
- Welcome / Auth (Register/Login)
- Ministry Profile *(public — viewable by anyone, per PRD §13.5 "Public ministry page")*

**BELIEVER (Authenticated)**
- Home Dashboard (Daily Verse, Active Sessions, Streak)
- Discover *(browse active/upcoming sessions and minister profiles — per PRD §7.5)*
- Fellowship Feed (Chronological, Infinite Scroll)
- Live Session View (Agora Video + Chat + Giving)
- Wallet Hub (Fund via Paystack, Buy Airtime via Flutterwave)
- Uber Prayer Dispatch (Urgent Request Modal)
- Testimony / Vulnerability Post

**MINISTER (Authenticated)**
- Ministry Hub (Stats, Withdrawal, Session Scheduling)
- Go Live Control Room (Preview, Gifting overlay, Prayer Queue)

> **Note:** *Discover* and the public-facing *Ministry Profile* screen were missing from the v4.0 inventory despite being explicit V1 requirements in PRD §7.5 and §13.5. Added back here — no other screen behavior changes.

---

## ASCII Wireframes

*Layout is theme-agnostic — the wireframes below render identically in both Dark and Light; only token values swap. Shown once per screen rather than duplicated per theme.*

### 1. Home Dashboard (Mobile First)

```
┌─────────────────────────────────────┐
│ [Menu]   9TH HOUR      [Wallet: ₦0]  │
├─────────────────────────────────────┤
│                                       │
│ [🔥 7 Day Streak] [✓ Checked in today]│
│                                       │
│ ┌───────────────────────────────┐    │
│ │ 📖 TODAY'S WORD                │    │
│ │ "Peter and John went to the    │    │
│ │  temple at the ninth hour..."  │    │
│ │  — Acts 3:1                    │    │
│ └───────────────────────────────┘    │
│                                       │
│ 🔴 HAPPENING NOW                     │
│ [Session Card: NIFES Fellowship]     │
│                                       │
│ [🙏 Submit Urgent Prayer Request]    │
│                                       │
├─────────────────────────────────────┤
│ [🏠 Home] [🔍 Discover] [👥 Feed] [🔴 Live] [👤 Profile] │
└─────────────────────────────────────┘
```

### 2. Live Session (Interactive Flow)

```
┌─────────────────────────────────────┐
│ [←] NIFES Fellowship      🔴 142     │
├─────────────────────────────────────┤
│                                       │
│      [ VIDEO STREAM PORTION ]        │
│      (Audio-fallback logic active)   │
│                                       │
├─────────────────────────────────────┤
│ CHAT & QUEUE                         │
│ @user1: Amen!                        │
│ @user2: Hallelujah                   │
│                                       │
│ [💬 Send Message...]   [🙏 Queue]    │
├─────────────────────────────────────┤
│ GIVE (3% fee applies — shown at checkout) │
│ [₦500] [₦1,000] [₦5,000] [Other]     │
└─────────────────────────────────────┘
```

**Interaction Rule:** If User taps ₦1,000 but Wallet balance is ₦0, slide up an overlay bypassing to the Paystack funding route instantly.

**Fee transparency rule:** Per PRD §7.6, the 3% tithe/offering fee is charged to the giver. The Give modal must show the fee breakdown before confirmation — e.g. "₦1,000 → ₦970 to minister, ₦30 platform fee" — never silently deduct it. Trust is preserved through transparency, not through a 0% rate.

### 3. Utility: Buy Airtime (Flutterwave Integration)

```
┌─────────────────────────────────────┐
│ [←] Buy Airtime & Data               │
├─────────────────────────────────────┤
│ Wallet Balance: ₦2,500                │
│                                       │
│ Select Network:                      │
│ [MTN] [Airtel] [GLO] [9Mobile]       │
│                                       │
│ Phone Number:                        │
│ [ 080...                       ]     │
│                                       │
│ Amount (Coins):                      │
│ [ ₦100 ] [ ₦500 ] [ ₦1,000 ]         │
│                                       │
│ [ Deduct & Send Airtime ]            │
└─────────────────────────────────────┘
```

### 4. Anonymous Vulnerability Post

```
┌─────────────────────────────────────┐
│ [X] Share Vulnerability               │
├─────────────────────────────────────┤
│ "I have a secret struggle I cannot   │
│  tell anyone, but I need prayer."    │
│                                       │
│ [ Describe struggle here...         ]│
│ [                                   ]│
│                                       │
│ Visibility:                          │
│ ◉ Hide my name from peers (Anonymous)│
│   (Only Campus Minister sees real name)│
│                                       │
│ [ Submit Request ]                   │
└─────────────────────────────────────┘
```

### 5. Discover (New — Public Ministry Browse)

```
┌─────────────────────────────────────┐
│ [←] Discover                         │
├─────────────────────────────────────┤
│ [🔍 Search ministers, fellowships...]│
│                                       │
│ 🔴 LIVE NOW                          │
│ [Card] [Card] [Card]  (scroll →)     │
│                                       │
│ UPCOMING SESSIONS                    │
│ [Session Card] [Session Card]        │
│                                       │
│ MINISTERS                            │
│ [✓ Pastor Card] [✓ Pastor Card]      │
│   (Blue/Gold badge shown per tier)   │
└─────────────────────────────────────┘
```

### 6. Ministry Profile (New — Public, Per PRD §13.5)

```
┌─────────────────────────────────────┐
│ [←] [Cover Image]                    │
│ [Avatar] Pastor John Doe  ✓ Tier 2   │
│ Verified since: May 2026             │
│ Church Name, Lagos · Pentecostal     │
│ 0 complaints (last 30 days)          │
│ 1,204 followers              [Follow]│
├─────────────────────────────────────┤
│ UPCOMING SESSIONS                    │
│ [Session Card]                       │
│                                       │
│ TESTIMONIES ON PROFILE               │
│ [Testimony Card]                     │
└─────────────────────────────────────┘
```

---

## UX Non-Negotiables (From PRD v2.0 §16)

1. **Infinite Scroll is Mandatory:** Feeds must load dynamically without pagination buttons.
2. **Chronological Only:** Absolutely no algorithmic sorting of the fellowship feeds.
3. **Ads Placement:** Allowed on community feeds between posts only. **NEVER** in Live Sessions, Prayer flows, Giving flows, Devotionals, or Minister Profile pages. Paid tiers see 0 ads.
4. **Streak Safety:** The historical ₦500 missed-streak penalty is permanently removed. Missing a day simply resets the counter to 0.
5. **Fee Transparency:** The 3% tithe/offering fee and 7% withdrawal fee (PRD §13.2) must always be shown to the user before confirmation — never deducted silently.
6. **Theme Default:** Dark is the default experience on first launch. Light is opt-in via Settings.
