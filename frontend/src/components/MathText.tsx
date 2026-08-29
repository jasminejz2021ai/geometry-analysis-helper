import { useMemo, type ReactNode } from "react";
import katex from "katex";

type Props = {
  text: string;
  className?: string;
};

type Segment = { type: "text" | "math"; value: string; display: boolean };

// Explicit math delimiters: \( \), $ $ (inline) and \[ \], $$ $$ (display).
const DELIMITED =
  /\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)|\$([^$]+?)\$/g;

// Heuristic for math written WITHOUT delimiters. Two cases:
//  1. a LaTeX command, optionally with a braced argument: \pi, \sqrt{4},
//     \text{Use }, \Rightarrow, \frac{a}{b} (we grab following {...} groups).
//  2. tokens with sub/superscripts: F_{n-1}, x^2, F_0.
// Kept conservative so ordinary prose is left alone, but broad enough that a
// step like "b = \sqrt{68^2 - 32^2}" or "\text{Use } a^2 = c^2" renders.
const BARE_MATH =
  /(\\[a-zA-Z]+(?:\s*\{[^{}]*\})*|[A-Za-z0-9()]+(?:[_^]\{[^}]*\}|[_^][A-Za-z0-9]+)+|[A-Za-z0-9]+[_^][A-Za-z0-9{}+\-]+)/g;

// Does a run contain any LaTeX command? If so we widen the math span to cover
// neighbouring math-ish tokens (numbers, operators, =, +, -, parentheses) so
// something like "b = \sqrt{68^2 - 32^2} = 60" renders as one expression
// instead of leaving "= 60" or a stray "\text" outside the math.
const HAS_COMMAND = /\\[a-zA-Z]+/;

function pushText(segments: Segment[], value: string) {
  if (!value) return;
  // A LaTeX control-space ("\ ") that leaked into prose renders as a literal
  // backslash; collapse it to a normal space here as a safety net.
  value = value.replace(/\\ +/g, " ");
  // If the run contains any LaTeX command (e.g. an undelimited step like
  // "b = \sqrt{68^2 - 32^2} = 60 \text{cm}"), render the ENTIRE run as one
  // math expression. KaTeX handles the surrounding "=", numbers and text fine,
  // and this avoids leaving stray "\sqrt"/"\text" tokens as literal prose.
  if (HAS_COMMAND.test(value)) {
    segments.push({ type: "math", value: value.trim(), display: false });
    return;
  }
  // Otherwise promote only bare-LaTeX tokens (subscripts/superscripts like
  // "F_{n-1}", "x^2") to math and keep the rest as plain text.
  let last = 0;
  let m: RegExpExecArray | null;
  BARE_MATH.lastIndex = 0;
  while ((m = BARE_MATH.exec(value)) !== null) {
    if (m.index > last) {
      segments.push({ type: "text", value: value.slice(last, m.index), display: false });
    }
    segments.push({ type: "math", value: m[0], display: false });
    last = BARE_MATH.lastIndex;
  }
  if (last < value.length) {
    segments.push({ type: "text", value: value.slice(last), display: false });
  }
}

function splitSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  DELIMITED.lastIndex = 0;
  while ((m = DELIMITED.exec(input)) !== null) {
    if (m.index > last) pushText(segments, input.slice(last, m.index));
    const display = m[1] !== undefined || m[2] !== undefined;
    const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
    segments.push({ type: "math", value, display });
    last = DELIMITED.lastIndex;
  }
  if (last < input.length) pushText(segments, input.slice(last));
  return segments;
}

function renderMath(value: string, display: boolean): string {
  try {
    return katex.renderToString(value, { displayMode: display, throwOnError: false });
  } catch {
    // Graceful fallback: never surface raw LaTeX markup to the student. Strip
    // the most common command noise so it reads as plain text instead.
    const escaped = value
      .replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, " ")
      .replace(/\\left|\\right/g, "")
      .replace(/\\[a-zA-Z]+/g, "")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return escaped
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

// Render a plain-text run, turning Markdown-style **bold** into real bold text
// (LLMs sometimes leave these markers, which otherwise show as literal "**").
function renderTextRun(value: string, keyBase: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([\s\S]+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) {
      nodes.push(<span key={`${keyBase}-t${idx++}`}>{value.slice(last, m.index)}</span>);
    }
    nodes.push(<strong key={`${keyBase}-b${idx++}`}>{m[1]}</strong>);
    last = re.lastIndex;
  }
  if (last < value.length) {
    nodes.push(<span key={`${keyBase}-t${idx++}`}>{value.slice(last)}</span>);
  }
  return nodes;
}

export default function MathText({ text, className }: Props) {
  // Split into lines first (real newlines mark intended breaks, e.g. multiple-
  // choice options), then render each line's inline math/text segments. Lines
  // get a little vertical spacing so they're easy to read.
  const lines = useMemo(() => (text ?? "").split("\n"), [text]);
  const perLine = useMemo(
    () => lines.map((line) => splitSegments(line)),
    [lines],
  );
  const multiline = lines.length > 1;

  return (
    <span className={className}>
      {perLine.map((segments, li) => {
        const inner = segments.map((seg, i) =>
          seg.type === "text" ? (
            <span key={i}>{renderTextRun(seg.value, i)}</span>
          ) : (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderMath(seg.value, seg.display) }}
            />
          ),
        );
        if (!multiline) return <span key={li}>{inner}</span>;
        return (
          <span key={li} className={li > 0 ? "block mt-1.5" : "block"}>
            {inner}
          </span>
        );
      })}
    </span>
  );
}
