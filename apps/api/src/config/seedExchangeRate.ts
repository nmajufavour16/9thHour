import { ExchangeRateConfig } from "../models/ExchangeRateConfig";

// Ensure exactly one active coin exchange rate exists. Idempotent — only seeds
// when none is present, so it's safe to run on every startup.
export async function seedExchangeRate(): Promise<void> {
  const existing = await ExchangeRateConfig.findOne({ isActive: true });
  if (existing) return;

  await ExchangeRateConfig.create({
    coinsPerNaira: 0.85,
    isActive: true,
    setByAdminId: "system",
  });

  console.log("[9th Hour API] Seeded default exchange rate (0.85 coins/₦).");
}
