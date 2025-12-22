import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  VisitLog,
  VisitLogWithRelations,
  CreateVisitLogInput,
  VisitLogStatus,
} from '../types/database';

export function useVisitLogs() {
  return useQuery({
    queryKey: ['visitLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visit_logs')
        .select(
          `
          *,
          sales:profiles(*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VisitLogWithRelations[];
    },
  });
}

export function useVisitLog(logId: string | undefined) {
  return useQuery({
    queryKey: ['visitLog', logId],
    queryFn: async () => {
      if (!logId) throw new Error('Visit log ID is required');

      const { data, error } = await supabase
        .from('visit_logs')
        .select(
          `
          *,
          sales:profiles(*)
        `
        )
        .eq('id', logId)
        .maybeSingle();

      if (error) throw error;
      return data as VisitLogWithRelations | null;
    },
    enabled: !!logId,
  });
}

export function useVisitLogsBySales(salesId: string | undefined) {
  return useQuery({
    queryKey: ['visitLogs', 'sales', salesId],
    queryFn: async () => {
      if (!salesId) throw new Error('Sales ID is required');

      const { data, error } = await supabase
        .from('visit_logs')
        .select(
          `
          *,
          sales:profiles(*)
        `
        )
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VisitLogWithRelations[];
    },
    enabled: !!salesId,
  });
}

export function useVisitLogsByStatus(status: VisitLogStatus) {
  return useQuery({
    queryKey: ['visitLogs', 'status', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visit_logs')
        .select(
          `
          *,
          sales:profiles(*)
        `
        )
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VisitLogWithRelations[];
    },
  });
}

export function usePendingVisitLogs() {
  return useQuery({
    queryKey: ['visitLogs', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visit_logs')
        .select(
          `
          *,
          sales:profiles(*)
        `
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VisitLogWithRelations[];
    },
  });
}

export function useCreateVisitLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: CreateVisitLogInput) => {
      const { data, error } = await supabase
        .from('visit_logs')
        .insert(log)
        .select(
          `
          *,
          sales:profiles(*)
        `
        )
        .single();

      if (error) throw error;
      return data as VisitLogWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitLogs'] });
    },
  });
}

export function useUpdateVisitLogStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      logId,
      status,
    }: {
      logId: string;
      status: VisitLogStatus;
    }) => {
      const { data, error } = await supabase
        .from('visit_logs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', logId)
        .select(
          `
          *,
          sales:profiles(*)
        `
        )
        .single();

      if (error) throw error;
      return data as VisitLogWithRelations;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visitLog', data.id] });
      queryClient.invalidateQueries({ queryKey: ['visitLogs'] });
    },
  });
}

export function useDeleteVisitLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase.from('visit_logs').delete().eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitLogs'] });
    },
  });
}
