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

interface PingData {
  ok: boolean;
  ts: string;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [pingData, setPingData] = useState<PingData | null>(null);
  const [pingLoading, setPingLoading] = useState(true);
  const [pingError, setPingError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    
    fetch('/api/ping')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setPingData)
      .catch((e) => setPingError(e.message))
      .finally(() => setPingLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading status...</div>;
  if (error || !data) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="grid gap-4 p-4 md:p-8">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="mb-4 text-2xl font-bold">Gateway Status</h1>
        
        {/* API Ping Indicator */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm">
          <span>API:</span>
          {pingLoading ? (
            <span className="text-gray-500">checking...</span>
          ) : pingError ? (
            <span className="text-red-500">error</span>
          ) : pingData?.ok ? (
            <span className="text-green-600 font-medium">ok</span>
          ) : (
            <span className="text-red-500">down</span>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            Gateway Connected: {data.connected ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            Last Heartbeat: {data.lastHeartbeat}
          </div>
          {data.mainSession ? (
            <>
              <h2 className="mt-4 font-semibold">Main Session (agent:main:main)</h2>
              <div>Age: {data.mainSession.ageMin} minutes</div>
              <div>Model: {data.mainSession.model}</div>
              <div>Total Tokens Used: {data.mainSession.totalTokens.toLocaleString() } ({data.mainSession.percentUsed.toFixed(1)}% used)</div>
              <div>Remaining: {data.mainSession.remainingTokens.toLocaleString() }</div>
            </>
          ) : (
            <div>No main session found</div>
          )}
        </div>
      </div>
    </div>
  );
}
