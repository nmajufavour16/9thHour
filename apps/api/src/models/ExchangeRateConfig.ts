import { Schema, model, models } from "mongoose";

// Single source of truth for the coin purchase rate. Exactly one document
// should be active at a time — enforced in application logic, never deleted
// (historical rates are kept for audit).
const exchangeRateConfigSchema = new Schema(
  {
    coinsPerNaira: { type: Number, required: true, default: 0.85 }, // ₦1,000 → 850 coins
    effectiveFrom: { type: Date, required: true, default: Date.now },
    isActive: { type: Boolean, default: true },
    setByAdminId: { type: String, ref: "User", required: true },
  },
  { timestamps: true }
);

exchangeRateConfigSchema.index({ isActive: 1 });

export const ExchangeRateConfig =
  models.ExchangeRateConfig || model("ExchangeRateConfig", exchangeRateConfigSchema);
