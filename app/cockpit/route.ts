import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  // Prefer non-public env var (safe). Falls back to NEXT_PUBLIC for convenience.
  const url = process.env.GATEWAY_UI_URL || process.env.NEXT_PUBLIC_GATEWAY_UI_URL;
  if (!url) {
    return NextResponse.json(
      { error: "Missing GATEWAY_UI_URL (or NEXT_PUBLIC_GATEWAY_UI_URL)" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(url);
}
