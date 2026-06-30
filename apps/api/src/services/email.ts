import { getFromEmail, getResendClient, isResendConfigured } from "../lib/resend";
import { OfferingReceipt } from "@9thhour/shared-types";

export async function sendOfferingReceiptEmail(
  toEmail: string,
  recipientName: string,
  receipt: OfferingReceipt
): Promise<void> {
  if (!isResendConfigured()) return;

  const resend = getResendClient();
  if (!resend) return;

  const typeLabel = receipt.type === "tithe" ? "Tithe" : "Offering";

  await resend.emails.send({
    from: getFromEmail(),
    to: toEmail,
    subject: `Your ${typeLabel} receipt — 9th Hour`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1426;">
        <h2 style="color: #6d28d9;">9th Hour — ${typeLabel} Receipt</h2>
        <p>Hi ${recipientName},</p>
        <p>Thank you for your generosity. Here is your receipt:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e0ec;">Amount given</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e0ec; text-align: right;"><strong>${receipt.display.gross}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e0ec;">Platform fee (${receipt.feeRatePercent}%)</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e0ec; text-align: right;">${receipt.display.fee.replace("Platform fee: ", "")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">To minister</td>
            <td style="padding: 8px 0; text-align: right;"><strong>${receipt.display.net}</strong></td>
          </tr>
        </table>
        <p style="background: #faf8f3; padding: 12px; border-radius: 8px; font-size: 14px;">
          <strong>Summary:</strong> ${receipt.display.summary}
        </p>
        <p style="font-size: 12px; color: #6b5f7a;">This is an automated receipt from 9th Hour. 1 coin = ₦1.</p>
      </div>
    `,
  });
}
