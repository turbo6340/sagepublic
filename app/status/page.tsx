export default function StatusPage() {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">Working / health</div>
        <div className="mt-2 text-lg font-semibold">Online</div>
        <div className="mt-4 text-sm text-gray-600">
          Next: show gateway websocket status + last event timestamp + stuck detection.
        </div>
      </div>
    </div>
  );
}
