"use client";

import { signOut } from "next-auth/react";

export default function SettingsPage() {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">Notifications</div>
        <div className="mt-2 text-sm text-gray-700">
          Next: request browser notification permission + register Web Push device.
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">Account</div>
        <button
          className="mt-3 rounded-lg border px-4 py-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
