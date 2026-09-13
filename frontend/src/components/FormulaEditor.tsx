import { useEffect, useRef, useState } from "react";
import { addStyles, EditableMathField, type MathField } from "react-mathquill";

// Inject MathQuill's CSS once, when this (lazy-loaded) module first loads.
addStyles();

type Props = {
  open: boolean;
  // Called with a LaTeX string (already wrapped in \( \)) to insert.
  onInsert: (latex: string) => void;
  onClose: () => void;
};

// Quick structure buttons that are awkward to type — click to insert at the
// cursor inside the live field (Desmos-style).
const QUICK: { label: string; cmd: string; name: string }[] = [
  { label: "a/b", cmd: "\\frac", name: "fraction" },
  { label: "√", cmd: "\\sqrt", name: "square root" },
  { label: "xⁿ", cmd: "^", name: "exponent" },
  { label: "xₙ", cmd: "_", name: "subscript" },
  { label: "∫", cmd: "\\int", name: "integral" },
  { label: "∑", cmd: "\\sum", name: "summation" },
  { label: "π", cmd: "\\pi", name: "pi" },
  { label: "θ", cmd: "\\theta", name: "theta" },
];

export default function FormulaEditor({ open, onInsert, onClose }: Props) {
  const [latex, setLatex] = useState("");
  const fieldRef = useRef<MathField | null>(null);

  // Reset the field each time the dialog opens.
  useEffect(() => {
    if (open) setLatex("");
  }, [open]);

  // Escape closes the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function quick(cmd: string) {
    const mf = fieldRef.current;
    if (!mf) return;
    mf.cmd(cmd);
    mf.focus();
  }

  function insert() {
    const l = latex.trim();
    if (!l) return;
    onInsert(`\\(${l}\\)`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-24 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Insert a formula
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 transition hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-slate-500">
          Type it visually, like Desmos: <code className="rounded bg-slate-100 px-1">/</code>{" "}
          makes a fraction, <code className="rounded bg-slate-100 px-1">^</code> a
          power, <code className="rounded bg-slate-100 px-1">_</code> a subscript,
          and typing <code className="rounded bg-slate-100 px-1">sqrt</code>,{" "}
          <code className="rounded bg-slate-100 px-1">pi</code>,{" "}
          <code className="rounded bg-slate-100 px-1">int</code>,{" "}
          <code className="rounded bg-slate-100 px-1">sum</code> turns into symbols.
        </p>

        <div className="mb-2 flex flex-wrap gap-1">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              title={q.name}
              aria-label={q.name}
              onClick={() => quick(q.cmd)}
              className="flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
            >
              {q.label}
            </button>
          ))}
        </div>

        <EditableMathField
          latex={latex}
          onChange={(mf) => setLatex(mf.latex())}
          mathquillDidMount={(mf) => {
            fieldRef.current = mf;
            mf.focus();
          }}
          config={{
            spaceBehavesLikeTab: true,
            autoCommands:
              "pi theta sqrt sum prod int infty alpha beta gamma delta lambda mu sigma phi omega Delta Sigma",
            autoOperatorNames: "sin cos tan sec csc cot log ln lim",
            handlers: { enter: () => insert() },
          }}
          className="block w-full rounded-lg border border-slate-300 p-3 text-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100"
        />

        <p className="mt-2 text-xs text-slate-400">
          The box above shows your formula as real math. Press Enter or “Insert”.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={insert}
            disabled={!latex.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
