"use client";

import { useEffect, useState } from "react";

interface StatusData {
  connected: boolean;
  lastHeartbeat: string;
  mainSession: {
    ageMin: number;
    model: string;
    totalTokens: number;
    percentUsed: number;
    remainingTokens: number;
  } | null;
}

export default function StatusPage() {
  const [data, setData] = useState&lt;StatusData | null&gt;(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState&lt;string | null&gt;(null);

  useEffect(() =&gt; {
    fetch('/api/status')
      .then((r) =&gt; r.json())
      .then(setData)
      .catch((e) =&gt; setError(e.message))
      .finally(() =&gt; setLoading(false));
  }, []);

  if (loading) return &lt;div className="p-8 text-center"&gt;Loading status...&lt;/div&gt;;
  if (error || !data) return &lt;div className="p-8 text-center text-red-500"&gt;Error: {error}&lt;/div&gt;;

  return (
    &lt;div className="grid gap-4 p-4 md:p-8"&gt;
      &lt;div className="rounded-xl border bg-white p-6"&gt;
        &lt;h1 className="mb-4 text-2xl font-bold"&gt;Gateway Status&lt;/h1&gt;
        &lt;div className="space-y-2 text-sm"&gt;
          &lt;div&gt;
            Gateway Connected: {data.connected ? '✅ Yes' : '❌ No'}
          &lt;/div&gt;
          &lt;div&gt;
            Last Heartbeat: {data.lastHeartbeat}
          &lt;/div&gt;
          {data.mainSession ? (
            &lt;&gt;
              &lt;h2 className="mt-4 font-semibold"&gt;Main Session (agent:main:main)&lt;/h2&gt;
              &lt;div&gt;Age: {data.mainSession.ageMin} minutes&lt;/div&gt;
              &lt;div&gt;Model: {data.mainSession.model}&lt;/div&gt;
              &lt;div&gt;Total Tokens Used: {data.mainSession.totalTokens.toLocaleString() } ({data.mainSession.percentUsed.toFixed(1)}% used)&lt;/div&gt;
              &lt;div&gt;Remaining: {data.mainSession.remainingTokens.toLocaleString() }&lt;/div&gt;
            &lt;/&gt;
          ) : (
            &lt;div&gt;No main session found&lt;/div&gt;
          )}
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
