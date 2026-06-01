import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SectionWithCategories } from '@/types/database';

/**
 * Single source of truth for the storefront navigation hierarchy: active
 * sections + their top-level categories. CMS-driven — when an admin adds a
 * section on the web, it appears here automatically. Never hardcode nav.
 */
export function useNavigation() {
  return useQuery({
    queryKey: ['navigation'],
    queryFn: async (): Promise<SectionWithCategories[]> => {
      const { data, error } = await supabase
        .from('sections')
        .select('*, categories(*)')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      const sections = (data ?? []) as SectionWithCategories[];
      return sections.map((s) => ({
        ...s,
        categories: (s.categories ?? [])
          .filter((c) => c.is_active && c.parent_id === null)
          .sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
  });
}
