import { useRef, useState } from "react";
import MathInput, { type MathInputHandle } from "./MathInput";
import MathSymbolBar from "./MathSymbolBar";

const GEOMETRY_EXAMPLES = [
  "Find the hypotenuse of a right triangle with legs 6 and 8",
  "What is the area of a circle with radius 5?",
  "Two angles are complementary and one is 35 degrees",
  "Find the distance between (1, 2) and (4, 6)",
  "Area of a triangle with base 10 and height 7",
];

const ANALYSIS_EXAMPLES = [
  "Prove 1 + 2 + ... + n = n(n+1)/2 by induction",
  "Prove a Fibonacci identity by induction",
  "Does the series sum of 1/n^2 converge?",
  "Find the derivative of x^3 using the limit definition",
  "Find the cross product of <1,2,3> and <4,5,6>",
  "Evaluate the limit of (sin x)/x as x approaches 0",
];

type Props = {
  onSubmit: (question: string) => void;
  loading: boolean;
  subject: "geometry" | "analysis";
};

export default function QuestionInput({ onSubmit, loading, subject }: Props) {
  const [value, setValue] = useState("");
  const editorRef = useRef<MathInputHandle>(null);
  const isAnalysis = subject === "analysis";
  const examples = isAnalysis ? ANALYSIS_EXAMPLES : GEOMETRY_EXAMPLES;

  function submit() {
    const q = value.trim();
    if (q) onSubmit(q);
  }

  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-lg shadow-brand-900/5 ring-1 ring-white/60 backdrop-blur-sm">
      <label className="block text-sm font-medium text-slate-700">
        {isAnalysis
          ? "Ask an Analysis (Honors) question"
          : "Ask a geometry question"}
      </label>
      <MathInput
        ref={editorRef}
        value={value}
        onChange={setValue}
        onCmdEnter={submit}
        ariaLabel={isAnalysis ? "Analysis question" : "Geometry question"}
        placeholder={
          isAnalysis
            ? "e.g. Prove 1 + 2 + ... + n = n(n+1)/2 by induction"
            : "e.g. Find the hypotenuse of a right triangle with legs 3 and 4"
        }
        className="mt-2 min-h-[5.25rem] w-full rounded-xl border border-slate-300 p-3 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      <div className="mt-2">
        <MathSymbolBar editorRef={editorRef} defaultOpen />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="rounded-xl bg-brand-600 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Get help + practice"}
        </button>
        <span className="text-xs text-slate-400">Tip: Cmd/Ctrl + Enter</span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Try an example
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setValue(ex)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-brand-300 hover:bg-brand-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
