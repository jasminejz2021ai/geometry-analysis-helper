import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import katex from "katex";

// Imperative handle so the symbol palette / formula editor can insert content
// at the caret without the parent managing DOM selection.
export type MathInputHandle = {
  insertText: (text: string, caretOffset?: number) => void;
  insertLatex: (latex: string) => void;
  focus: () => void;
};

type Props = {
  // Serialized value: prose plus math wrapped as \( ... \).
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  // Enter (no modifier) submits — used by the chat box.
  onEnter?: () => void;
  // Cmd/Ctrl + Enter submits — used by the question and practice boxes.
  onCmdEnter?: () => void;
  ariaLabel?: string;
};

// Matches an inline math group \( ... \) so we can turn it into a chip.
const MATH_GROUP = /\\\(([\s\S]+?)\\\)/g;

function makeChip(latex: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "math-chip";
  span.setAttribute("contenteditable", "false");
  span.dataset.latex = latex;
  try {
    span.innerHTML = katex.renderToString(latex, { throwOnError: false });
  } catch {
    span.textContent = latex;
  }
  return span;
}

// Turn one DOM node into its serialized string form.
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (el.dataset && el.dataset.latex !== undefined) {
      return `\\(${el.dataset.latex}\\)`;
    }
    if (el.tagName === "BR") return "\n";
    // Some browsers wrap new lines in <div>; treat that as a line break.
    const inner = Array.from(el.childNodes).map(serializeNode).join("");
    return el.tagName === "DIV" ? "\n" + inner : inner;
  }
  return "";
}

function serialize(root: HTMLElement): string {
  return Array.from(root.childNodes).map(serializeNode).join("");
}

// Rebuild the editor DOM from a serialized string (used for external changes
// like clearing after submit or clicking an example).
function renderValueToDom(root: HTMLElement, value: string) {
  root.innerHTML = "";
  let last = 0;
  let m: RegExpExecArray | null;
  MATH_GROUP.lastIndex = 0;
  while ((m = MATH_GROUP.exec(value)) !== null) {
    if (m.index > last) {
      root.appendChild(document.createTextNode(value.slice(last, m.index)));
    }
    root.appendChild(makeChip(m[1]));
    last = MATH_GROUP.lastIndex;
  }
  if (last < value.length) {
    root.appendChild(document.createTextNode(value.slice(last)));
  }
}

const MathInput = forwardRef<MathInputHandle, Props>(function MathInput(
  { value, onChange, placeholder, className, onEnter, onCmdEnter, ariaLabel },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Serialized value we last emitted, so the value-sync effect can tell an
  // external change from our own edit (and avoid clobbering the caret).
  const lastValue = useRef<string>("");
  // Last caret position inside the editor, so palette/formula inserts land in
  // the right spot even after focus moved to a button or dialog.
  const savedRange = useRef<Range | null>(null);

  const saveSelection = useCallback(() => {
    const root = rootRef.current;
    const sel = window.getSelection();
    if (root && sel && sel.rangeCount && root.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const emitChange = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const next = serialize(root);
    lastValue.current = next;
    onChange(next);
  }, [onChange]);

  // Pick the range to insert at: the live selection if it's inside the editor,
  // otherwise the last saved caret, otherwise the very end.
  const insertionRange = useCallback((root: HTMLElement): Range => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && root.contains(sel.anchorNode)) {
      return sel.getRangeAt(0);
    }
    if (savedRange.current && root.contains(savedRange.current.startContainer)) {
      return savedRange.current.cloneRange();
    }
    const r = document.createRange();
    r.selectNodeContents(root);
    r.collapse(false);
    return r;
  }, []);

  const placeCaretAfter = useCallback((node: Node) => {
    const sel = window.getSelection();
    const r = document.createRange();
    r.setStartAfter(node);
    r.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(r);
    savedRange.current = r.cloneRange();
  }, []);

  const insertText = useCallback(
    (text: string, caretOffset?: number) => {
      const root = rootRef.current;
      if (!root) return;
      root.focus();
      const range = insertionRange(root);
      range.deleteContents();
      const tn = document.createTextNode(text);
      range.insertNode(tn);
      const sel = window.getSelection();
      const r = document.createRange();
      const off = caretOffset == null ? text.length : Math.min(caretOffset, text.length);
      r.setStart(tn, off);
      r.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(r);
      savedRange.current = r.cloneRange();
      emitChange();
    },
    [emitChange, insertionRange],
  );

  const insertLatex = useCallback(
    (latex: string) => {
      const root = rootRef.current;
      if (!root) return;
      root.focus();
      const range = insertionRange(root);
      range.deleteContents();
      const chip = makeChip(latex);
      range.insertNode(chip);
      // A trailing space so the caret isn't stuck against the chip and the
      // student can keep typing after it.
      const space = document.createTextNode(" ");
      chip.after(space);
      placeCaretAfter(space);
      emitChange();
    },
    [emitChange, insertionRange, placeCaretAfter],
  );

  useImperativeHandle(
    ref,
    () => ({
      insertText,
      insertLatex,
      focus: () => rootRef.current?.focus(),
    }),
    [insertText, insertLatex],
  );

  // Sync external value changes (reset after submit, example buttons) into the
  // DOM. Skip when the change came from our own editing (value === lastValue).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (value !== lastValue.current) {
      renderValueToDom(root, value);
      lastValue.current = value;
    }
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return;
    if ((e.metaKey || e.ctrlKey) && onCmdEnter) {
      e.preventDefault();
      onCmdEnter();
      return;
    }
    if (onEnter && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      onEnter();
      return;
    }
    // Otherwise insert a normal newline (kept as a text node so serialization
    // stays simple and consistent across browsers).
    e.preventDefault();
    insertText("\n");
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Insert clipboard content as plain text so we never get stray HTML.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (text) insertText(text);
  }

  return (
    <div
      ref={rootRef}
      className={`math-input ${className ?? ""}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      onInput={emitChange}
      onKeyUp={saveSelection}
      onMouseUp={saveSelection}
      onBlur={saveSelection}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
});

export default MathInput;
