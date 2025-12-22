import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Tender, TenderSearchQuota, TenderSearchLog } from '../types/database';
import { TenderRecord } from '../lib/csvParser';

export function useTenders(filters?: {
  customerName?: string;
  manufacturer?: string;
  productKeyword?: string;
  capacity?: number;
}) {
  return useQuery({
    queryKey: ['tenders', filters],
    queryFn: async () => {
      let query = supabase
        .from('tenders')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (filters?.customerName) {
        query = query.ilike('customer_name', `%${filters.customerName}%`);
      }

      if (filters?.manufacturer) {
        query = query.eq('manufacturer', filters.manufacturer);
      }

      if (filters?.productKeyword) {
        query = query.ilike('product_name', `%${filters.productKeyword}%`);
      }

      if (filters?.capacity !== undefined) {
        query = query.eq('capacity', filters.capacity);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Tender[];
    },
  });
}

export function useUniqueCustomers() {
  return useQuery({
    queryKey: ['tender-unique-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenders')
        .select('customer_name')
        .order('customer_name');

      if (error) throw error;

      const uniqueCustomers = Array.from(
        new Set(data.map((item) => item.customer_name))
      ).sort();

      return uniqueCustomers;
    },
  });
}

export function useUniqueManufacturers() {
  return useQuery({
    queryKey: ['tender-unique-manufacturers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenders')
        .select('manufacturer')
        .order('manufacturer');

      if (error) throw error;

      const uniqueManufacturers = Array.from(
        new Set(data.map((item) => item.manufacturer))
      ).sort();

      return uniqueManufacturers;
    },
  });
}

export function useUniqueProducts() {
  return useQuery({
    queryKey: ['tender-unique-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenders')
        .select('product_name')
        .order('product_name');

      if (error) throw error;

      const uniqueProducts = Array.from(
        new Set(data.map((item) => item.product_name))
      ).sort();

      return uniqueProducts;
    },
  });
}

export function useUniqueCapacities(productName?: string) {
  return useQuery({
    queryKey: ['tender-unique-capacities', productName],
    queryFn: async () => {
      let query = supabase
        .from('tenders')
        .select('capacity')
        .order('capacity');

      if (productName) {
        query = query.eq('product_name', productName);
      }

      const { data, error } = await query;

      if (error) throw error;

      const uniqueCapacities = Array.from(
        new Set(data.map((item) => item.capacity))
      )
        .filter((cap) => cap > 0)
        .sort((a, b) => a - b);

      return uniqueCapacities;
    },
    enabled: true,
  });
}

export function useTenderSearchQuota(userId: string | undefined) {
  return useQuery({
    queryKey: ['tender-search-quota', userId],
    queryFn: async () => {
      if (!userId) return null;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('tender_search_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      return data as TenderSearchQuota | null;
    },
    enabled: !!userId,
  });
}

export function useIncrementSearchQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Verify we have an authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        throw new Error('User not authenticated');
      }
      
      // Ensure the userId matches the authenticated user (for RLS policies)
      if (userId !== authUser.id) {
        console.warn('User ID mismatch:', { provided: userId, auth: authUser.id });
        // Use the authenticated user ID instead
        userId = authUser.id;
      }

      const today = new Date().toISOString().split('T')[0];

      // Try to get existing quota
      const { data: existing, error: selectError } = await supabase
        .from('tender_search_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (selectError) {
        console.error('Error fetching existing quota:', selectError);
        throw selectError;
      }

      if (existing) {
        // Update existing quota
        const { data, error } = await supabase
          .from('tender_search_quotas')
          .update({
            searches_used: existing.searches_used + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating quota:', error);
          throw error;
        }
        return data;
      } else {
        // Insert new quota record
        const { data, error } = await supabase
          .from('tender_search_quotas')
          .insert({
            user_id: userId,
            date: today,
            searches_used: 1,
            searches_limit: 10,
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting quota:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['tender-search-quota', userId] });
    },
  });
}

export function useLogTenderSearch() {
  return useMutation({
    mutationFn: async (log: {
      user_id: string;
      customer_filter?: string;
      manufacturer_filter?: string;
      product_filter?: string;
      results_count: number;
    }) => {
      const { data, error } = await supabase
        .from('tender_search_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useImportTenders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: TenderRecord[]) => {
      const { data, error } = await supabase
        .from('tenders')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['tender-unique-customers'] });
      queryClient.invalidateQueries({ queryKey: ['tender-unique-manufacturers'] });
    },
  });
}

export function useAllSearchLogs() {
  return useQuery({
    queryKey: ['tender-search-logs-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_search_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as TenderSearchLog[];
    },
  });
}

export function useAllSearchQuotas() {
  return useQuery({
    queryKey: ['tender-search-quotas-all'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('tender_search_quotas')
        .select('*')
        .eq('date', today);

      if (error) throw error;
      return data as TenderSearchQuota[];
    },
  });
}

export function useResetUserQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('tender_search_quotas')
        .update({
          searches_used: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('date', today)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-search-quotas-all'] });
      queryClient.invalidateQueries({ queryKey: ['tender-search-quota'] });
    },
  });
}
