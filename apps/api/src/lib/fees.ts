import { FEE_SCHEDULE, OfferingReceipt } from "@9thhour/shared-types";

export function computeFee(type: string, amount: number): number {
  const rate = FEE_SCHEDULE[type] ?? 0;
  return Math.ceil(amount * rate);
}

// 1 coin = ₦1 for every operation after purchase. Receipts must show the real
// fee — never "₦0" on a tithe/offering.
export function formatNaira(coins: number): string {
  return `₦${coins.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildOfferingReceipt(
  type: string,
  amount: number,
  feeCharged: number,
  netAmount: number
): OfferingReceipt {
  const feeRatePercent = (FEE_SCHEDULE[type] ?? 0) * 100;
  return {
    type,
    grossAmount: amount,
    feeCharged,
    netAmount,
    feeRatePercent,
    display: {
      gross: formatNaira(amount),
      fee: `Platform fee: ${formatNaira(feeCharged)} (${feeRatePercent}%)`,
      net: formatNaira(netAmount),
      summary: `${formatNaira(amount)} given → ${formatNaira(netAmount)} to minister, ${formatNaira(feeCharged)} platform fee (${feeRatePercent}%)`,
    },
  };
}
