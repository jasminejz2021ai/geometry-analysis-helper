import { useState } from "react";
import type { Problem } from "../types";
import ReportModal from "./ReportModal";

// The backend caps report context at 8000 characters, and ReportModal also
// appends the URL and browser, so leave headroom.
const MAX_SOLUTION_CHARS = 6000;

function solutionContext(problem: Problem, where: string): string {
  const steps = problem.steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n");
  const text =
    `Solution error report (${where})\n` +
    `Problem: ${problem.prompt}\n` +
    `Answer shown: ${problem.answer}\n` +
    (steps ? `Steps:\n${steps}` : "Steps: (none)");
  return text.length > MAX_SOLUTION_CHARS
    ? text.slice(0, MAX_SOLUTION_CHARS) + "\n…(truncated)"
    : text;
}

type Props = {
  problem: Problem;
  // Where the solution was shown, e.g. "Worked example" or "Practice #2".
  where: string;
};

export default function ReportErrorButton({ problem, where }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Report errors
      </button>
      <ReportModal
        open={open}
        onClose={() => setOpen(false)}
        context={solutionContext(problem, where)}
        title="Report an error in this solution"
        intro="Spotted a wrong step, a wrong answer, or a typo? Tell us where. The problem and its full solution are attached automatically."
        placeholder="e.g. Step 3 is wrong: 2x + 4 = 10 gives x = 3, not x = 4."
      />
    </>
  );
}
