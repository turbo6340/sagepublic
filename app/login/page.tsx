"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Artificial Expert</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to access your Sage cockpit.
        </p>

        <button
          className="mt-6 w-full rounded-lg bg-black px-4 py-2 text-white"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
