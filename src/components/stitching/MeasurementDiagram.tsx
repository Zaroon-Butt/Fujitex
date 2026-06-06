import { DIAGRAM_IMAGE } from '@/features/stitching/diagramAsset';
import { DIAGRAM_HOTSPOTS, type MeasurementKey } from '@/features/stitching/measurements';
import { cn } from '@/lib/utils';

interface Props {
  /** The focused field — drives which part of the diagram is highlighted. */
  activeField: MeasurementKey | null;
  activeLabel?: string;
  className?: string;
}

/* ---------------------------------------------------------------------------
 * Diagram geometry. The SVG below is authored in a 1000×560 user space (same
 * 25:14 aspect ratio as the container). For each measurement we store a
 * double-headed arrow showing what is being measured plus the yellow numbered
 * badge that labels it — mirroring the reference shalwar-kameez sizing chart.
 * `n` matches the number printed in DIAGRAM_HOTSPOTS so web + the PNG agree.
 * ------------------------------------------------------------------------- */
const VB_W = 1000;
const VB_H = 560;

interface Arrow {
  n: number;
  /** Double-headed measurement line. */
  line: [x1: number, y1: number, x2: number, y2: number];
  /** Yellow numbered badge centre. */
  badge: [x: number, y: number];
  /** Optional point on the garment the badge connects to (for offset badges). */
  lead?: [x: number, y: number];
}

const ARROWS: Record<MeasurementKey, Arrow> = {
  // Kameez
  kameezLength: { n: 1, line: [148, 92, 148, 480], badge: [148, 286] },
  shoulder: { n: 2, line: [248, 106, 412, 106], badge: [330, 106] },
  chest: { n: 3, line: [256, 205, 404, 205], badge: [330, 205] },
  waist: { n: 4, line: [252, 300, 408, 300], badge: [330, 300] },
  hips: { n: 5, line: [244, 388, 416, 388], badge: [330, 388] },
  armhole: { n: 6, line: [250, 104, 252, 186], badge: [205, 150], lead: [251, 150] },
  collar: { n: 7, line: [305, 74, 355, 74], badge: [330, 48], lead: [330, 73] },
  cuff: { n: 8, line: [464, 314, 485, 285], badge: [516, 320], lead: [474, 299] },
  sleeveLength: { n: 12, line: [418, 100, 476, 290], badge: [520, 205], lead: [447, 195] },
  ghair: { n: 11, line: [238, 502, 422, 502], badge: [330, 502] },
  // Shalwar
  shalwarWaist: { n: 11, line: [690, 106, 830, 106], badge: [760, 106] },
  shalwarLength: { n: 9, line: [862, 122, 856, 488], badge: [888, 305], lead: [859, 305] },
  paancha: { n: 10, line: [700, 503, 736, 503], badge: [718, 503] },
};

const GOLD = '#f5b301';
const ARROW_MUTED = '#94a3b8';
const INK = '#1c1917';

/**
 * Sizing diagram shown above the measurement form. Renders the reference PNG
 * when available (with a pulsing marker overlay), otherwise a fully annotated
 * built-in schematic with measurement arrows + numbered badges. The arrow/badge
 * for the currently focused input is highlighted in gold.
 */
export function MeasurementDiagram({ activeField, activeLabel, className }: Props) {
  const hotspot = activeField ? DIAGRAM_HOTSPOTS[activeField] : null;

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-night-600 bg-gradient-to-b from-amber-50 to-white dark:from-night-800 dark:to-night-900',
        className,
      )}
    >
      {/* Diagram surface — the artwork fills this box exactly (no overlap). */}
      <div className="relative w-full" style={{ aspectRatio: '25 / 14' }}>
        {DIAGRAM_IMAGE ? (
          <>
            <img src={DIAGRAM_IMAGE} alt="Shalwar kameez measurement guide" className="h-full w-full object-contain" />
            {hotspot && (
              <div
                className="pointer-events-none absolute z-10 flex flex-col items-center"
                style={{ left: `${hotspot.x * 100}%`, top: `${hotspot.y * 100}%`, transform: 'translate(-50%, -50%)' }}
              >
                <span className="relative flex h-7 w-7 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-70" />
                  <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-[11px] font-bold text-ink shadow">
                    {hotspot.n}
                  </span>
                </span>
              </div>
            )}
          </>
        ) : (
          <SchematicDiagram activeField={activeField} />
        )}
      </div>

      {/* Caption strip below the artwork: helper hint, or the focused measurement's name. */}
      <div className="flex min-h-[2.25rem] items-center justify-center border-t border-neutral-200/70 px-3 py-1.5 text-center dark:border-night-700">
        {activeField && activeLabel ? (
          <span className="text-xs font-semibold text-gold-600 dark:text-gold-400">{activeLabel}</span>
        ) : (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Tap a measurement to see where it goes</span>
        )}
      </div>
    </div>
  );
}

