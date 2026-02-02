import { auth } from "@/src/auth";

export default async function StatusPage() {
  const session = await auth();

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">Working / health</div>
        <div className="mt-2 text-lg font-semibold">Connected</div>
        <div className="mt-2 text-sm text-gray-700">
          Signed in as: <span className="font-medium">{session?.user?.email}</span>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Next: show gateway websocket status + last event timestamp + stuck detection.
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">Recent activity</div>
        <div className="mt-2 text-sm text-gray-700">(Coming next)</div>
      </div>
    </div>
  );
}
