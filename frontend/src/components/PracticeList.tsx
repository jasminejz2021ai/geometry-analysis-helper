import { useEffect, useState } from "react";
import type { Problem } from "../types";
import PracticeCard from "./PracticeCard";

type Props = {
  problems: Problem[];
  canGenerateMore: boolean;
  onGenerateMore: () => void;
  generating: boolean;
  embedded?: boolean;
};

export default function PracticeList({
  problems,
  canGenerateMore,
  onGenerateMore,
  generating,
  embedded = false,
}: Props) {
  const [active, setActive] = useState(0);

  // Keep the active problem tab valid as the list grows or shrinks.
  useEffect(() => {
    if (active > problems.length - 1) {
      setActive(Math.max(0, problems.length - 1));
    }
  }, [problems.length, active]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        {!embedded && (
          <h2 className="text-lg font-semibold text-slate-900">
            Practice problems
          </h2>
        )}
        {canGenerateMore && (
          <button
            onClick={onGenerateMore}
            disabled={generating}
            className="ml-auto rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate more problems"}
          </button>
        )}
      </div>

      {problems.length === 0 ? (
        <p className="text-sm text-slate-500">No practice problems yet.</p>
      ) : (
        <div>
          <div
            role="tablist"
            className="mb-3 flex flex-wrap gap-1.5"
          >
            {problems.map((p, i) => {
              const isActive = i === active;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-brand-100 text-brand-700 ring-1 ring-brand-300"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  }`}
                >
                  Problem {i + 1}
                </button>
              );
            })}
          </div>

          {problems[active] && (
            <PracticeCard
              key={problems[active].id}
              problem={problems[active]}
              index={active}
            />
          )}
        </div>
      )}
    </div>
  );
}
