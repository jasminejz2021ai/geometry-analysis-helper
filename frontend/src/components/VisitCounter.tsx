import { useEffect, useState } from "react";
import { fetchVisits, recordVisit } from "../api";

// Marks this browser tab session as already counted, so refreshing or
// switching subjects doesn't inflate the total.
const SESSION_KEY = "gah-visit-counted";

export default function VisitCounter() {
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const counted = sessionStorage.getItem(SESSION_KEY) === "1";
    const request = counted ? fetchVisits() : recordVisit();
    request
      .then((res) => {
        if (cancelled || res.visits == null) return;
        if (!counted) sessionStorage.setItem(SESSION_KEY, "1");
        setVisits(res.visits);
      })
      .catch(() => {
        // Counter is non-essential; stay hidden if it can't be reached.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (visits == null) return null;

  return (
    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
      <span aria-hidden>👀</span>
      <span className="font-semibold tabular-nums text-brand-700">
        {visits.toLocaleString()}
      </span>
      visits
    </p>
  );
}
