/**
 * Decorative, non-interactive background: graph paper plus a few softly
 * floating shapes in Gunn red and ink black. Sits behind all content and
 * ignores pointer events.
 */
export default function GeometryBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Graph paper: fine grid with a heavier line every 5 squares */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-fine" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#111111" strokeWidth="0.5" opacity="0.06" />
          </pattern>
          <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="url(#grid-fine)" />
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#c8102e" strokeWidth="0.8" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating shapes */}
      <svg className="geo-float absolute left-[5%] top-[18%] h-24 w-24 text-brand-600" viewBox="0 0 100 100">
        <polygon points="50,8 92,88 8,88" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.28" />
      </svg>

      <svg className="geo-float-slow absolute right-[7%] top-[26%] h-28 w-28 text-ink" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 7" opacity="0.18" />
      </svg>

      <svg className="geo-float-rev absolute bottom-[12%] left-[9%] h-20 w-20 text-ink" viewBox="0 0 100 100">
        <rect x="14" y="14" width="72" height="72" rx="6" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.16" transform="rotate(12 50 50)" />
      </svg>

      <svg className="geo-float absolute bottom-[16%] right-[11%] h-24 w-24 text-brand-600" viewBox="0 0 100 100">
        <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.22" />
      </svg>

      <svg className="geo-float-slow absolute left-[46%] top-[55%] h-16 w-16 text-brand-600" viewBox="0 0 100 100">
        <polygon points="50,10 90,90 10,90" fill="currentColor" opacity="0.08" />
      </svg>

      {/* Soft warm glow for depth */}
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-200 opacity-25 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-brand-100 opacity-30 blur-3xl" />
    </div>
  );
}
