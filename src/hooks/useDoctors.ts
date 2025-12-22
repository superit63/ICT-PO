import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  Doctor,
  DoctorWithRelations,
  CreateDoctorInput,
  UpdateDoctorInput,
  DoctorStatus,
} from '../types/database';

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select(
          `
          *,
          hospital:hospitals(*),
          assigned_sales:profiles(*)
        `
        )
        .order('name');

      if (error) throw error;
      return data as DoctorWithRelations[];
    },
  });
}

export function useDoctor(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('Doctor ID is required');

      const { data, error } = await supabase
        .from('doctors')
        .select(
          `
          *,
          hospital:hospitals(*),
          assigned_sales:profiles(*)
        `
        )
        .eq('id', doctorId)
        .maybeSingle();

      if (error) throw error;
      return data as DoctorWithRelations | null;
    },
    enabled: !!doctorId,
  });
}

export function useDoctorsBySales(salesId: string | undefined) {
  return useQuery({
    queryKey: ['doctors', 'sales', salesId],
    queryFn: async () => {
      if (!salesId) throw new Error('Sales ID is required');

      const { data, error } = await supabase
        .from('doctors')
        .select(
          `
          *,
          hospital:hospitals(*),
          assigned_sales:profiles(*)
        `
        )
        .eq('assigned_sales_id', salesId)
        .order('name');

      if (error) throw error;
      return data as DoctorWithRelations[];
    },
    enabled: !!salesId,
  });
}

export function useDoctorsByHospital(hospitalId: string | undefined) {
  return useQuery({
    queryKey: ['doctors', 'hospital', hospitalId],
    queryFn: async () => {
      if (!hospitalId) throw new Error('Hospital ID is required');

      const { data, error } = await supabase
        .from('doctors')
        .select(
          `
          *,
          hospital:hospitals(*),
          assigned_sales:profiles(*)
        `
        )
        .eq('hospital_id', hospitalId)
        .order('name');

      if (error) throw error;
      return data as DoctorWithRelations[];
    },
    enabled: !!hospitalId,
  });
}

export function useDoctorsByStatus(status: DoctorStatus) {
  return useQuery({
    queryKey: ['doctors', 'status', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select(
          `
          *,
          hospital:hospitals(*),
          assigned_sales:profiles(*)
        `
        )
        .eq('status', status)
        .order('name');

      if (error) throw error;
      return data as DoctorWithRelations[];
    },
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctor: CreateDoctorInput) => {
      const { data, error } = await supabase
        .from('doctors')
        .insert(doctor)
        .select(
          `
          *,
          hospital:hospitals(*),
          assigned_sales:profiles(*)
        `
        )
        .single();

      if (error) throw error;
      return data as DoctorWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      doctorId,
      updates,
    }: {
      doctorId: string;
      updates: UpdateDoctorInput;
    }) => {
      const { data, error } = await supabase
        .from('doctors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', doctorId)
        .select(
          `
          *,
          hospital:hospitals(*),
          assigned_sales:profiles(*)
        `
        )
        .single();

      if (error) throw error;
      return data as DoctorWithRelations;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', data.id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorId: string) => {
      const { error } = await supabase.from('doctors').delete().eq('id', doctorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}
