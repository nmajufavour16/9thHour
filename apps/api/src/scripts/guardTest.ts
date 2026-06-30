import express from "express";
import http from "http";
import { ensurePaystackConfigured } from "../lib/paystack";

// Proves the credential guard: with PAYSTACK_SECRET_KEY / PAYSTACK_WEBHOOK_SECRET
// unset, a Paystack-touching route returns a clean 503 (never a raw SDK error).
delete process.env.PAYSTACK_SECRET_KEY;
delete process.env.PAYSTACK_WEBHOOK_SECRET;

const app = express();
app.use(express.json());
app.post("/wallet/purchase/initialize", ensurePaystackConfigured, (_req, res) => {
  res.status(200).json({ shouldNotReach: true });
});

const server = app.listen(0, () => {
  const port = (server.address() as { port: number }).port;
  const req = http.request(
    { method: "POST", host: "127.0.0.1", port, path: "/wallet/purchase/initialize" },
    (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        console.log(`HTTP ${res.statusCode}`);
        console.log(body);
        server.close();
        const pass = res.statusCode === 503 && JSON.parse(body).error === "Payment service not yet configured";
        console.log(pass ? "RESULT: PASS" : "RESULT: FAIL");
        process.exit(pass ? 0 : 1);
      });
    }
  );
  req.end();
});
