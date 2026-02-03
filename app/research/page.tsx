"use client";

import { useState } from "react";

type Result = { title: string; url: string; content: string; score: number | null };

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  async function run() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setResults([]);

    try {
      const res = await fetch("/api/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, maxResults: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setAnswer(data.answer ?? null);
      setResults(data.results ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Research (Tavily)</h1>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="Search the web…"
          />
          <button
            onClick={run}
            disabled={loading || !query.trim()}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {error ? <div className="mt-3 text-sm text-red-600">Error: {error}</div> : null}

        {answer ? (
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Answer</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{answer}</div>
          </div>
        ) : null}

        {results.length ? (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Results</div>
            <div className="mt-2 flex flex-col gap-3">
              {results.map((r, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sm underline"
                  >
                    {r.title || r.url}
                  </a>
                  <div className="mt-2 text-sm text-gray-700">{r.content}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
