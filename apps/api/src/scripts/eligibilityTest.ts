import "dotenv/config";
import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { Transaction } from "../models/Transaction";
import { MinisterProfile } from "../models/MinisterProfile";
import { giveOffering, WalletError } from "../services/walletService";

// Verifies the /wallet/give minister-eligibility gate. Three rejection cases
// (believer, canAcceptOfferings:false, suspended) must all 403 with no wallet
// mutation, and the eligible-minister happy path must still credit correctly.
const GIVER = "test_elig_giver";
const AMOUNT = 1000;

const cases = [
  { name: "(a) plain believer (no MinisterProfile)", id: "test_elig_believer", profile: null, expectOk: false },
  {
    name: "(b) minister canAcceptOfferings:false",
    id: "test_elig_cannotaccept",
    profile: { canAcceptOfferings: false, isSuspended: false },
    expectOk: false,
  },
  {
    name: "(c) suspended minister",
    id: "test_elig_suspended",
    profile: { canAcceptOfferings: true, isSuspended: true },
    expectOk: false,
  },
  {
    name: "(d) eligible minister (happy path)",
    id: "test_elig_eligible",
    profile: { canAcceptOfferings: true, isSuspended: false },
    expectOk: true,
  },
];

const ids = [GIVER, ...cases.map((c) => c.id)];

async function cleanup() {
  await Wallet.deleteMany({ userId: { $in: ids } });
  await Transaction.deleteMany({ fromUserId: GIVER });
  await MinisterProfile.deleteMany({ userId: { $in: ids } });
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Check apps/api/.env");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  let allPass = true;

  for (const c of cases) {
    await cleanup();

    // Fresh giver with exactly enough for one offering.
    await Wallet.create({ userId: GIVER, balance: AMOUNT });
    await Wallet.create({ userId: c.id });
    if (c.profile) {
      await MinisterProfile.create({
        userId: c.id,
        ministryName: "Test Ministry",
        slug: `test-${c.id}`,
        churchName: "Test Church",
        ...c.profile,
      });
    }

    let outcome: "ok" | "rejected" = "ok";
    let status = 0;
    let message = "";
    try {
      await giveOffering({ fromUserId: GIVER, toMinisterId: c.id, amount: AMOUNT, type: "offering" });
    } catch (err) {
      outcome = "rejected";
      if (err instanceof WalletError) {
        status = err.httpStatus;
        message = err.message;
      } else {
        message = String(err);
      }
    }

    const giver = await Wallet.findOne({ userId: GIVER });
    const recipient = await Wallet.findOne({ userId: c.id });

    let pass: boolean;
    if (c.expectOk) {
      const fee = Math.ceil(AMOUNT * 0.03);
      const net = AMOUNT - fee;
      pass =
        outcome === "ok" &&
        giver?.balance === 0 &&
        recipient?.pendingWithdrawalBalance === net &&
        recipient?.totalEarnedAllTime === net;
    } else {
      // Rejected with 403 and NO mutation on either wallet.
      pass =
        outcome === "rejected" &&
        status === 403 &&
        message === "Recipient is not eligible to receive offerings" &&
        giver?.balance === AMOUNT &&
        recipient?.pendingWithdrawalBalance === 0;
    }

    allPass = allPass && pass;
    console.log(`${c.name}`);
    console.log(
      `   outcome=${outcome}${status ? ` (${status} "${message}")` : ""} | ` +
        `giver.balance=${giver?.balance} recipient.pending=${recipient?.pendingWithdrawalBalance} -> ${pass ? "PASS" : "FAIL"}`
    );
  }

  await cleanup();
  await mongoose.disconnect();
  console.log(allPass ? "\nRESULT: ALL PASS" : "\nRESULT: FAIL");
  process.exit(allPass ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
