"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "This is the MVP chat UI. Next step is wiring it to Clawdbot gateway + notifications.",
    },
  ]);

  function send() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");

    // Placeholder until gateway relay is wired.
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Received. (Not wired to gateway yet.)",
        },
      ]);
    }, 300);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 text-sm text-gray-600">
          Chat (text now; image upload + voice coming next)
        </div>
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-2xl bg-black px-4 py-2 text-white"
                  : "self-start max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2 text-gray-900"
              }
            >
              {m.text}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="Type a message…"
          />
          <button
            onClick={send}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
