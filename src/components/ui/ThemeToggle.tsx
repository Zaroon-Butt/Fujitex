import { Moon, Sun } from 'lucide-react';
import { toggleTheme, useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** Sun/moon button that flips the storefront between light and dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={cn('p-2 rounded-full transition-colors', className)}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
