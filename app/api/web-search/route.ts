import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.TAVILY_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing TAVILY_API_KEY (set in Fly secrets)" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const maxResults =
      typeof body?.maxResults === "number" && Number.isFinite(body.maxResults)
        ? Math.max(1, Math.min(10, Math.floor(body.maxResults)))
        : 5;

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Tavily error (${res.status}): ${text || res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      query,
      answer: data.answer ?? null,
      results: (data.results ?? []).map((r: any) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        content: r.content ?? "",
        score: r.score ?? null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
