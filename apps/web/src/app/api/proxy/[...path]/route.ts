import { NextRequest, NextResponse } from "next/server";

/**
 * 9TH HOUR — BFF PROXY
 *
 * This catch-all route is the ONLY way the browser ever reaches the backend.
 * The real Node.js/Express API URL and the INTERNAL_COMMUNICATION_KEY never
 * reach the client — both stay server-side, inside this route handler.
 *
 * Per TRD.md §2 (BFF Pattern) and AGENT_PROMPT.md Phase 1.
 */

const BACKEND_URL = process.env.PRIVATE_NODE_BACKEND_URL;
const INTERNAL_KEY = process.env.INTERNAL_COMMUNICATION_KEY;

if (!BACKEND_URL || !INTERNAL_KEY) {
  // Fail loudly at build/boot time rather than silently misrouting requests in production.
  console.error(
    "[BFF PROXY] Missing PRIVATE_NODE_BACKEND_URL or INTERNAL_COMMUNICATION_KEY in environment."
  );
}

async function forward(req: NextRequest, path: string[]) {
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.set("x-internal-key", INTERNAL_KEY ?? "");
  headers.delete("host"); // avoid forwarding the Next.js host header to the backend

  const init: RequestInit = {
    method: req.method,
    headers,
    // GET/HEAD requests must not carry a body
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
  };

  const backendResponse = await fetch(targetUrl, init);
  const responseBody = await backendResponse.text();

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: {
      "content-type": backendResponse.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
