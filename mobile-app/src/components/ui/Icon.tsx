import { Feather } from '@expo/vector-icons';
import { ms, useColors } from '@/theme';

export type IconName = keyof typeof Feather.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/**
 * Thin wrapper over Feather (the icon family lucide-react is built on — keeps
 * the mobile iconography matched to the web storefront). Defaults to the active
 * theme's text color when no explicit color is given.
 *
 * `size` is treated as a design value at the ~5" baseline and run through
 * `ms()` (size-matters) so icons scale with the device like everything else —
 * callers therefore pass plain design numbers (e.g. `size={20}`), never
 * pre-scaled ones.
 */
export function Icon({ name, size = 20, color }: IconProps) {
  const colors = useColors();
  return <Feather name={name} size={ms(size)} color={color ?? colors.text} />;
}
