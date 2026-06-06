import {
  kameezMeasurements,
  shalwarMeasurements,
  parseMeasurement,
  rangeFor,
  type MeasurementField,
  type MeasurementKey,
  type MeasurementUnit,
  type MeasurementValues,
} from '@/features/stitching/measurements';
import { cn } from '@/lib/utils';

interface Props {
  unit: MeasurementUnit;
  values: MeasurementValues;
  errors: Partial<Record<MeasurementKey, string>>;
  onChange: (key: MeasurementKey, value: number | undefined) => void;
  /** Wires each input's focus to the diagram highlight (null = nothing active). */
  onFocusField: (key: MeasurementKey | null) => void;
  activeField: MeasurementKey | null;
}

export function MeasurementForm({ unit, values, errors, onChange, onFocusField, activeField }: Props) {
  return (
    <div className="space-y-6">
      <FieldGroup
        title="Kameez"
        fields={kameezMeasurements}
        unit={unit}
        values={values}
        errors={errors}
        onChange={onChange}
        onFocusField={onFocusField}
        activeField={activeField}
      />
      <FieldGroup
        title="Shalwar"
        fields={shalwarMeasurements}
        unit={unit}
        values={values}
        errors={errors}
        onChange={onChange}
        onFocusField={onFocusField}
        activeField={activeField}
      />
    </div>
  );
}

function FieldGroup({
  title,
  fields,
  unit,
  values,
  errors,
  onChange,
  onFocusField,
  activeField,
}: Props & { title: string; fields: readonly MeasurementField[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-display text-lg text-ink dark:text-neutral-100 mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => {
          const key = f.key as MeasurementKey;
          const value = values[key];
          const error = errors[key];
          const [min, max] = rangeFor(f, unit);
          const active = activeField === key;
          return (
            <div key={key}>
              <label htmlFor={`m-${key}`} className="input-label">
                {f.label}
              </label>
              <div className="relative">
                <input
                  id={`m-${key}`}
                  type="number"
                  inputMode="decimal"
                  min={min}
                  max={max}
                  step="0.5"
                  value={value === undefined || Number.isNaN(value) ? '' : value}
                  onChange={(e) => onChange(key, parseMeasurement(e.target.value))}
                  onFocus={() => onFocusField(key)}
                  placeholder={`${min}–${max}`}
                  className={cn(
                    'input pr-10',
                    active && 'border-gold-500 ring-1 ring-gold-500',
                    error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
                  )}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 dark:text-neutral-500">
                  {unit}
                </span>
              </div>
              {error && <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
