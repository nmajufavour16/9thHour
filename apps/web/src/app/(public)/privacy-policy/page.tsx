import type { Metadata } from "next";
import LegalDocument from "@/components/features/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — 9th Hour",
  description: "How Status Sphere Technologies Ltd. collects, uses, and protects your data on 9th Hour.",
};

const content = `# Privacy Policy

**9th Hour**
A platform operated by Status Sphere Technologies Ltd.
Last Updated: [Insert Launch Date]

---

## Preamble

This Privacy Policy explains how Status Sphere Technologies Ltd. (&#x201C;Status Sphere,&#x201D; &#x201C;the Operator,&#x201D; &#x201C;we,&#x201D; &#x201C;us,&#x201D; or &#x201C;our&#x201D;) collects, uses, discloses, and protects information in connection with your access to and use of 9th Hour, the faith-community platform we operate at 9thhour.live and any associated subdomains or applications (the &#x201C;Platform&#x201D;).

Status Sphere is a Nigerian-incorporated technology company that **operates** the 9th Hour platform. We act as the data controller for the Personal Data described in this Policy in connection with our operation of the Platform, except where this Policy states otherwise.

This Policy should be read alongside our Terms of Service. By using the Platform, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with this Policy, please do not use the Platform.

This Policy is written with reference to the Nigeria Data Protection Act 2023 (&#x201C;NDPA&#x201D;) and the Nigeria Data Protection Commission's General Application and Implementation Directive, and, to the extent applicable to users accessing the Platform from outside Nigeria, principles consistent with internationally recognized data protection standards.

---

## 1. Scope of This Policy

This Policy applies to Personal Data we collect through:

(a) your registration for and use of the 9th Hour Platform, whether via web browser or as an installed Progressive Web App;
(b) your communications with us, including support requests sent to our contact addresses;
(c) your interactions with Live Sessions, Fellowships, the prayer request feed, and other community features;
(d) your financial transactions conducted through the Platform's Wallet system.

This Policy does not apply to third-party websites, applications, or services that may be linked from the Platform, or to the separate privacy practices of third-party service providers such as Paystack, Google (Firebase), or Agora, each of which maintains its own privacy policy governing data it processes directly.

---

## 2. Information We Collect

### 2.1 Information You Provide Directly

**Account Registration Information.** When you register, we collect your full name, your chosen username, your email address, and your password (stored in encrypted/hashed form, never in plaintext), or, if you register via Google OAuth, the profile information shared with us by Google (typically your name, email address, and profile photo, as authorized by you through Google's consent screen).

**Role and Profile Information.** Depending on your selected role (Believer or Minister), we may collect additional information such as your institutional affiliation (for example, a university or campus fellowship), and, for Minister applicants, verification materials including but not limited to government-issued identification, evidence of ministerial standing, ministry or fellowship name, and related supporting documentation.

**Financial Information.** We collect records of your Wallet balance, Coin purchase history, Tithe and Offering transaction history, and, for Ministers, payout request and bank account details submitted for the purpose of receiving payouts. **We do not collect, store, or have direct access to your card number, CVV, bank account login credentials, or other sensitive payment instrument details** &#x2014; these are entered directly into and processed by Paystack (and, for outbound utility payments, Flutterwave), and we receive only transaction confirmations, references, and status updates from these providers via secure webhook.

**User Content.** We collect and store the content you submit to the Platform, including prayer requests (whether submitted under your name or anonymously, as described in Section 5), testimonies, Fellowship posts, comments, and any images or media you upload.

**Communications.** When you contact us, including at help@9thhour.live, support@9thhour.live, or enquiries@9thhour.live, we collect the content of your communication and any information you choose to provide in it.

### 2.2 Information Collected Automatically

**Device and Usage Information.** We and our service providers automatically collect certain technical information when you use the Platform, including your IP address, browser type, device type and operating system, app version, pages or features accessed, timestamps of activity, and crash or error diagnostic data.

**Push Notification Tokens.** Where you enable push notifications, we collect and store a device-specific Firebase Cloud Messaging token used to deliver notifications to your device regarding prayer responses, streak reminders, live session alerts, and similar engagement features.

**Cookies and Similar Technologies.** The Platform may use cookies, local storage, or similar technologies necessary for authentication session management and core functionality. We do not currently use third-party advertising cookies or trackers, consistent with our policy against third-party advertising described in our Terms of Service.

### 2.3 Information from Third Parties

**Google OAuth.** If you choose to register or sign in using Google, we receive the profile information you authorize Google to share with us, as described above.

**Payment Processors.** We receive transaction status, payment confirmation, and limited masked payment metadata (such as the last four digits of a card or the payment channel used) from Paystack and Flutterwave, sufficient to reconcile your Wallet balance and transaction history, without receiving your full payment credentials.

**Other Users.** If another user reports your account or content, refers to you in a Fellowship or live session interaction, or, in the case of a Minister, accesses identifying information behind an anonymous prayer request as described in Section 5, that interaction generates records that form part of the information we hold in connection with your account.

---

## 3. How We Use Your Information

We use the information described above for the following purposes:

### 3.1 To Provide and Operate the Platform

- Creating and maintaining your account;
- Authenticating you at login and verifying your identity via Firebase Authentication;
- Enabling core features including the prayer feed, Live Sessions, Fellowships, daily check-ins, and streaks;
- Processing Wallet top-ups, Tithes, Offerings, and other financial transactions, including the atomic ledger operations necessary to maintain accurate balances;
- Delivering push notifications you have enabled;
- Facilitating Minister verification and managing verification tiers;
- Enabling pastoral follow-up by Ministers in connection with prayer requests, including anonymous requests, as described in Section 5.

### 3.2 To Maintain Safety, Security, and Integrity

- Detecting, investigating, and preventing fraud, abuse, unauthorized access, and violations of our Terms of Service;
- Enforcing our content standards and responding to user reports, including automated flagging where a Minister account accumulates reports from a sufficient number of distinct users;
- Verifying that users meet our minimum age requirement of 18 years and taking corrective action where we discover an account does not meet this requirement, as described in Section 8;
- Maintaining the security of our systems, including the internal authentication mechanisms between our frontend and backend infrastructure.

### 3.3 To Communicate With You

- Sending transactional communications, including offering receipts (which explicitly disclose the platform fee, if any, applied to your transaction), wallet funding confirmations, ministry verification status updates, and prayer notification emails;
- Responding to your support requests and other communications;
- Sending service-related announcements, including changes to this Policy or our Terms of Service.

### 3.4 To Improve the Platform

- Understanding usage patterns to improve features, fix bugs, and inform product development;
- Conducting internal analytics regarding feature engagement, retention, and platform performance.

### 3.5 To Comply With Legal Obligations

- Retaining transaction records as required by applicable Nigerian financial recordkeeping obligations;
- Responding to lawful requests from courts, regulators, or law enforcement;
- Enforcing our Terms of Service and protecting the rights, property, and safety of Status Sphere, our users, and the public.

### 3.6 Legal Basis for Processing

Where the NDPA or other applicable law requires a specified legal basis for processing, we rely on the following, as applicable to the particular processing activity: your consent (for example, where you opt in to push notifications or choose to submit a prayer request anonymously or under your name); the necessity of processing to perform our contract with you (the Terms of Service) and to provide the Platform's core features, including financial transactions; our legitimate interests in operating a safe, functional, and secure Platform, balanced against your rights; and compliance with our legal obligations.

---

## 4. How We Share Your Information

We do not sell your Personal Data. We share information only in the following circumstances:

### 4.1 Service Providers

We share information with third-party service providers who perform services on our behalf, strictly to the extent necessary for them to provide those services:

| Provider | Purpose | Data Shared |
|---|---|---|
| **Paystack** | Wallet funding, payment processing | Transaction amount, your email, payment confirmation data |
| **Flutterwave** | Outbound utility payments (e.g. airtime/data) | Transaction details necessary to fulfill the request |
| **Firebase (Google)** | Authentication, push notifications | Email, authentication tokens, device push token |
| **Agora.io** | Live audio/video session infrastructure | Session participation metadata, audio/video stream data during active sessions |
| **MongoDB Atlas** | Primary database hosting | All Platform data necessary for operation, stored at rest |
| **Resend** | Transactional email delivery | Your email address and the content of transactional emails sent to you |
| **Vercel** | Frontend application hosting | Standard web request/traffic data necessary for hosting |
| **Railway** | Backend application hosting | Standard server request/traffic data necessary for hosting |

Each of these providers is contractually or by policy bound to use the data shared with them only for the purpose of providing their service to us, and not for their own independent marketing purposes, except to the extent their own privacy policy (governing their direct relationship with you, where applicable) provides otherwise.

### 4.2 Within the Platform — Ministers and the Limits of Anonymity

As described in detail in Section 5, certain information you submit, including anonymous prayer requests, may be visible to Ministers with appropriate standing in your fellowship or campus community, for the purpose of enabling pastoral follow-up. This is a core, disclosed feature of how the Platform operates and is not considered third-party sharing for marketing or commercial purposes, but you should understand it as a category of internal disclosure distinct from the general user community.

### 4.3 Legal and Safety Disclosures

We may disclose information where we believe in good faith that disclosure is necessary to: comply with applicable law, regulation, legal process, or governmental request; enforce our Terms of Service; detect, prevent, or address fraud, security, or technical issues; or protect the rights, property, or safety of Status Sphere, our users, or the public, including in connection with suspected illegal activity such as financial fraud or harm to a minor.

### 4.4 Business Transfers

If Status Sphere is involved in a merger, acquisition, reorganization, sale of assets, or similar transaction, Personal Data may be transferred as part of that transaction. We will provide notice to affected users where required by applicable law before Personal Data becomes subject to a different privacy policy as a result of such a transaction.

### 4.5 Aggregated or De-Identified Data

We may share aggregated or de-identified information that cannot reasonably be used to identify you, for purposes such as analytics, research, or business reporting.

### 4.6 With Your Consent

We may share your information with third parties for purposes not described in this Policy where you have given your explicit consent to do so.

---

## 5. Anonymous Prayer Requests: A Specific and Important Disclosure

This section provides a detailed explanation of how data flows when you use the Platform's anonymous prayer request feature, supplementing the disclosure in our Terms of Service.

### 5.1 What &#x201C;Anonymous&#x201D; Means on 9th Hour

When you submit a prayer request and select the anonymous option, your name and username are withheld from the view of **other peer Believers** browsing the prayer feed. To those users, your submission displays only as &#x201C;Anonymous Member.&#x201D;

### 5.2 What &#x201C;Anonymous&#x201D; Does Not Mean

Anonymity under this feature is **not** absolute and does **not** extend to:

(a) **Ministers with appropriate standing in your fellowship or campus community**, who are able to view the real identity behind an anonymous submission. This is an intentional design choice, made to enable meaningful pastoral care and follow-up, which we consider to be a core value proposition of a faith-community platform. It is not an error, bug, or unintended data leak.

(b) **Status Sphere's own internal systems and records.** Regardless of the anonymity setting you select, our database retains the association between your account and every item of User Content you submit, including anonymous prayer requests. This association is necessary for content moderation, abuse prevention, legal compliance, and platform integrity, and is not visible to other users beyond the Minister disclosure described above.

(c) **Disclosure required by law**, including in response to a valid court order or law enforcement request.

### 5.3 Your Choice

If, having understood the above, you are not comfortable with a Minister being able to identify you in connection with a specific prayer request, we recommend you either submit that particular request without including identifying personal detail, or refrain from submitting it through the Platform. The anonymity feature is designed to protect your identity from your peer community, not from pastoral oversight, and we want you to make an informed choice with that distinction clearly understood.

---

## 6. Data Retention

We retain Personal Data for as long as necessary to fulfill the purposes described in this Policy, including:

(a) **Account information** is retained for as long as your account remains active, and for a reasonable period thereafter to allow for account recovery requests, unless you request earlier deletion under Section 9.

(b) **Financial transaction records**, including Wallet top-ups, Tithe and Offering history, and payout records, are retained for the period required by applicable Nigerian financial recordkeeping and tax obligations, which may extend beyond the life of your account, even following an account deletion request.

(c) **User Content**, including prayer requests and testimonies, may be retained for platform integrity and moderation purposes for a reasonable period following any deletion request, particularly where the content has already been engaged with by other users (for example, prayed over) or is relevant to an open moderation investigation.

(d) **Verification materials** submitted by Minister applicants are retained for the duration of their verified status and for a reasonable period thereafter for compliance and dispute-resolution purposes.

(e) Following account deletion, we may retain a minimal record sufficient to enforce a ban or prevent re-registration by a user previously removed for cause, such as fraud or underage use, as described in Section 8.

When Personal Data is no longer necessary for these purposes, we will delete or anonymize it in accordance with our internal data retention practices and applicable law.

---

## 7. Data Security

We implement technical and organizational measures designed to protect your Personal Data, including:

- Encryption of data in transit via HTTPS/TLS across the Platform;
- Hashing of account passwords; we do not store passwords in plaintext;
- Server-side validation of all financial transactions through atomic database operations designed to prevent data corruption or unauthorized balance manipulation;
- Webhook signature verification for payment confirmations received from Paystack and Flutterwave, to ensure transaction data originates from an authenticated source;
- Internal authentication controls between our frontend and backend systems to prevent unauthorized direct access to backend services;
- Role-based access controls limiting internal team access to Personal Data based on operational necessity;
- Firebase Admin SDK-based server-side verification of user identity tokens before any sensitive operation is performed.

**No system can be guaranteed completely secure.** While we strive to protect your Personal Data, we cannot guarantee its absolute security, and you acknowledge that you provide information to us at your own risk. If we become aware of a security breach affecting your Personal Data, we will notify you and the relevant regulatory authority as required by applicable law, including the NDPA.

---

## 8. Age Restriction and Children's Data

### 8.1 Strict 18+ Policy

9th Hour is intended exclusively for individuals 18 years of age or older. **We do not knowingly collect Personal Data from individuals under the age of 18.** Our Terms of Service strictly prohibit registration or use of the Platform by minors, without exception.

### 8.2 Discovery of Underage Data Collection

If we become aware that we have inadvertently collected Personal Data from an individual under the age of 18, we will take prompt steps to:

(a) suspend the associated account and freeze any associated Wallet balance;
(b) verify the user's age through appropriate means;
(c) where underage status is confirmed, delete the Personal Data collected from that individual from our active systems as soon as reasonably practicable, except to the extent limited retention is required for fraud prevention, dispute resolution regarding any financial transaction already completed, or legal compliance;
(d) take corresponding action with respect to any associated Wallet balance in accordance with our Terms of Service.

### 8.3 Reporting

If you believe a user under the age of 18 has registered for or is using the Platform, please report this to us immediately at enquiries@9thhour.live so that we can investigate and take appropriate action.

---

## 9. Your Privacy Rights

Depending on your jurisdiction, and in particular under the Nigeria Data Protection Act, you have the following rights with respect to your Personal Data:

### 9.1 Right to Access

You have the right to request confirmation of whether we process your Personal Data, and to request a copy of the Personal Data we hold about you.

### 9.2 Right to Correction

You have the right to request correction of inaccurate or incomplete Personal Data we hold about you. You can update most account information directly within the app; for other corrections, contact us.

### 9.3 Right to Deletion

You have the right to request deletion of your Personal Data, subject to our legal retention obligations described in Section 6. You can initiate account deletion directly within the app, or by contacting help@9thhour.live.

### 9.4 Right to Object and Restrict Processing

You have the right to object to certain processing of your Personal Data, including processing based on our legitimate interests, and to request that we restrict processing in certain circumstances, such as while a correction request is being verified.

### 9.5 Right to Data Portability

Where technically feasible, you have the right to request a copy of your Personal Data in a structured, commonly used, machine-readable format, for transmission to another service.

### 9.6 Right to Withdraw Consent

Where our processing of your Personal Data is based on your consent (for example, push notifications or anonymous prayer request submission), you have the right to withdraw that consent at any time, without affecting the lawfulness of processing carried out before withdrawal.

### 9.7 Right to Lodge a Complaint

You have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC), or another applicable supervisory authority, if you believe our processing of your Personal Data violates applicable law.

### 9.8 How to Exercise Your Rights

To exercise any of the rights described in this Section, please contact us at **enquiries@9thhour.live**. We will respond to your request within the timeframe required by applicable law. We may need to verify your identity before fulfilling certain requests, to ensure we do not disclose or modify data at the request of someone other than the data subject.

---

## 10. International Data Transfers

Our primary infrastructure providers, including MongoDB Atlas, Firebase, Vercel, and Railway, may process or store data on servers located outside Nigeria. Where Personal Data is transferred outside Nigeria, we take steps to ensure that such transfers are conducted in accordance with the requirements of the Nigeria Data Protection Act, including, where applicable, ensuring that the receiving jurisdiction or recipient provides an adequate level of data protection, or that appropriate safeguards (such as contractual protections with our service providers) are in place.

---

## 11. Children's Online Privacy (Supplementary)

In addition to Section 8 above, we note that 9th Hour is not directed at children and is not designed, marketed, or intended for use by anyone under 18. We do not knowingly solicit Personal Data from children. Parents or guardians who believe their child has provided Personal Data to us should contact enquiries@9thhour.live so that we can investigate and, where confirmed, delete that data in accordance with Section 8.2.

---

## 12. Push Notifications and Communication Preferences

### 12.1 Push Notifications

You may enable or disable push notifications at any time through your device settings or within the app. Disabling push notifications will not affect your ability to use other Platform features but will mean you do not receive real-time alerts for prayer responses, streak reminders, live session announcements, and similar engagement features.

### 12.2 Transactional Emails

Certain emails, such as offering receipts, wallet funding confirmations, and account security notices, are transactional in nature and necessary for the operation of your account; these cannot be opted out of while you maintain an active account, as they are essential to providing the Service.

### 12.3 Marketing Communications

If we introduce optional marketing or promotional communications in the future, we will provide a clear opt-in or opt-out mechanism in accordance with applicable law at that time.

---

## 13. Third-Party Links

The Platform may, from time to time, contain links to third-party websites or services (for example, a Minister's external ministry website). This Policy does not apply to such third-party properties, and we encourage you to review their privacy policies before providing any Personal Data to them.

---

## 14. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our data practices, the Platform's features, or applicable law. Where we make material changes, we will provide reasonable advance notice through the app, by email, or by other reasonable means before the changes take effect. The &#x201C;Last Updated&#x201D; date at the top of this Policy indicates when it was last revised. We encourage you to review this Policy periodically.

---

## 15. Contact Us

If you have questions, concerns, or requests relating to this Privacy Policy or our data practices, please contact us using one of the following channels:

| Purpose | Email |
|---|---|
| General account help, accessing or deleting your data | **help@9thhour.live** |
| Technical issues related to your data or account | **support@9thhour.live** |
| Privacy rights requests, data protection enquiries, legal notices | **enquiries@9thhour.live** |

**Status Sphere Technologies Ltd.**
[Insert registered business address]
Operating the 9th Hour platform at 9thhour.live

---

*This Privacy Policy should be reviewed by a licensed Nigerian attorney with data protection expertise prior to public launch, with particular attention to compliance with the Nigeria Data Protection Act 2023, registration or filing obligations with the Nigeria Data Protection Commission applicable to data controllers processing financial and sensitive data at scale, and the adequacy of safeguards for any cross-border data transfer arising from our use of international infrastructure providers.*`;

export default function PrivacyPolicyPage() {
  return <LegalDocument content={content} />;
}
