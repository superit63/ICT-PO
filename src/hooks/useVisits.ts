import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Visit, VisitWithRelations, CreateVisitInput } from '../types/database';

export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
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
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data as VisitWithRelations[];
    },
  });
}

export function useVisit(visitId: string | undefined) {
  return useQuery({
    queryKey: ['visit', visitId],
    queryFn: async () => {
      if (!visitId) throw new Error('Visit ID is required');

      const { data, error } = await supabase
        .from('visits')
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
        .eq('id', visitId)
        .maybeSingle();

      if (error) throw error;
      return data as VisitWithRelations | null;
    },
    enabled: !!visitId,
  });
}

export function useVisitsBySales(salesId: string | undefined) {
  return useQuery({
    queryKey: ['visits', 'sales', salesId],
    queryFn: async () => {
      if (!salesId) throw new Error('Sales ID is required');

      const { data, error } = await supabase
        .from('visits')
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
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data as VisitWithRelations[];
    },
    enabled: !!salesId,
  });
}

export function useVisitsByDoctor(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['visits', 'doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('Doctor ID is required');

      const { data, error } = await supabase
        .from('visits')
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
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data as VisitWithRelations[];
    },
    enabled: !!doctorId,
  });
}

export function useRecentVisits(limit = 10) {
  return useQuery({
    queryKey: ['visits', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
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
        .order('visit_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VisitWithRelations[];
    },
  });
}

export function useDoctorVisitsThisMonth(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['visits', 'doctor', doctorId, 'thisMonth'],
    queryFn: async () => {
      if (!doctorId) throw new Error('Doctor ID is required');

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('visits')
        .select('id')
        .eq('doctor_id', doctorId)
        .gte('visit_date', startOfMonth.toISOString())
        .lte('visit_date', endOfMonth.toISOString());

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!doctorId,
  });
}

export function useVisitsByHospital(hospitalId: string | undefined) {
  return useQuery({
    queryKey: ['visits', 'hospital', hospitalId],
    queryFn: async () => {
      if (!hospitalId) throw new Error('Hospital ID is required');

      const { data, error } = await supabase
        .from('visits')
        .select(
          `
          *,
          doctor:doctors!inner(
            *,
            hospital:hospitals(*)
          ),
          sales:profiles(*)
        `
        )
        .eq('doctor.hospital_id', hospitalId)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data as VisitWithRelations[];
    },
    enabled: !!hospitalId,
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visit: CreateVisitInput) => {
      const { data, error } = await supabase
        .from('visits')
        .insert(visit)
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

      await supabase
        .from('doctors')
        .update({ last_visit_at: visit.visit_date })
        .eq('id', visit.doctor_id);

      return data as VisitWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitId,
      updates,
    }: {
      visitId: string;
      updates: Partial<CreateVisitInput>;
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', visitId)
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
      return data as VisitWithRelations;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visit', data.id] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useDeleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitId: string) => {
      const { error } = await supabase.from('visits').delete().eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}
