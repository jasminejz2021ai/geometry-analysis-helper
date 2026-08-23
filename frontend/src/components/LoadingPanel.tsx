import { useEffect, useState } from "react";

type Props = {
  label?: string;
};

// Shown in the results area while an AI request is in flight. A live elapsed
// timer + explanation makes a slow local-model wait feel intentional rather
// than frozen.
export default function LoadingPanel({ label = "Working on it" }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-lg shadow-brand-900/5 ring-1 ring-white/60 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-brand-600"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z"
          />
        </svg>
        <div>
          <p className="font-medium text-slate-900">
            {label}
            <span className="ml-2 tabular-nums text-sm font-normal text-slate-500">
              {seconds}s
            </span>
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            The AI tutor runs on a local model, so a fresh answer can take up to
            ~2 minutes. Example questions are instant.
          </p>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-400" />
      </div>
    </div>
  );
}
