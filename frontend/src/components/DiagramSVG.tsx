import type {
  CircleDiagram,
  CoordinateDiagram,
  Diagram,
  RectangleDiagram,
  TriangleDiagram,
} from "../types";

const STROKE = "#4f46e5";
const FILL = "#e0e7ff";

function Triangle({ d }: { d: TriangleDiagram }) {
  // Draw a generic right triangle. Vertices: right angle at bottom-left.
  const W = 220;
  const H = 160;
  const pad = 30;
  // Extra room on the left/bottom/right so wide side labels are not clipped.
  const mL = 40;
  const mB = 26;
  const mR = 30;
  const p1 = { x: pad, y: H - pad }; // right angle corner
  const p2 = { x: W - pad, y: H - pad }; // along base (side a)
  const p3 = { x: pad, y: pad }; // up (side b)

  return (
    <svg
      viewBox={`${-mL} 0 ${W + mL + mR} ${H + mB}`}
      className="w-full max-w-xs overflow-visible"
    >
      <polygon
        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth={2}
      />
      {d.right_angle && (
        <path
          d={`M ${p1.x + 14} ${p1.y} L ${p1.x + 14} ${p1.y - 14} L ${p1.x} ${p1.y - 14}`}
          fill="none"
          stroke={STROKE}
          strokeWidth={1.5}
        />
      )}
      {d.labels.a && (
        <text x={(p1.x + p2.x) / 2} y={p1.y + 18} textAnchor="middle" fontSize={12}>
          {d.labels.a}
        </text>
      )}
      {d.labels.b && (
        <text x={p1.x - 8} y={(p1.y + p3.y) / 2} textAnchor="end" fontSize={12}>
          {d.labels.b}
        </text>
      )}
      {d.labels.c && (
        <text
          x={(p2.x + p3.x) / 2 + 6}
          y={(p2.y + p3.y) / 2 - 6}
          textAnchor="start"
          fontSize={12}
        >
          {d.labels.c}
        </text>
      )}
    </svg>
  );
}

function Circle({ d }: { d: CircleDiagram }) {
  const W = 200;
  const H = 200;
  const cx = W / 2;
  const cy = H / 2;
  const r = 70;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[200px] overflow-visible">
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth={2} />
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={STROKE} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={2.5} fill={STROKE} />
      {d.labels.radius && (
        <text x={cx + r / 2} y={cy - 6} textAnchor="middle" fontSize={12}>
          {d.labels.radius}
        </text>
      )}
    </svg>
  );
}

function Rectangle({ d }: { d: RectangleDiagram }) {
  const W = 240;
  const H = 170;
  const pad = 30;
  // Extra room on the left/bottom so wide side labels (e.g. "72 cm") are not
  // clipped by the viewBox edge.
  const mL = 40;
  const mB = 26;
  const w = W - 2 * pad;
  const h = H - 2 * pad;
  return (
    <svg
      viewBox={`${-mL} 0 ${W + mL} ${H + mB}`}
      className="w-full max-w-xs overflow-visible"
    >
      <rect
        x={pad}
        y={pad}
        width={w}
        height={h}
        fill={FILL}
        stroke={STROKE}
        strokeWidth={2}
      />
      {d.labels.width && (
        <text x={W / 2} y={H - pad + 18} textAnchor="middle" fontSize={12}>
          {d.labels.width}
        </text>
      )}
      {d.labels.height && (
        <text x={pad - 8} y={H / 2} textAnchor="end" fontSize={12}>
          {d.labels.height}
        </text>
      )}
    </svg>
  );
}

function Coordinate({ d }: { d: CoordinateDiagram }) {
  const W = 220;
  const H = 220;
  const cx = W / 2;
  const cy = H / 2;
  // Scale so points fit; find max abs coordinate.
  const maxAbs = Math.max(
    5,
    ...d.points.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)]),
  );
  const scale = (W / 2 - 20) / maxAbs;
  const tx = (x: number) => cx + x * scale;
  const ty = (y: number) => cy - y * scale;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[220px] overflow-visible">
      <line x1={0} y1={cy} x2={W} y2={cy} stroke="#cbd5e1" strokeWidth={1} />
      <line x1={cx} y1={0} x2={cx} y2={H} stroke="#cbd5e1" strokeWidth={1} />
      {d.points.length === 2 && (
        <line
          x1={tx(d.points[0][0])}
          y1={ty(d.points[0][1])}
          x2={tx(d.points[1][0])}
          y2={ty(d.points[1][1])}
          stroke={STROKE}
          strokeWidth={2}
        />
      )}
      {d.points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={tx(x)} cy={ty(y)} r={4} fill={STROKE} />
          <text x={tx(x) + 6} y={ty(y) - 6} fontSize={11}>
            {d.labels[i] ?? ""}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function DiagramSVG({ diagram }: { diagram: Diagram }) {
  switch (diagram.kind) {
    case "triangle":
      return <Triangle d={diagram} />;
    case "circle":
      return <Circle d={diagram} />;
    case "rectangle":
      return <Rectangle d={diagram} />;
    case "coordinate":
      return <Coordinate d={diagram} />;
    default:
      return null;
  }
}
