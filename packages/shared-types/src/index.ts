// Money types and constants shared across web + api so the frontend and backend
// cannot drift. This package is the single source of truth for the fee schedule
// and the offering receipt shape.

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