/** Padded bounding box around an arrow + its badge — drives the highlight box. */
function spotlightBox(a: Arrow) {
  const xs = [a.line[0], a.line[2], a.badge[0]];
  const ys = [a.line[1], a.line[3], a.badge[1]];
  if (a.lead) {
    xs.push(a.lead[0]);
    ys.push(a.lead[1]);
  }
  const pad = 30;
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX - pad, y: minY - pad, w: Math.max(...xs) - minX + pad * 2, h: Math.max(...ys) - minY + pad * 2 };
}

/** Annotated kameez + shalwar schematic with measurement arrows + badges. */
function SchematicDiagram({ activeField }: { activeField: MeasurementKey | null }) {
  const entries = Object.entries(ARROWS) as [MeasurementKey, Arrow][];
  const focused = activeField != null;
  const spot = activeField ? spotlightBox(ARROWS[activeField]) : null;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs>
        <marker id="mk-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9" fill="none" stroke="context-stroke" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {/* ---- Spotlight box around the focused measurement ---- */}
      {spot && (
        <rect
          x={spot.x}
          y={spot.y}
          width={spot.w}
          height={spot.h}
          rx={22}
          ry={22}
          fill={GOLD}
          fillOpacity={0.13}
          stroke={GOLD}
          strokeOpacity={0.45}
          strokeWidth={1.5}
        />
      )}

      {/* ---- Garment outlines (faded when one measurement is focused) ---- */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={focused ? 0.45 : 1}
        className="text-brand-500/80 dark:text-brand-300/60"
      >
        {/* Kameez (long-sleeve kurta) */}
        <path d="M305 72 L245 92 L175 285 L196 314 L252 188 L238 480 L422 480 L408 188 L464 314 L485 285 L415 92 L355 72 Q330 96 305 72 Z" />
        {/* stand collar */}
        <path d="M305 72 Q330 58 355 72" />
        {/* front placket */}
        <path d="M330 96 L330 210" strokeWidth={2.2} />
        {/* buttons */}
        <circle cx={330} cy={120} r={3.2} />
        <circle cx={330} cy={150} r={3.2} />
        <circle cx={330} cy={180} r={3.2} />

        {/* Shalwar (trousers) */}
        <path d="M690 122 L700 488 L736 488 L760 312 L784 488 L820 488 L830 122 Z" />
        <path d="M690 152 L830 152" strokeWidth={2.2} />
        {/* drawstring */}
        <path d="M752 152 L748 176 M768 152 L772 176" strokeWidth={2} />
      </g>

      {/* ---- Measurement arrows (inactive first, active last so it sits on top) ---- */}
      {entries.map(([key, a]) => {
        const active = key === activeField;
        if (active) return null;
        return (
          <line
            key={key}
            x1={a.line[0]}
            y1={a.line[1]}
            x2={a.line[2]}
            y2={a.line[3]}
            stroke={ARROW_MUTED}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={focused ? 0.12 : 1}
            markerStart="url(#mk-arrow)"
            markerEnd="url(#mk-arrow)"
          />
        );
      })}
      {activeField && (
        <line
          x1={ARROWS[activeField].line[0]}
          y1={ARROWS[activeField].line[1]}
          x2={ARROWS[activeField].line[2]}
          y2={ARROWS[activeField].line[3]}
          stroke={GOLD}
          strokeWidth={3.5}
          strokeLinecap="round"
          markerStart="url(#mk-arrow)"
          markerEnd="url(#mk-arrow)"
        />
      )}

      {/* ---- Yellow numbered badges ---- */}
      {entries.map(([key, a]) => {
        const active = key === activeField;
        const [bx, by] = a.badge;
        const r = active ? 17 : 14;
        return (
          <g key={`b-${key}`} opacity={focused && !active ? 0.16 : 1}>
            {a.lead && (
              <line x1={bx} y1={by} x2={a.lead[0]} y2={a.lead[1]} stroke={active ? GOLD : ARROW_MUTED} strokeWidth={1.5} />
            )}
            {active && (
              <circle cx={bx} cy={by} r={r} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.7}>
                <animate attributeName="r" values={`${r};${r + 14}`} dur="1.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0" dur="1.3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={bx} cy={by} r={r} fill={GOLD} stroke="#ffffff" strokeWidth={active ? 2.5 : 1.5} />
            <text
              x={bx}
              y={by}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={active ? 17 : 15}
              fontWeight={700}
              fill={INK}
            >
              {a.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
