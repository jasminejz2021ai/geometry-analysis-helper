/**
 * Decorative, non-interactive geometry background: a faint grid plus a set of
 * softly floating shapes (triangle, circle, square, hexagon). Purely visual;
 * sits behind all content and ignores pointer events.
 */
export default function GeometryBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Faint coordinate grid */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.5"
              opacity="0.08"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating shapes */}
      <svg
        className="geo-float absolute left-[6%] top-[14%] h-24 w-24 text-brand-400"
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,8 92,88 8,88"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.35"
        />
      </svg>

      <svg
        className="geo-float-slow absolute right-[8%] top-[10%] h-28 w-28 text-indigo-300"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.3"
        />
      </svg>

      <svg
        className="geo-float-rev absolute bottom-[12%] left-[10%] h-20 w-20 text-sky-300"
        viewBox="0 0 100 100"
      >
        <rect
          x="14"
          y="14"
          width="72"
          height="72"
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.3"
          transform="rotate(12 50 50)"
        />
      </svg>

      <svg
        className="geo-float absolute bottom-[18%] right-[12%] h-24 w-24 text-violet-300"
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.3"
        />
      </svg>

      <svg
        className="geo-float-slow absolute left-[46%] top-[6%] h-16 w-16 text-brand-300"
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,10 90,90 10,90"
          fill="currentColor"
          opacity="0.12"
        />
      </svg>

      {/* Soft color blobs for depth */}
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-200 opacity-20 blur-3xl" />
      <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-sky-200 opacity-20 blur-3xl" />
    </div>
  );
}
