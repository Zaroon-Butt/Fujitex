import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProductWithImages } from '@/types/database';

export interface ProductFilters {
  sectionSlug?: string;
  categorySlug?: string;
  fabricType?: string;
  occasion?: string;
  minPaisas?: number;
  maxPaisas?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async (): Promise<ProductWithImages[]> => {
      let query = supabase
        .from('products')
        .select('*, product_images(*), categories!inner(slug, sections!inner(slug))')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (filters.sectionSlug) {
        query = query.eq('categories.sections.slug', filters.sectionSlug);
      }
      if (filters.categorySlug) {
        query = query.eq('categories.slug', filters.categorySlug);
      }
      if (filters.fabricType) query = query.eq('fabric_type', filters.fabricType);
      if (filters.occasion)   query = query.eq('occasion', filters.occasion);
      if (filters.minPaisas !== undefined) query = query.gte('price_paisas', filters.minPaisas);
      if (filters.maxPaisas !== undefined) query = query.lte('price_paisas', filters.maxPaisas);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProductWithImages[];
    },
  });
}
