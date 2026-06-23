import "dotenv/config";
import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { Transaction } from "../models/Transaction";
import { MinisterProfile } from "../models/MinisterProfile";
import { giveOffering } from "../services/walletService";

// Race-condition proof: fire many concurrent gives against a balance that only
// covers ONE. Exactly one must succeed; the balance must never go negative.
const GIVER = "test_giver_concurrency";
const MINISTER = "test_minister_concurrency";
const AMOUNT = 1000;
const ATTEMPTS = 20;

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Check apps/api/.env");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  await Wallet.deleteMany({ userId: { $in: [GIVER, MINISTER] } });
  await Transaction.deleteMany({ fromUserId: GIVER });
  await MinisterProfile.deleteMany({ userId: MINISTER });

  await Wallet.create({ userId: GIVER, balance: AMOUNT }); // funds for exactly one
  await Wallet.create({ userId: MINISTER });
  await MinisterProfile.create({
    userId: MINISTER,
    ministryName: "Concurrency Test Ministry",
    slug: "concurrency-test-ministry",
    churchName: "Test Church",
    canAcceptOfferings: true,
    isSuspended: false,
  });

  const results = await Promise.allSettled(
    Array.from({ length: ATTEMPTS }).map(() =>
      giveOffering({ fromUserId: GIVER, toMinisterId: MINISTER, amount: AMOUNT, type: "offering" })
    )
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  const giver = await Wallet.findOne({ userId: GIVER });
  const minister = await Wallet.findOne({ userId: MINISTER });

  const fee = Math.ceil(AMOUNT * 0.03);
  const net = AMOUNT - fee;

  console.log("--- giveOffering concurrency test ---");
  console.log(`attempts:        ${ATTEMPTS}`);
  console.log(`succeeded:       ${succeeded} (expected 1)`);
  console.log(`rejected:        ${failed} (expected ${ATTEMPTS - 1})`);
  console.log(`giver.balance:   ${giver?.balance} (expected 0, must be >= 0)`);
  console.log(`minister.pending:${minister?.pendingWithdrawalBalance} (expected ${net})`);
  console.log(`minister.earned: ${minister?.totalEarnedAllTime} (expected ${net})`);

  const pass =
    succeeded === 1 &&
    failed === ATTEMPTS - 1 &&
    giver?.balance === 0 &&
    minister?.pendingWithdrawalBalance === net &&
    minister?.totalEarnedAllTime === net;

  console.log(pass ? "RESULT: PASS" : "RESULT: FAIL");

  await Wallet.deleteMany({ userId: { $in: [GIVER, MINISTER] } });
  await Transaction.deleteMany({ fromUserId: GIVER });
  await MinisterProfile.deleteMany({ userId: MINISTER });
  await mongoose.disconnect();
  process.exit(pass ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
