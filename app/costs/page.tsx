"use client";

import { useEffect, useState } from "react";

interface CostsData {
  costs: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    percentUsed: number;
    model: string;
    contextTokens: number;
  };
}

export default function CostsPage() {
  const [data, setData] = useState&lt;CostsData | null&gt;(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState&lt;string | null&gt;(null);

  useEffect(() =&gt; {
    fetch('/api/costs')
      .then((r) =&gt; r.json())
      .then(setData)
      .catch((e) =&gt; setError(e.message))
      .finally(() =&gt; setLoading(false));
  }, []);

  if (loading) return &lt;div className="p-8 text-center"&gt;Loading costs...&lt;/div&gt;;
  if (error || !data) return &lt;div className="p-8 text-center text-red-500"&gt;Error: {error}&lt;/div&gt;;

  const { costs } = data;

  return (
    &lt;div className="p-4 md:p-8"&gt;
      &lt;div className="rounded-xl border bg-white p-6"&gt;
        &lt;h1 className="mb-4 text-2xl font-bold"&gt;Token Costs Summary&lt;/h1&gt;
        &lt;div className="space-y-2 text-sm"&gt;
          &lt;div&gt;Model: {costs.model}&lt;/div&gt;
          &lt;div&gt;Context: {costs.contextTokens?.toLocaleString() || 'N/A'} tokens&lt;/div&gt;
          &lt;div&gt;Input: {costs.inputTokens.toLocaleString() }&lt;/div&gt;
          &lt;div&gt;Output: {costs.outputTokens.toLocaleString() }&lt;/div&gt;
          &lt;div&gt;Total Used: {costs.totalTokens.toLocaleString() } ({costs.percentUsed.toFixed(1)}% of context)&lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
