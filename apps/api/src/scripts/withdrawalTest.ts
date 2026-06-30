import "dotenv/config";
import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { Transaction } from "../models/Transaction";
import { requestWithdrawal, settleWithdrawal, WalletError } from "../services/walletService";

// Exercises withdrawal ledger without Paystack: 7% fee, debit of pending only,
// pendingWithdrawalBalance only (spendable balance untouched), insufficient-funds
// rejection, refund-on-failure, refund idempotency, and success completion.
const MIN = "test_withdraw_minister";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Check apps/api/.env");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const checks: Array<[string, boolean]> = [];

  async function reset() {
    await Wallet.deleteMany({ userId: MIN });
    await Transaction.deleteMany({ fromUserId: MIN });
    await Wallet.create({ userId: MIN, balance: 500, pendingWithdrawalBalance: 1000, totalEarnedAllTime: 1000 });
  }

  // 1. 7% fee + debits pendingWithdrawalBalance only
  await reset();
  const wd = await requestWithdrawal(MIN, 1000);
  let w = await Wallet.findOne({ userId: MIN });
  checks.push(["fee is 7% (70) and netPayout 930", wd.feeCharged === 70 && wd.netPayout === 930]);
  checks.push(["pendingWithdrawalBalance debited to 0", w?.pendingWithdrawalBalance === 0]);
  checks.push(["spendable balance untouched (500)", w?.balance === 500]);
  const txn = await Transaction.findById(wd.transactionId);
  checks.push([
    "pending withdrawal txn logged correctly",
    txn?.type === "withdrawal" && txn?.status === "pending" && txn?.amount === 1000 && txn?.feeCharged === 70 && txn?.netAmount === 930,
  ]);

  // 2. insufficient funds rejected (pending is now 0)
  let rejected = false;
  let status = 0;
  try {
    await requestWithdrawal(MIN, 1);
  } catch (e) {
    rejected = true;
    if (e instanceof WalletError) status = e.httpStatus;
  }
  checks.push(["insufficient withdrawable balance rejected (402)", rejected && status === 402]);

  // 3. refund on failure restores balance, marks failed
  await settleWithdrawal(wd.transactionId, false);
  w = await Wallet.findOne({ userId: MIN });
  const failedTxn = await Transaction.findById(wd.transactionId);
  checks.push(["refund restores pendingWithdrawalBalance to 1000", w?.pendingWithdrawalBalance === 1000]);
  checks.push(["refunded txn marked failed", failedTxn?.status === "failed"]);

  // 4. refund is idempotent (no double credit)
  await settleWithdrawal(wd.transactionId, false);
  w = await Wallet.findOne({ userId: MIN });
  checks.push(["second refund is a no-op (still 1000)", w?.pendingWithdrawalBalance === 1000]);

  // 5. success path completes without refund
  const wd2 = await requestWithdrawal(MIN, 500);
  await settleWithdrawal(wd2.transactionId, true);
  w = await Wallet.findOne({ userId: MIN });
  const okTxn = await Transaction.findById(wd2.transactionId);
  checks.push(["success leaves balance debited (500) — no refund", w?.pendingWithdrawalBalance === 500]);
  checks.push(["completed txn marked completed", okTxn?.status === "completed"]);

  await Wallet.deleteMany({ userId: MIN });
  await Transaction.deleteMany({ fromUserId: MIN });
  await mongoose.disconnect();

  console.log("--- withdrawal ledger test ---");
  let allPass = true;
  for (const [label, pass] of checks) {
    if (!pass) allPass = false;
    console.log(`  [${pass ? "PASS" : "FAIL"}] ${label}`);
  }
  console.log(allPass ? "\nRESULT: ALL PASS" : "\nRESULT: FAIL");
  process.exit(allPass ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
