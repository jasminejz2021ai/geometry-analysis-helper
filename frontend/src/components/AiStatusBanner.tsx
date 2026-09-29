import { useEffect, useState } from "react";
import { fetchAiStatus } from "../api";
import { onUserKeyChange } from "../userKey";

// Polls the backend AI status and warns when the AI provider is configured but
// unreachable, or when the student's own Gemini key is being rejected.
export default function AiStatusBanner() {
  const [offline, setOffline] = useState(false);
  const [ownKey, setOwnKey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const s = await fetchAiStatus();
        if (cancelled) return;
        setOffline(s.configured && !s.online);
        setOwnKey(s.using_user_key === true);
      } catch {
        // Ignore transient errors; don't show a false alarm on a hiccup.
      }
    }
    poll();
    const id = setInterval(poll, 30000);
    const stopListening = onUserKeyChange(poll);
    return () => {
      cancelled = true;
      clearInterval(id);
      stopListening();
    };
  }, []);

  if (!offline) return null;

  if (ownKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Your Gemini API key isn't working.</p>
        <p className="mt-0.5 text-amber-800">
          Google rejected it, so AI answers won't load. Open{" "}
          <strong>Settings</strong> (top right) to fix it, or remove it to go
          back to the shared key.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0"
        aria-hidden
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <p className="font-medium">The live AI tutor is offline right now.</p>
        <p className="mt-0.5 text-amber-800">
          Typing a brand-new question, photo solving, and free-form chat are
          temporarily unavailable. Everything in the <strong>Topics</strong>{" "}
          sidebar still works — all Geometry topics and Analysis subsections have
          worked examples and practice problems ready to go. You can also add
          your own free Gemini key in <strong>Settings</strong> (top right).
        </p>
      </div>
    </div>
  );
}
