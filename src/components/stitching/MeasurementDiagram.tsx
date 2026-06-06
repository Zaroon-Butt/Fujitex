import { DIAGRAM_IMAGE } from '@/features/stitching/diagramAsset';
import { DIAGRAM_HOTSPOTS, type MeasurementKey } from '@/features/stitching/measurements';
import { cn } from '@/lib/utils';

interface Props {
  /** The focused field — drives which part of the diagram is highlighted. */
  activeField: MeasurementKey | null;
  activeLabel?: string;
  className?: string;
}

/**
 * Small sizing diagram shown above the measurement form. Renders the reference
 * PNG when available (else a built-in schematic) and overlays a pulsing marker
 * on the part that corresponds to the currently focused input.
 */
export function MeasurementDiagram({ activeField, activeLabel, className }: Props) {
  const hotspot = activeField ? DIAGRAM_HOTSPOTS[activeField] : null;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-night-600 bg-gradient-to-b from-amber-50 to-white dark:from-night-800 dark:to-night-900',
        className,
      )}
      style={{ aspectRatio: '1.79' }}
    >
      {DIAGRAM_IMAGE ? (
        <img src={DIAGRAM_IMAGE} alt="Shalwar kameez measurement guide" className="h-full w-full object-contain" />
      ) : (
        <SchematicFallback />
      )}

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
          {activeLabel && (
            <span className="mt-1 whitespace-nowrap rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-semibold text-white">
              {activeLabel}
            </span>
          )}
        </div>
      )}

      {!activeField && (
        <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/80 dark:bg-night-800/80 px-3 py-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          Tap a measurement to see where it goes
        </span>
      )}
    </div>
  );
}

/** Simple kameez + shalwar outline used until the reference PNG is added. */
function SchematicFallback() {
  return (
    <svg viewBox="0 0 100 56" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeLinejoin="round"
        className="text-brand-400/70 dark:text-brand-300/50"
      >
        {/* Kameez (kurta) */}
        <path d="M22 9 L26 6 L33 6 L37 9 L34 13 L34 50 L18 50 L18 13 Z" />
        {/* collar */}
        <path d="M26 6 Q29.5 9 33 6" />
        {/* placket */}
        <path d="M29.5 8 L29.5 22" />
        {/* left sleeve */}
        <path d="M22 9 L13 14 L16 25 L18 22" />
        {/* right sleeve */}
        <path d="M37 9 L46 14 L43 25 L41 22" />

        {/* Shalwar (trousers) */}
        <path d="M66 8 L82 8 L82 12 L80 50 L75 50 L74 26 L73 50 L68 50 L66 12 Z" />
        <path d="M66 11 L82 11" />
      </g>
    </svg>
  );
}
