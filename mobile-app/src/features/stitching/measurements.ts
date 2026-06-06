// Stitching domain: measurement field definitions, units, validation, and the
// diagram hotspot map. Framework-agnostic on purpose — kept in sync verbatim
// with the web app (src/features/stitching/measurements.ts).

export type MeasurementUnit = 'in' | 'cm';

export const GARMENT_TYPE = 'mens_shalwar_kameez' as const;

/** Fallback stitching fee (paisas) used when the DB option row can't be read. */
export const DEFAULT_STITCHING_PAISAS = 250000; // PKR 2,500

export interface MeasurementField {
  key: string;
  label: string;
  /** Reasonable adult-male range, defined in inches; converted ×2.54 for cm. */
  minIn: number;
  maxIn: number;
}

/** Kameez (shirt) measurements — keys/labels per the product spec. */
export const kameezMeasurements = [
  { key: 'kameezLength', label: 'Kameez Length',  minIn: 36, maxIn: 56 },
  { key: 'shoulder',     label: 'Shoulder Width',  minIn: 14, maxIn: 24 },
  { key: 'chest',        label: 'Chest Width',     minIn: 18, maxIn: 52 },
  { key: 'waist',        label: 'Waist Width',     minIn: 16, maxIn: 52 },
  { key: 'hips',         label: 'Hip Width',       minIn: 18, maxIn: 56 },
  { key: 'armhole',      label: 'Armhole Width',   minIn: 12, maxIn: 28 },
  { key: 'collar',       label: 'Collar Size',     minIn: 12, maxIn: 22 },
  { key: 'cuff',         label: 'Cuff Width',      minIn: 7,  maxIn: 16 },
  { key: 'sleeveLength', label: 'Sleeve Length',   minIn: 18, maxIn: 30 },
  { key: 'ghair',        label: 'Bottom Width',    minIn: 18, maxIn: 60 },
] as const satisfies readonly MeasurementField[];

/** Shalwar (trouser) measurements. */
export const shalwarMeasurements = [
  { key: 'shalwarWaist',  label: 'Waist Width',       minIn: 24, maxIn: 54 },
  { key: 'shalwarLength', label: 'Shalwar Length',    minIn: 34, maxIn: 48 },
  { key: 'paancha',       label: 'Leg Opening Width', minIn: 6,  maxIn: 18 },
] as const satisfies readonly MeasurementField[];

export type KameezKey = (typeof kameezMeasurements)[number]['key'];
export type ShalwarKey = (typeof shalwarMeasurements)[number]['key'];
export type MeasurementKey = KameezKey | ShalwarKey;

export const allMeasurementFields: readonly MeasurementField[] = [
  ...kameezMeasurements,
  ...shalwarMeasurements,
];

/** Partial during entry; complete & validated before it becomes an order line. */
export type MeasurementValues = Partial<Record<MeasurementKey, number>>;

/**
 * Normalized (0–1) hotspots on the reference diagram — where to draw the
 * highlight when a field is focused. `n` is the number printed on the diagram.
 * The kameez occupies the left ~60% of the image, the shalwar the right ~40%.
 */
export const DIAGRAM_HOTSPOTS: Record<MeasurementKey, { x: number; y: number; n: number }> = {
  // Kameez
  collar:       { x: 0.27, y: 0.13, n: 7 },
  shoulder:     { x: 0.34, y: 0.16, n: 2 },
  armhole:      { x: 0.19, y: 0.27, n: 6 },
  chest:        { x: 0.27, y: 0.33, n: 3 },
  sleeveLength: { x: 0.43, y: 0.40, n: 12 },
  waist:        { x: 0.27, y: 0.46, n: 4 },
  cuff:         { x: 0.44, y: 0.57, n: 8 },
  hips:         { x: 0.27, y: 0.58, n: 5 },
  kameezLength: { x: 0.20, y: 0.72, n: 1 },
  ghair:        { x: 0.27, y: 0.86, n: 11 },
  // Shalwar
  shalwarWaist:  { x: 0.74, y: 0.14, n: 11 },
  shalwarLength: { x: 0.84, y: 0.50, n: 9 },
  paancha:       { x: 0.74, y: 0.86, n: 10 },
};

const CM_PER_IN = 2.54;

/** Convert a value between units, rounded to 1 decimal. Returns undefined as-is. */
export function convertValue(
  value: number | undefined,
  from: MeasurementUnit,
  to: MeasurementUnit,
): number | undefined {
  if (value === undefined || Number.isNaN(value)) return value;
  if (from === to) return value;
  const next = to === 'cm' ? value * CM_PER_IN : value / CM_PER_IN;
  return Math.round(next * 10) / 10;
}

/** The valid [min, max] range for a field in the given unit. */
export function rangeFor(field: MeasurementField, unit: MeasurementUnit): [number, number] {
  if (unit === 'in') return [field.minIn, field.maxIn];
  return [Math.round(field.minIn * CM_PER_IN), Math.round(field.maxIn * CM_PER_IN)];
}

/**
 * Validate every field: present, numeric, and within a reasonable range for the
 * selected unit. Returns a map of key -> error message (empty when all valid).
 */
export function validateMeasurements(
  values: MeasurementValues,
  unit: MeasurementUnit,
): Partial<Record<MeasurementKey, string>> {
  const errors: Partial<Record<MeasurementKey, string>> = {};
  for (const field of allMeasurementFields) {
    const v = values[field.key as MeasurementKey];
    if (v === undefined || Number.isNaN(v)) {
      errors[field.key as MeasurementKey] = 'Required';
      continue;
    }
    if (v <= 0) {
      errors[field.key as MeasurementKey] = 'Must be greater than 0';
      continue;
    }
    const [min, max] = rangeFor(field, unit);
    if (v < min || v > max) {
      errors[field.key as MeasurementKey] = `Enter ${min}–${max} ${unit}`;
    }
  }
  return errors;
}

/** Parse free text from a numeric input into a number | undefined (NaN if junk). */
export function parseMeasurement(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
}
