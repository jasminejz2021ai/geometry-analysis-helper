import { useRef, useState } from "react";

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

// A palette entry: what's shown on the button, what gets inserted, and a
// tooltip name. A "▮" in `insert` marks where the cursor lands (and where any
// selected text is wrapped), e.g. "√(▮)".
type Sym = { label: string; insert: string; name: string };

const BASIC: Sym[] = [
  { label: "×", insert: "×", name: "times" },
  { label: "÷", insert: "÷", name: "divide" },
  { label: "±", insert: "±", name: "plus–minus" },
  { label: "·", insert: "·", name: "dot / multiply" },
  { label: "√", insert: "√(▮)", name: "square root" },
  { label: "xⁿ", insert: "^", name: "exponent (power)" },
  { label: "xₙ", insert: "_", name: "subscript" },
  { label: "a/b", insert: "(▮)/()", name: "fraction" },
  { label: "≤", insert: "≤", name: "less than or equal" },
  { label: "≥", insert: "≥", name: "greater than or equal" },
  { label: "≠", insert: "≠", name: "not equal" },
  { label: "≈", insert: "≈", name: "approximately" },
  { label: "∞", insert: "∞", name: "infinity" },
  { label: "°", insert: "°", name: "degree" },
  { label: "|x|", insert: "|▮|", name: "absolute value" },
];

const GREEK: Sym[] = [
  { label: "π", insert: "π", name: "pi" },
  { label: "θ", insert: "θ", name: "theta" },
  { label: "α", insert: "α", name: "alpha" },
  { label: "β", insert: "β", name: "beta" },
  { label: "γ", insert: "γ", name: "gamma" },
  { label: "λ", insert: "λ", name: "lambda" },
  { label: "μ", insert: "μ", name: "mu" },
  { label: "σ", insert: "σ", name: "sigma" },
  { label: "φ", insert: "φ", name: "phi" },
  { label: "ω", insert: "ω", name: "omega" },
  { label: "Δ", insert: "Δ", name: "Delta" },
  { label: "Σ", insert: "Σ", name: "Sigma (sum)" },
];

const ANALYSIS_SYMS: Sym[] = [
  { label: "∫", insert: "∫", name: "integral" },
  { label: "∑", insert: "∑", name: "summation" },
  { label: "∏", insert: "∏", name: "product" },
  { label: "∂", insert: "∂", name: "partial derivative" },
  { label: "∇", insert: "∇", name: "nabla / gradient" },
  { label: "lim", insert: "lim ", name: "limit" },
  { label: "→", insert: "→", name: "approaches / to" },
  { label: "∈", insert: "∈", name: "element of" },
  { label: "∉", insert: "∉", name: "not an element of" },
  { label: "∪", insert: "∪", name: "union" },
  { label: "∩", insert: "∩", name: "intersection" },
  { label: "∀", insert: "∀", name: "for all" },
  { label: "∃", insert: "∃", name: "there exists" },
  { label: "≡", insert: "≡", name: "equivalent / congruent" },
];

const GEOMETRY_SYMS: Sym[] = [
  { label: "∠", insert: "∠", name: "angle" },
  { label: "△", insert: "△", name: "triangle" },
  { label: "⊥", insert: "⊥", name: "perpendicular" },
  { label: "∥", insert: "∥", name: "parallel" },
  { label: "≅", insert: "≅", name: "congruent" },
  { label: "∼", insert: "∼", name: "similar" },
  { label: "→", insert: "→", name: "vector / ray" },
];

type Props = {
  onSubmit: (question: string) => void;
  loading: boolean;
  subject: "geometry" | "analysis";
};

export default function QuestionInput({ onSubmit, loading, subject }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAnalysis = subject === "analysis";
  const examples = isAnalysis ? ANALYSIS_EXAMPLES : GEOMETRY_EXAMPLES;

  // Symbol groups shown for the current subject.
  const groups: { key: string; syms: Sym[] }[] = [
    { key: "basic", syms: BASIC },
    { key: "subject", syms: isAnalysis ? ANALYSIS_SYMS : GEOMETRY_SYMS },
    { key: "greek", syms: GREEK },
  ];

  function insertSymbol(snippet: string) {
    const ta = textareaRef.current;
    // Fallback: no ref -> append to the end.
    if (!ta) {
      setValue((v) => v + snippet.replace("▮", ""));
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    const caretMarker = snippet.indexOf("▮");
    // Replace the marker with any currently-selected text (so a symbol like
    // √(▮) wraps a highlighted expression), or drop the marker.
    const inserted = snippet.replace("▮", selected);
    const next = value.slice(0, start) + inserted + value.slice(end);
    setValue(next);

    // Where the cursor should end up after inserting.
    const caret =
      caretMarker >= 0
        ? start + caretMarker + selected.length
        : start + inserted.length;

    // Restore focus + caret on the next frame (after React re-renders).
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }

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
      <textarea
        ref={textareaRef}
        className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-3 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        rows={3}
        placeholder={
          isAnalysis
            ? "e.g. Prove 1 + 2 + ... + n = n(n+1)/2 by induction"
            : "e.g. Find the hypotenuse of a right triangle with legs 3 and 4"
        }
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
      />

      {/* Math symbol palette: click to insert at the cursor. */}
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2">
        <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Math symbols
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {groups.map((group, gi) => (
            <div key={group.key} className="flex flex-wrap items-center gap-1">
              {gi > 0 && (
                <span
                  aria-hidden
                  className="mx-1 h-6 w-px self-center bg-slate-200"
                />
              )}
              {group.syms.map((sym) => (
                <button
                  key={group.key + sym.label}
                  type="button"
                  title={sym.name}
                  aria-label={`Insert ${sym.name}`}
                  onClick={() => insertSymbol(sym.insert)}
                  className="flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 text-sm text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {sym.label}
                </button>
              ))}
            </div>
          ))}
        </div>
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
