import { Suspense, lazy, useState, type RefObject } from "react";
import type { MathInputHandle } from "./MathInput";

// Lazy-loaded so MathQuill (and its jQuery dependency) only download when the
// user actually opens the formula editor, keeping the initial bundle small.
const FormulaEditor = lazy(() => import("./FormulaEditor"));

// A palette entry: what's shown on the button, what gets inserted, and a
// tooltip name. A "▮" in `insert` marks where the cursor lands, e.g. "√(▮)".
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

const CALCULUS: Sym[] = [
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

const GEOMETRY: Sym[] = [
  { label: "∠", insert: "∠", name: "angle" },
  { label: "△", insert: "△", name: "triangle" },
  { label: "⊥", insert: "⊥", name: "perpendicular" },
  { label: "∥", insert: "∥", name: "parallel" },
  { label: "≅", insert: "≅", name: "congruent" },
  { label: "∼", insert: "∼", name: "similar" },
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

// The full palette is shown everywhere so no symbol is ever missing,
// regardless of subject.
const GROUPS: { key: string; syms: Sym[] }[] = [
  { key: "basic", syms: BASIC },
  { key: "calc", syms: CALCULUS },
  { key: "geo", syms: GEOMETRY },
  { key: "greek", syms: GREEK },
];

type Props = {
  editorRef: RefObject<MathInputHandle | null>;
  // Whether the palette starts expanded. Big inputs default open; compact
  // inputs (practice answers, chat) start collapsed to save space.
  defaultOpen?: boolean;
};

export default function MathSymbolBar({ editorRef, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [formulaOpen, setFormulaOpen] = useState(false);

  function insertSym(insert: string) {
    const marker = insert.indexOf("▮");
    if (marker >= 0) {
      editorRef.current?.insertText(insert.replace("▮", ""), marker);
    } else {
      editorRef.current?.insertText(insert);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 transition hover:text-slate-600"
          aria-expanded={open}
        >
          <span className="text-sm normal-case text-slate-500">∑</span>
          Math symbols
          <span className="text-slate-400">{open ? "▲" : "▼"}</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setFormulaOpen(true)}
          className="flex items-center gap-1 rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
          title="Open a live editor to build a formula visually (fractions, roots, integrals…)"
        >
          <span className="italic">fx</span> Insert formula
        </button>
      </div>

      {formulaOpen && (
        <Suspense fallback={null}>
          <FormulaEditor
            open={formulaOpen}
            onClose={() => setFormulaOpen(false)}
            onInsert={(latex) => editorRef.current?.insertLatex(latex)}
          />
        </Suspense>
      )}

      {open && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {GROUPS.map((group, gi) => (
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
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertSym(sym.insert)}
                  className="flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 text-sm text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {sym.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
