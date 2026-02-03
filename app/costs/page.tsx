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
  const [data, setData] = useState<CostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/costs')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading costs...</div>;
  if (error || !data) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const { costs } = data;

  return (
    <div className="p-4 md:p-8">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="mb-4 text-2xl font-bold">Token Costs Summary</h1>
        <div className="space-y-2 text-sm">
          <div>Model: {costs.model}</div>
          <div>Context: {costs.contextTokens?.toLocaleString() || 'N/A'} tokens</div>
          <div>Input: {costs.inputTokens.toLocaleString() }</div>
          <div>Output: {costs.outputTokens.toLocaleString() }</div>
          <div>Total Used: {costs.totalTokens.toLocaleString() } ({costs.percentUsed.toFixed(1)}% of context)</div>
        </div>
      </div>
    </div>
  );
}
