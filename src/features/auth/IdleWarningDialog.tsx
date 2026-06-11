import { ShieldAlert } from 'lucide-react';

interface Props {
  open: boolean;
  remainingMs: number;
  onStay: () => void;
  onSignOut: () => void;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function IdleWarningDialog({ open, remainingMs, onStay, onSignOut }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xl dark:border-night-600 dark:bg-night-800">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg text-neutral-900 dark:text-white">Still there?</h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          For security, you will be signed out due to inactivity in{' '}
          <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">
            {formatCountdown(remainingMs)}
          </span>
          .
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onSignOut}
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-night-600 dark:text-neutral-200 dark:hover:bg-night-700"
          >
            Sign out
          </button>
          <button
            onClick={onStay}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
