# 9th Hour

> "9th Hour — the hour of prayer is now."

Faith-community platform. BFF monorepo architecture: Next.js 14 frontend, dedicated Node.js/Express backend, MongoDB Atlas.

## Structure

```
/apps/web   — Next.js 14 (App Router, TypeScript, Tailwind, dual theme)
/apps/api   — Node.js + Express + Mongoose + Socket.io (Phase 7+)
```

## This Scaffold Covers Phase 1 of AGENT_PROMPT.md

- ✅ npm workspaces monorepo
- ✅ Next.js 14 app with dual-theme system (dark default, white/gold light) wired into Tailwind via CSS variables
- ✅ Brand fonts: Playfair Display, DM Sans, JetBrains Mono
- ✅ BFF proxy route (`/apps/web/src/app/api/proxy/[...path]/route.ts`)
- ✅ Express skeleton with helmet, rate limiting, and the internal-key auth guard (`/webhooks/*` exempted)
- ✅ MongoDB connection config (`apps/api/src/config/db.ts`)
- ✅ `.env.example` for both apps
- ✅ Both apps verified: zero TypeScript errors, zero ESLint errors

## What's NOT Here Yet

Everything from Phase 2 onward in `AGENT_PROMPT.md` — auth sync, Mongoose models, the financial integrity engine, Agora, Socket.io, Paystack/Flutterwave webhooks. These need live credentials (Firebase, MongoDB Atlas, Paystack, Agora, Resend) and a persistent dev environment — continue this build in Cursor or your local IDE of choice.

## Getting Started

```bash
npm install              # installs both workspaces from root
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Fill in real credentials, then:
npm run dev:api          # terminal 1 — localhost:4000
npm run dev:web          # terminal 2 — localhost:3000
```

## Reference Documents

Build phases 2–9 are fully specified in `/docs`:
- `AGENT_PROMPT.md` — phase-by-phase build plan
- `TRD.md` — architecture, financial integrity engine
- `SCHEMA.md` — all Mongoose models
- `UIUX_FLOW.md` — design system, screens
- `PRD_ADDENDUM.md` — coin exchange rate spec
- `9TH_HOUR_FINAL_PRD.md` — client-authoritative product spec
- `API_SETUP.md` — external service credential setup

## Working in Cursor

`.cursor/rules/9th-hour-core.mdc` is already in this repo and loads automatically
on every Agent conversation — it encodes the financial integrity rules and phase
discipline so you don't need to re-explain them each session.

To start Phase 2:
1. Open this folder in Cursor.
2. Open Agent mode (not inline chat — Agent can edit multiple files and run terminal commands).
3. Turn off shell command auto-run in Agent settings for this repo — review before it runs anything against the ledger.
4. `@docs/AGENT_PROMPT.md` in your message, tell it Phase 1 already exists and is verified, and ask it to begin Phase 2.
5. Stop it after each phase. Review the diff. Commit. Then continue.

