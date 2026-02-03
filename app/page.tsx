"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi! Chat now powered by Clawdbot Gateway native API. (Backup: Gateway Cockpit)",
    },
  ]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { role: "user" as const, text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const loadingMsg = { role: "assistant" as const, text: "Thinking..." };
    setMessages((m) => [...m, loadingMsg]);

    try {
      const res = await fetch("/api/chat-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const { reply } = await res.json();
      setMessages((m) => m.slice(0, -1).concat([{ role: "assistant" as const, text: reply }]));
    } catch (e: any) {
      setMessages((m) =>
        m.slice(0, -1).concat([{ role: "assistant" as const, text: `Error: ${e.message}. Check /status.` }]
      ));
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <a
          href="/cockpit"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Open Gateway Cockpit (backup)
        </a>
        <a href="/status" className="ml-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Status</a>
        <a href="/costs" className="ml-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Costs</a>
      </div>
      <div className="rounded-xl border bg-white p-4 flex-1 flex flex-col">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm text-gray-600">
          <div>Chat (Native Gateway API)</div>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-2xl bg-black px-4 py-2 text-white mb-2"
                  : "self-start max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2 text-gray-900 mb-2"
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
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Type a message…"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="rounded-lg bg-black px-6 py-2 text-white disabled:opacity-50 hover:bg-gray-800"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
