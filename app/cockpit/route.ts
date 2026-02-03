import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeBase(url: string) {
  // Ensure it ends with a single slash
  return url.replace(/\/+$/, "") + "/";
}

export function GET(req: Request) {
  // Prefer server-only env var (safe). Falls back to NEXT_PUBLIC for convenience.
  const base = process.env.GATEWAY_UI_URL || process.env.NEXT_PUBLIC_GATEWAY_UI_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Missing GATEWAY_UI_URL (or NEXT_PUBLIC_GATEWAY_UI_URL)" },
      { status: 500 }
    );
  }

  // Optional: auto-connect the Control UI by passing gatewayUrl + token.
  // NOTE: token in URL is convenient but sensitive; keep /cockpit behind Google auth.
  const token = process.env.GATEWAY_TOKEN;
  const gatewayUrl = process.env.GATEWAY_WS_URL; // e.g. wss://srv...ts.net

  const u = new URL(normalizeBase(base));

  if (gatewayUrl) u.searchParams.set("gatewayUrl", gatewayUrl);
  if (token) u.searchParams.set("token", token);

  // preserve ?next=... style params from incoming request if any (non-conflicting)
  const incoming = new URL(req.url);
  incoming.searchParams.forEach((v, k) => {
    if (!u.searchParams.has(k)) u.searchParams.set(k, v);
  });

  return NextResponse.redirect(u.toString());
}
