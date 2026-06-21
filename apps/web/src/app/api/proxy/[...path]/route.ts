import { NextRequest, NextResponse } from "next/server";

// Only way the browser reaches the backend. The real API URL and the
// internal key never leave the server — both stay inside this handler.

const BACKEND_URL = process.env.PRIVATE_NODE_BACKEND_URL;
const INTERNAL_KEY = process.env.INTERNAL_COMMUNICATION_KEY;

if (!BACKEND_URL || !INTERNAL_KEY) {
  console.error(
    "[BFF PROXY] Missing PRIVATE_NODE_BACKEND_URL or INTERNAL_COMMUNICATION_KEY in environment."
  );
}

async function forward(req: NextRequest, path: string[]) {
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.set("x-internal-key", INTERNAL_KEY ?? "");
  headers.delete("host");

  const init: RequestInit = {
    method: req.method,
    headers,
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
