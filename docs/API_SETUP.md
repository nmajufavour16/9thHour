# 9TH HOUR — API CONNECTIONS & SETUP GUIDE

**Version:** 4.0 (Decoupled Architecture)
**Author:** 9th Hour Architecture Team
**Last Updated:** June 2026

Complete this guide in full before initializing the Monorepo. Every service must be active with real credentials before the Node.js backend or Next.js frontend can run successfully.

---

## 1. ARCHITECTURE ROUTING (The BFF Pattern)

Since Next.js acts as a proxy to hide your backend URL, you must establish a secure handshake between them.

1. Generate a strong random string (e.g., `openssl rand -hex 32`).
2. Set this string as the `INTERNAL_COMMUNICATION_KEY` in **both** your Next.js `.env.local` and your Node.js `.env`.
3. The Node.js server must be configured to reject *any* incoming HTTP request that does not include this key in its headers, UNLESS the request is coming from an external webhook (like Paystack).

---

## 2. MONGODB ATLAS (Primary Database)

MongoDB holds your entire application state, ledgers, and feeds.

1. Go to **mongodb.com** → Sign in to Atlas.
2. Create a new Cluster (M0 Free Tier is fine for dev; upgrade to M10+ for production).
3. **Network Access:** Go to Security → Network Access.
   - *For Dev:* Add your current IP address.
   - *For Prod:* Add the static IP addresses of your deployed Node.js backend (e.g., Railway/Render static IPs). Do not leave it open to 0.0.0.0/0.
4. **Database Access:** Create a database user. Auto-generate a secure password.
5. Get your Connection String (URI). It will look like: `mongodb+srv://<username>:<password>@cluster0...`
6. Save this to your Node.js `.env` file as `MONGODB_URI`. **Never put this in the Next.js frontend.**

---

## 3. FIREBASE (Auth & Admin SDK)

Firebase is used *only* for Authentication and Cloud Messaging (Push Notifications). Database (Firestore) is strictly disabled for this build.

### Client Setup (For Next.js)

1. Go to **console.firebase.google.com** → Create project `9thhour-auth`.
2. Disable Google Analytics.
3. Enable **Authentication** (Email/Password & Google OAuth).
4. Register a Web App and copy the `firebaseConfig`. These become your `NEXT_PUBLIC_FIREBASE_*` variables in the Next.js `.env.local`.

### Admin SDK Setup (For Node.js)

1. In Firebase Console → Project Settings → Service Accounts.
2. Click **Generate new private key** and download the JSON file.
3. Open the JSON file. Extract the `project_id`, `client_email`, and `private_key` (including all `\n` line breaks).
4. Add these exactly as they appear into your Node.js `.env` file. The Node server will use these to verify JWTs sent by the Next.js proxy.

---

## 4. PAYSTACK (Inbound Money)

Paystack handles Wallet Funding and direct Tithes/Offerings.

1. Go to **dashboard.paystack.com**.
2. Go to Settings → API Keys & Webhooks.
3. Copy the **Secret Key**. Add this to your Node.js `.env`. (The Next.js frontend does not need Paystack keys; the Node server initializes all transactions).
4. **Webhook URL:** Set this to point directly to your Node.js server, NOT Next.js.
   - *Dev:* `https://<your-ngrok-url>/webhooks/paystack`
   - *Prod:* `https://api.9thhour.live/webhooks/paystack`

---

## 5. FLUTTERWAVE (Outbound Airtime/Data)

Flutterwave is used strictly as a utility API for purchasing Airtime and Data using in-app coins.

1. Go to **flutterwave.com** → Dashboard → Settings → API Keys.
2. Copy the **Secret Key** and add it to your Node.js `.env`.
3. Create a custom Secret Hash (e.g., `9TH_HOUR_FLW_SECRET_99`).
4. Set your Webhook URL pointing to Node.js: `https://api.9thhour.live/webhooks/flutterwave`.
5. Enter your Secret Hash in the Flutterwave dashboard and add it to your Node.js `.env`. Your Node server must verify this hash on every incoming webhook to prevent fraud.

---

## 6. AGORA RTC (Live Streaming)

Agora provides the video/audio infrastructure. Tokens are generated strictly on the Node.js backend.

1. Go to **console.agora.io**.
2. Create project: `9thhour` (Must select **Secured Mode**, which requires tokens).
3. Copy the **App ID**. This goes in *both* your Next.js `.env.local` and your Node.js `.env`.
4. Copy the **App Certificate**. This goes *only* in your Node.js `.env`.
5. Enable **Agora Cloud Recording** (if Phase 3 Premium Sermon Archives are needed later).

---

## 7. RESEND (Transactional Emails)

1. Go to **resend.com** → API Keys → Create API Key.
2. Add this to your Node.js `.env`.
3. Go to Domains → Verify your domain (e.g., `9thhour.live`).
4. Set your Sender Email in Node.js `.env` to `noreply@9thhour.live`.

---

## STARTUP SEQUENCE (Local Development)

Because of the decoupled architecture, you must start both servers to run the app.

```bash
# Terminal 1: Start the Node.js Backend
cd apps/api
npm install
npm run dev
# Runs on localhost:4000

# Terminal 2: Start the Next.js Frontend
cd apps/web
npm install
npm run dev
# Runs on localhost:3000
```
