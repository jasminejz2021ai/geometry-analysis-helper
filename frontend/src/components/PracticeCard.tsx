import { useRef, useState } from "react";
import { check } from "../api";
import type { Problem } from "../types";
import DiagramSVG from "./DiagramSVG";
import MathInput, { type MathInputHandle } from "./MathInput";
import MathSymbolBar from "./MathSymbolBar";
import MathText from "./MathText";
import ReportErrorButton from "./ReportErrorButton";

type Props = {
  problem: Problem;
  index: number;
};

export default function PracticeCard({ problem, index }: Props) {
  const [answer, setAnswer] = useState("");
  const answerRef = useRef<MathInputHandle>(null);
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
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium text-neutral-900">
          <span className="mr-2 text-brand-600">#{index + 1}</span>
          <MathText text={problem.prompt} />
        </p>
      </div>

      {problem.diagram && (
        <div className="my-3 flex justify-center rounded-xl bg-neutral-50 p-3">
          <DiagramSVG diagram={problem.diagram} />
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <MathInput
          ref={answerRef}
          value={answer}
          onChange={setAnswer}
          onCmdEnter={submit}
          ariaLabel="Your answer"
          placeholder={
            problem.unit
              ? `Write your answer and work (${problem.unit})`
              : "Write your answer and work here…"
          }
          className="w-full min-h-[7rem] rounded-lg border border-neutral-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <MathSymbolBar editorRef={answerRef} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={submit}
            disabled={checking || !answer.trim()}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {checking ? "Checking..." : "Check"}
          </button>
          <button
            onClick={() => setShowSteps((s) => !s)}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50"
          >
            {showSteps ? "Hide steps" : "Show steps"}
          </button>
          <span className="text-xs text-neutral-400">
            Tip: press ⌘/Ctrl + Enter to check
          </span>
        </div>
      </div>

      {result && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
            result.correct
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          <MathText text={result.feedback} />
        </div>
      )}

      {showSteps && (
        <ol className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3">
          {problem.steps.map((step, i) => (
            <li key={i} className="text-sm text-neutral-700">
              <MathText text={step} />
            </li>
          ))}
          <li className="pt-1 text-sm font-semibold text-neutral-900">
            Answer: <MathText text={problem.answer} />
          </li>
          <li className="flex justify-end pt-1">
            <ReportErrorButton problem={problem} where={`Practice problem #${index + 1}`} />
          </li>
        </ol>
      )}
    </div>
  );
}
