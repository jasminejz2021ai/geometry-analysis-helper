import { useRef, useState } from "react";
import { chat } from "../api";
import type { ChatTurn } from "../types";
import MathText from "./MathText";

type Props = {
  // Background describing what the student is currently viewing (per tab).
  context?: string;
  // Short label to tailor the placeholder, e.g. "this concept".
  subject?: string;
};

export default function ChatBox({ context, subject = "this" }: Props) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function send() {
    const q = input.trim();
    if (!q || sending) return;
    setError(null);
    const history = turns;
    const next: ChatTurn[] = [...turns, { role: "user", content: q }];
    setTurns(next);
    setInput("");
    setSending(true);
    try {
      const res = await chat(q, context, history);
      setTurns([...next, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send message.");
      // Roll back the optimistic user turn so they can retry the same text.
      setTurns(history);
      setInput(q);
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-medium text-brand-700 transition hover:bg-brand-50"
      >
        <span className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask a question about {subject}
        </span>
        <span className="text-xs text-brand-500">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="border-t border-brand-100 p-3">
          {turns.length > 0 && (
            <div
              ref={scrollRef}
              className="mb-3 max-h-64 space-y-2 overflow-y-auto pr-1"
            >
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={`flex ${
                    t.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      t.role === "user"
                        ? "bg-brand-600 text-white"
                        : "bg-white text-slate-800 ring-1 ring-slate-200"
                    }`}
                  >
                    <MathText text={t.content} />
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-200">
                    Thinking…
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Type your question… (Enter to send)"
              className="min-h-[40px] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
