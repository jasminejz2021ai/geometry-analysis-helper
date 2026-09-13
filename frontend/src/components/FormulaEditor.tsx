import { useEffect, useRef, useState } from "react";
import { addStyles, EditableMathField, type MathField } from "react-mathquill";

// Inject MathQuill's CSS once, when this (lazy-loaded) module first loads.
addStyles();

type Props = {
  open: boolean;
  // Called with the raw LaTeX to insert (the input renders it as a chip).
  onInsert: (latex: string) => void;
  onClose: () => void;
};

// A palette button. `kind: "cmd"` builds a structure with blank slots (e.g.
// \frac, \sqrt, ^, _); everything else is written literally as a symbol.
type Ins = { label: string; latex: string; kind?: "cmd" | "write"; name: string };

const STRUCTURES: Ins[] = [
  { label: "a⁄b", latex: "\\frac", kind: "cmd", name: "fraction" },
  { label: "√", latex: "\\sqrt", kind: "cmd", name: "square root" },
  { label: "xⁿ", latex: "^", kind: "cmd", name: "exponent" },
  { label: "xₙ", latex: "_", kind: "cmd", name: "subscript" },
  { label: "∫", latex: "\\int", kind: "cmd", name: "integral" },
  { label: "∑", latex: "\\sum", kind: "cmd", name: "summation" },
  { label: "∏", latex: "\\prod", kind: "cmd", name: "product" },
  { label: "lim", latex: "\\lim", kind: "cmd", name: "limit" },
  { label: "∂", latex: "\\partial", name: "partial derivative" },
  { label: "∇", latex: "\\nabla", name: "nabla / gradient" },
  { label: "∞", latex: "\\infty", name: "infinity" },
];

const GREEK: Ins[] = [
  { label: "α", latex: "\\alpha", name: "alpha" },
  { label: "β", latex: "\\beta", name: "beta" },
  { label: "γ", latex: "\\gamma", name: "gamma" },
  { label: "δ", latex: "\\delta", name: "delta" },
  { label: "ε", latex: "\\epsilon", name: "epsilon" },
  { label: "ζ", latex: "\\zeta", name: "zeta" },
  { label: "η", latex: "\\eta", name: "eta" },
  { label: "θ", latex: "\\theta", name: "theta" },
  { label: "κ", latex: "\\kappa", name: "kappa" },
  { label: "λ", latex: "\\lambda", name: "lambda" },
  { label: "μ", latex: "\\mu", name: "mu" },
  { label: "ν", latex: "\\nu", name: "nu" },
  { label: "ξ", latex: "\\xi", name: "xi" },
  { label: "π", latex: "\\pi", name: "pi" },
  { label: "ρ", latex: "\\rho", name: "rho" },
  { label: "σ", latex: "\\sigma", name: "sigma" },
  { label: "τ", latex: "\\tau", name: "tau" },
  { label: "φ", latex: "\\phi", name: "phi" },
  { label: "χ", latex: "\\chi", name: "chi" },
  { label: "ψ", latex: "\\psi", name: "psi" },
  { label: "ω", latex: "\\omega", name: "omega" },
  { label: "Γ", latex: "\\Gamma", name: "Gamma" },
  { label: "Δ", latex: "\\Delta", name: "Delta" },
  { label: "Θ", latex: "\\Theta", name: "Theta" },
  { label: "Λ", latex: "\\Lambda", name: "Lambda" },
  { label: "Π", latex: "\\Pi", name: "Pi" },
  { label: "Σ", latex: "\\Sigma", name: "Sigma" },
  { label: "Φ", latex: "\\Phi", name: "Phi" },
  { label: "Ψ", latex: "\\Psi", name: "Psi" },
  { label: "Ω", latex: "\\Omega", name: "Omega" },
];

const RELATIONS: Ins[] = [
  { label: "≤", latex: "\\le", name: "less than or equal" },
  { label: "≥", latex: "\\ge", name: "greater than or equal" },
  { label: "≠", latex: "\\ne", name: "not equal" },
  { label: "≈", latex: "\\approx", name: "approximately" },
  { label: "≡", latex: "\\equiv", name: "equivalent / congruent" },
  { label: "∝", latex: "\\propto", name: "proportional to" },
  { label: "±", latex: "\\pm", name: "plus–minus" },
  { label: "×", latex: "\\times", name: "times" },
  { label: "÷", latex: "\\div", name: "divide" },
  { label: "·", latex: "\\cdot", name: "dot / multiply" },
  { label: "→", latex: "\\to", name: "approaches / to" },
  { label: "⇒", latex: "\\Rightarrow", name: "implies" },
  { label: "⇔", latex: "\\Leftrightarrow", name: "if and only if" },
];

const SETS: Ins[] = [
  { label: "∈", latex: "\\in", name: "element of" },
  { label: "∉", latex: "\\notin", name: "not an element of" },
  { label: "⊂", latex: "\\subset", name: "subset" },
  { label: "⊆", latex: "\\subseteq", name: "subset or equal" },
  { label: "∪", latex: "\\cup", name: "union" },
  { label: "∩", latex: "\\cap", name: "intersection" },
  { label: "∅", latex: "\\emptyset", name: "empty set" },
  { label: "∀", latex: "\\forall", name: "for all" },
  { label: "∃", latex: "\\exists", name: "there exists" },
  { label: "¬", latex: "\\neg", name: "not" },
  { label: "∧", latex: "\\wedge", name: "and" },
  { label: "∨", latex: "\\vee", name: "or" },
];

const GEOMETRY: Ins[] = [
  { label: "∠", latex: "\\angle", name: "angle" },
  { label: "△", latex: "\\triangle", name: "triangle" },
  { label: "⊥", latex: "\\perp", name: "perpendicular" },
  { label: "∥", latex: "\\parallel", name: "parallel" },
  { label: "≅", latex: "\\cong", name: "congruent" },
  { label: "∼", latex: "\\sim", name: "similar" },
  { label: "°", latex: "^{\\circ}", name: "degree" },
];

const PALETTE: { title: string; items: Ins[] }[] = [
  { title: "Structures", items: STRUCTURES },
  { title: "Greek", items: GREEK },
  { title: "Relations", items: RELATIONS },
  { title: "Sets & logic", items: SETS },
  { title: "Geometry", items: GEOMETRY },
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

  function ins(item: Ins) {
    const mf = fieldRef.current;
    if (!mf) return;
    if (item.kind === "cmd") mf.cmd(item.latex);
    else mf.write(item.latex);
    mf.focus();
  }

  function insert() {
    const l = latex.trim();
    if (!l) return;
    onInsert(l);
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
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"
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
              "pi theta sqrt sum prod int infty alpha beta gamma delta epsilon zeta eta kappa lambda mu nu xi rho sigma tau phi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Phi Psi Omega",
            autoOperatorNames: "sin cos tan sec csc cot log ln lim",
            handlers: { enter: () => insert() },
          }}
          className="block w-full rounded-lg border border-slate-300 p-3 text-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100"
        />

        <p className="mt-2 text-xs text-slate-400">
          Click a symbol to add it, or just type. Press Enter or “Insert”.
        </p>

        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/60 p-2">
          {PALETTE.map((group) => (
            <div key={group.title}>
              <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.items.map((item) => (
                  <button
                    key={group.title + item.label}
                    type="button"
                    title={item.name}
                    aria-label={item.name}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => ins(item)}
                    className="flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

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
