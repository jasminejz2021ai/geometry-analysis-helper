import { useEffect, useRef, useState } from "react";
import { reportProblem } from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
  // Context about what the user is currently looking at, so a report is useful.
  context?: string;
};

export default function ReportModal({ open, onClose, context }: Props) {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      // Reset for a fresh report each time it opens, then focus the textarea.
      setDescription("");
      setEmail("");
      setDone(false);
      setError(null);
      setSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const fullContext = [
        context,
        `URL: ${window.location.href}`,
        `Browser: ${navigator.userAgent}`,
      ]
        .filter(Boolean)
        .join(" | ");
      await reportProblem(description, email.trim() || undefined, fullContext);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not send your report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report a problem"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Report a problem</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="mt-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Thanks! Your report was sent. We appreciate you helping improve the
              site.
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Found a wrong answer, a rendering glitch, or something confusing?
              Tell us what happened.
            </p>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              What went wrong?
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the problem. Include the topic or problem number if you can."
                className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Your email (optional)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com — only if you'd like a reply"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !description.trim()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
