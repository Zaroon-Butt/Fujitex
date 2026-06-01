import { Feather } from 'lucide-react';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Render the "Fujitex" wordmark next to the mark. */
  showText?: boolean;
  /** Mark square size in px. */
  size?: number;
  /** Wrapper classes. */
  className?: string;
  /** Wordmark color override (e.g. `text-white` over the hero). */
  textClassName?: string;
}

/** The emerald Fujitex brand mark — a gold feather in an emerald gradient tile,
 *  matching the mobile app's brand identity. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      style={{ height: size, width: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 shadow-sm shadow-brand-700/30 ring-1 ring-white/10',
        className,
      )}
    >
      <Feather size={Math.round(size * 0.55)} className="text-gold-300" strokeWidth={2.2} />
    </span>
  );
}

/** Brand mark + optional wordmark, used in the header, footer and admin nav. */
export function Logo({ showText = true, size = 36, className, textClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showText && (
        <span className={cn('font-display text-2xl font-semibold tracking-tight', textClassName)}>
          {env.STORE_NAME}
        </span>
      )}
    </span>
  );
}
