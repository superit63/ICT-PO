import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  ActivityFeed,
  ActivityFeedWithRelations,
  CreateActivityInput,
  ActivityType,
} from '../types/database';

export function useActivityFeed() {
  return useQuery({
    queryKey: ['activityFeed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(
          `
          *,
          doctor:doctors(
            *,
            hospital:hospitals(*)
          ),
          sales:profiles(*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivityFeedWithRelations[];
    },
  });
}

export function useActivityFeedByDoctor(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['activityFeed', 'doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('Doctor ID is required');

      const { data, error } = await supabase
        .from('activity_feed')
        .select(
          `
          *,
          doctor:doctors(
            *,
            hospital:hospitals(*)
          ),
          sales:profiles(*)
        `
        )
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivityFeedWithRelations[];
    },
    enabled: !!doctorId,
  });
}

export function useActivityFeedBySales(salesId: string | undefined) {
  return useQuery({
    queryKey: ['activityFeed', 'sales', salesId],
    queryFn: async () => {
      if (!salesId) throw new Error('Sales ID is required');

      const { data, error } = await supabase
        .from('activity_feed')
        .select(
          `
          *,
          doctor:doctors(
            *,
            hospital:hospitals(*)
          ),
          sales:profiles(*)
        `
        )
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivityFeedWithRelations[];
    },
    enabled: !!salesId,
  });
}

export function useActivityFeedByType(activityType: ActivityType) {
  return useQuery({
    queryKey: ['activityFeed', 'type', activityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(
          `
          *,
          doctor:doctors(
            *,
            hospital:hospitals(*)
          ),
          sales:profiles(*)
        `
        )
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivityFeedWithRelations[];
    },
  });
}

export function useRecentActivityFeed(limit = 20) {
  return useQuery({
    queryKey: ['activityFeed', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(
          `
          *,
          doctor:doctors(
            *,
            hospital:hospitals(*)
          ),
          sales:profiles(*)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityFeedWithRelations[];
    },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: CreateActivityInput) => {
      const { data, error } = await supabase
        .from('activity_feed')
        .insert(activity)
        .select(
          `
          *,
          doctor:doctors(
            *,
            hospital:hospitals(*)
          ),
          sales:profiles(*)
        `
        )
        .single();

      if (error) throw error;
      return data as ActivityFeedWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('activity_feed')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
    },
  });
}
