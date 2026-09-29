import { useEffect, useRef, useState } from "react";
import { fetchAiStatus } from "../api";
import type { AiStatus } from "../types";
import { KEY_HEADER, getUserKey, onUserKeyChange, setUserKey } from "../userKey";

const AI_STUDIO_URL = "https://aistudio.google.com/apikey";

// Checks a key against the server without saving it first, so a typo never
// replaces a working key.
async function testKey(key: string): Promise<boolean> {
  const res = await fetch("/api/ai-status", { headers: { [KEY_HEADER]: key } });
  if (!res.ok) return false;
  const s = (await res.json()) as AiStatus;
  return s.using_user_key === true && s.online;
}

function maskKey(key: string): string {
  return key.length <= 8 ? "••••" : `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export default function GeminiKeySettings() {
  const [accepts, setAccepts] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(getUserKey());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchAiStatus()
      .then((s) => setAccepts(s.accepts_user_key === true))
      .catch(() => {});
    return onUserKeyChange(() => setSavedKey(getUserKey()));
  }, []);

  if (!accepts) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
        <span aria-hidden>🔑</span>
        {savedKey ? (
          <span>
            Using <strong className="text-neutral-700">your own Gemini key</strong> ({maskKey(savedKey)}).
          </span>
        ) : (
          <span>AI answers use the site's shared quota.</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-semibold text-brand-700 underline-offset-2 hover:underline"
        >
          {savedKey ? "Change" : "Use my own Gemini key"}
        </button>
      </div>
      {open && <KeyDialog savedKey={savedKey} onClose={() => setOpen(false)} />}
    </>
  );
}

function KeyDialog({ savedKey, onClose }: { savedKey: string | null; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "bad" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    const key = value.trim();
    if (!key) return;
    setStatus("testing");
    try {
      if (await testKey(key)) {
        setUserKey(key);
        setStatus("ok");
        setTimeout(onClose, 900);
      } else {
        setStatus("bad");
      }
    } catch {
      setStatus("error");
    }
  }

  function remove() {
    setUserKey(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Use your own Gemini API key"
        className="w-full max-w-lg rounded-2xl border-2 border-ink bg-white p-6 shadow-sticker"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-neutral-900">Use your own Gemini key</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <p className="mt-1 text-sm text-neutral-600">
          The site's shared AI has a daily limit. With your own free key, your
          questions use <strong>your</strong> Google quota instead, so you won't
          run into the shared limit.
        </p>

        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-600">
          <li>
            Open{" "}
            <a href={AI_STUDIO_URL} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">
              Google AI Studio
            </a>{" "}
            and sign in with a Google account.
          </li>
          <li>Click <strong>Create API key</strong> and copy it.</li>
          <li>Paste it below.</li>
        </ol>

        <label className="mt-4 block text-sm font-medium text-neutral-700">
          Gemini API key
          <div className="mt-1 flex gap-2">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setStatus("idle");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              placeholder={savedKey ? `Current: ${maskKey(savedKey)}` : "AIza…"}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="shrink-0 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {status === "ok" && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Key works! Your questions now use your own quota.
          </p>
        )}
        {status === "bad" && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Google didn't accept that key. Check that you copied the whole key.
          </p>
        )}
        {status === "error" && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Couldn't reach the server to test the key. Please try again.
          </p>
        )}

        <p className="mt-3 text-xs text-neutral-500">
          Your key is saved only in this browser. It's sent with your questions
          so our server can pass it to Google, and it's never stored on our
          server. Don't save it on a shared or school computer.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {savedKey ? (
            <button
              type="button"
              onClick={remove}
              className="text-sm font-medium text-neutral-500 underline-offset-2 hover:text-brand-700 hover:underline"
            >
              Remove my key
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!value.trim() || status === "testing"}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {status === "testing" ? "Testing…" : "Save & test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
