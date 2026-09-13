import { Suspense, lazy, useState, type RefObject } from "react";
import MathText from "./MathText";

// Lazy-loaded so MathQuill (and its jQuery dependency) only download when the
// user actually opens the formula editor, keeping the initial bundle small.
const FormulaEditor = lazy(() => import("./FormulaEditor"));

// Does the text contain LaTeX (a \( \) / \[ \] group, or a \command)? If so we
// show a live rendered preview, since the raw LaTeX in the box is hard to read.
const HAS_LATEX = /\\\(|\\\[|\\[a-zA-Z]/;

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
  targetRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
  // Whether the palette starts expanded. Big inputs default open; compact
  // inputs (practice answers, chat) start collapsed to save space.
  defaultOpen?: boolean;
};

export default function MathSymbolBar({
  targetRef,
  value,
  onChange,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const showPreview = HAS_LATEX.test(value);

  function insertSymbol(snippet: string) {
    const ta = targetRef.current;
    // Fallback: no ref -> append (marker stripped).
    if (!ta) {
      onChange(value + snippet.replace("▮", ""));
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    const caretMarker = snippet.indexOf("▮");
    // Replace the marker with any selected text (so √(▮) wraps a highlighted
    // expression), or just drop the marker.
    const inserted = snippet.replace("▮", selected);
    const next = value.slice(0, start) + inserted + value.slice(end);
    onChange(next);

    const caret =
      caretMarker >= 0
        ? start + caretMarker + selected.length
        : start + inserted.length;

    // Restore focus + caret after React re-renders.
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
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
            onInsert={(latex) => insertSymbol(latex + " ")}
          />
        </Suspense>
      )}

      {showPreview && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2">
          <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Preview
          </span>
          <MathText
            text={value}
            className="text-sm leading-relaxed text-slate-800"
          />
        </div>
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
                  onClick={() => insertSymbol(sym.insert)}
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
