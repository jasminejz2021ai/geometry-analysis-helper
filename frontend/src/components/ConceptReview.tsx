import MathText from "./MathText";

type Props = {
  items: string[];
  embedded?: boolean;
};

export default function ConceptReview({ items, embedded = false }: Props) {
  if (!items || items.length === 0) return null;

  const containerClass = embedded
    ? ""
    : "rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-lg shadow-amber-900/5 ring-1 ring-amber-100 backdrop-blur-sm";

  return (
    <div className={containerClass}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 3a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.3A7 7 0 0 0 12 3Z" />
            <path d="M9 21h6" />
          </svg>
        </span>
        <h2 className="text-lg font-semibold text-slate-900">Concept review</h2>
      </div>
      <p className="mb-3 text-sm text-slate-500">
        Key ideas and formulas to know before the worked example.
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-800">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <MathText text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
