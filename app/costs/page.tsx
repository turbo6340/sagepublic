"use client";

import { useMemo } from "react";

export default function CostsPage() {
  const gatewayUiUrl = useMemo(() => process.env.NEXT_PUBLIC_GATEWAY_UI_URL ?? "", []);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-600">Costs</div>
      <div className="mt-2 text-sm text-gray-700">
        This page isn’t wired yet. Use the Gateway Cockpit for live usage/costs.
      </div>

      {gatewayUiUrl ? (
        <a
          href={gatewayUiUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Open Gateway Cockpit
        </a>
      ) : (
        <div className="mt-4 text-xs text-gray-500">Set NEXT_PUBLIC_GATEWAY_UI_URL to enable Cockpit link</div>
      )}
    </div>
  );
}
