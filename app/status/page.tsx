"use client";

export default function StatusPage() {

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">Status</div>
        <div className="mt-2 text-sm text-gray-700">
          This page isn’t wired yet. Use the Gateway Cockpit for live health + status.
        </div>

        <a
          href="/cockpit"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Open Gateway Cockpit
        </a>
      </div>
    </div>
  );
}
