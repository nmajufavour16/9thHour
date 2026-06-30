// Platform fee rates per transaction type. Tithes and offerings are 3%.
// Fees round up so amount === feeCharged + netAmount always holds.
export const FEE_SCHEDULE: Record<string, number> = {
  tithe: 0.03,
  offering: 0.03,
  withdrawal: 0.07,
  project_offering: 0.015,
  thanksgiving: 0.015,
  emergency_fund: 0.015,
  booking: 0.1,
  seed: 0.1,
  gift: 0.1,
  round_up: 0.0075,
  feeding_program: 0.01,
  faith_clinic: 0.05,
  fund_wallet: 0, // margin lives in the exchange rate, not a separate fee
};

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

export interface OfferingReceipt {
  type: string;
  grossAmount: number;
  feeCharged: number;
  netAmount: number;
  feeRatePercent: number;
  display: {
    gross: string;
    fee: string;
    net: string;
    summary: string;
  };
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
