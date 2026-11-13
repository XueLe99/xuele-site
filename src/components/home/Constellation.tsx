/**
 * Static SVG constellation: one star per skill item, joined by a single path.
 *
 * Hooks for the later animation phase:
 * - `[data-constellation-line]` has pathLength=1 → stroke-dashoffset draw-in
 * - `[data-star="<i>"]` pairs with the chip `[data-star-chip="<i>"]` in the same card
 */

type Point = readonly [number, number];

const W = 160;
const H = 96;

/** Hand-placed layouts, keyed by skill group id. */
const LAYOUTS: Record<string, readonly Point[]> = {
  programming: [
    [22, 68],
    [76, 24],
    [136, 56],
  ],
  vision: [
    [12, 62],
    [36, 26],
    [62, 54],
    [86, 18],
    [108, 60],
    [130, 32],
    [148, 74],
  ],
  tools: [
    [40, 64],
    [120, 30],
  ],
  systems: [
    [34, 32],
    [124, 66],
  ],
  interdisciplinary: [
    [24, 32],
    [82, 72],
    [138, 26],
  ],
};

/** Faint background specks, shared by all cards. */
const DUST: readonly Point[] = [
  [8, 14],
  [52, 84],
  [98, 40],
  [118, 86],
  [152, 12],
  [66, 8],
];

function fallbackLayout(count: number): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? W / 2 : 16 + (i * (W - 32)) / (count - 1);
    const y = i % 2 === 0 ? 64 : 30;
    return [Math.round(x), y] as const;
  });
}

export function Constellation({
  groupId,
  count,
  label,
}: {
  groupId: string;
  count: number;
  label: string;
}) {
  const layout = LAYOUTS[groupId];
  const points = layout?.length === count ? layout : fallbackLayout(count);
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      data-constellation={groupId}
      className="h-24 w-40 shrink-0 overflow-visible"
    >
      {DUST.map(([x, y], i) => (
        <circle key={`d${i}`} cx={x} cy={y} r="0.7" className="fill-muted opacity-50" />
      ))}
      <path
        d={d}
        pathLength={1}
        data-constellation-line
        fill="none"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary opacity-50"
      />
      {points.map(([x, y], i) => (
        <g key={i} data-star={i}>
          <circle cx={x} cy={y} r="6" className="fill-accent opacity-15" />
          <circle cx={x} cy={y} r="2.5" className="fill-accent" />
        </g>
      ))}
    </svg>
  );
}
