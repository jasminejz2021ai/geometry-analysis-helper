import { useState } from "react";
import { check } from "../api";
import type { Problem } from "../types";
import DiagramSVG from "./DiagramSVG";
import MathText from "./MathText";

type Props = {
  problem: Problem;
  index: number;
};

export default function PracticeCard({ problem, index }: Props) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<
    { correct: boolean; feedback: string } | null
  >(null);
  const [checking, setChecking] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  async function submit() {
    if (!answer.trim()) return;
    setChecking(true);
    try {
      const res = await check(problem.answer, answer);
      setResult(res);
      if (res.correct) setShowSteps(true);
    } catch {
      setResult({ correct: false, feedback: "Could not check answer. Try again." });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-lg shadow-brand-900/5 ring-1 ring-white/60 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium text-slate-900">
          <span className="mr-2 text-brand-600">#{index + 1}</span>
          <MathText text={problem.prompt} />
        </p>
      </div>

      {problem.diagram && (
        <div className="my-3 flex justify-center rounded-xl bg-slate-50 p-3">
          <DiagramSVG diagram={problem.diagram} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={problem.unit ? `Answer (${problem.unit})` : "Your answer"}
          className="w-48 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          onClick={submit}
          disabled={checking || !answer.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {checking ? "Checking..." : "Check"}
        </button>
        <button
          onClick={() => setShowSteps((s) => !s)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          {showSteps ? "Hide steps" : "Show steps"}
        </button>
      </div>

      {result && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
            result.correct
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {result.feedback}
        </div>
      )}

      {showSteps && (
        <ol className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {problem.steps.map((step, i) => (
            <li key={i} className="text-sm text-slate-700">
              <MathText text={step} />
            </li>
          ))}
          <li className="pt-1 text-sm font-semibold text-slate-900">
            Answer: <MathText text={problem.answer} />
          </li>
        </ol>
      )}
    </div>
  );
}
