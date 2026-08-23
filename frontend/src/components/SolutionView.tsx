import { useState } from "react";
import type { Problem } from "../types";
import DiagramSVG from "./DiagramSVG";
import MathText from "./MathText";

type Props = {
  problem: Problem;
  source: "template" | "llm" | "dify";
  embedded?: boolean;
  heading?: string;
  note?: string;
};

function sourceLabel(source: Props["source"]): string {
  if (source === "dify") return "AI generated (Dify)";
  if (source === "llm") return "AI generated";
  return "Guided";
}

export default function SolutionView({
  problem,
  source,
  embedded = false,
  heading = "Worked example",
  note,
}: Props) {
  // Progressive reveal: steps start grayed/hidden; clicking a step reveals it
  // (and any earlier ones), so students can work through them one at a time.
  const [revealed, setRevealed] = useState(0);

  const containerClass = embedded
    ? ""
    : "rounded-2xl bg-white/80 p-6 shadow-lg shadow-brand-900/5 ring-1 ring-white/60 backdrop-blur-sm";
  return (
    <div className={containerClass}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          {sourceLabel(source)}
        </span>
      </div>

      {note && <p className="mb-3 text-sm text-slate-500">{note}</p>}

      <p className="text-slate-700">
        <MathText text={problem.prompt} />
      </p>

      {problem.diagram && (
        <div className="my-4 flex justify-center rounded-xl bg-slate-50 p-4">
          <DiagramSVG diagram={problem.diagram} />
        </div>
      )}

      {problem.steps.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Click each step to reveal it.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setRevealed((r) => Math.min(r + 1, problem.steps.length))
              }
              disabled={revealed >= problem.steps.length}
              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-40"
            >
              Reveal next
            </button>
            {revealed > 0 && (
              <button
                onClick={() => setRevealed(0)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      <ol className="mt-3 space-y-2">
        {problem.steps.map((step, i) => {
          const isRevealed = i < revealed;
          // The next hidden step is clickable; later ones stay locked until
          // the student works up to them.
          const isNext = i === revealed;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  if (isRevealed) setRevealed(i); // collapse back to this step
                  else if (isNext) setRevealed(i + 1);
                }}
                disabled={!isRevealed && !isNext}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition ${
                  isRevealed
                    ? "bg-slate-50 hover:bg-slate-100"
                    : isNext
                      ? "cursor-pointer bg-slate-100/70 hover:bg-brand-50"
                      : "cursor-not-allowed bg-slate-100/60"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isRevealed
                      ? "bg-brand-600 text-white"
                      : "bg-slate-300 text-slate-500"
                  }`}
                >
                  {i + 1}
                </span>
                {isRevealed ? (
                  <MathText text={step} className="text-slate-800" />
                ) : (
                  <span className="text-sm text-slate-400">
                    Step {i + 1}
                    {isNext ? " — click to reveal" : " (locked)"}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="text-sm font-medium text-emerald-800">
          Answer: <MathText text={problem.answer} />
        </span>
      </div>
    </div>
  );
}
