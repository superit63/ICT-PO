import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
  });
}
