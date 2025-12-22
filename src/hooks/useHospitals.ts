import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Hospital, CreateHospitalInput } from '../types/database';

export function useHospitals() {
  return useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Hospital[];
    },
  });
}

export function useHospital(hospitalId: string | undefined) {
  return useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: async () => {
      if (!hospitalId) throw new Error('Hospital ID is required');

      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', hospitalId)
        .maybeSingle();

      if (error) throw error;
      return data as Hospital | null;
    },
    enabled: !!hospitalId,
  });
}

export function useHospitalsByCity(city: string | undefined) {
  return useQuery({
    queryKey: ['hospitals', 'city', city],
    queryFn: async () => {
      if (!city) throw new Error('City is required');

      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('city', city)
        .order('name');

      if (error) throw error;
      return data as Hospital[];
    },
    enabled: !!city,
  });
}

export function useCreateHospital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hospital: CreateHospitalInput) => {
      const { data, error } = await supabase
        .from('hospitals')
        .insert(hospital)
        .select()
        .single();

      if (error) throw error;
      return data as Hospital;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
}

export function useUpdateHospital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hospitalId,
      updates,
    }: {
      hospitalId: string;
      updates: Partial<CreateHospitalInput>;
    }) => {
      const { data, error } = await supabase
        .from('hospitals')
        .update(updates)
        .eq('id', hospitalId)
        .select()
        .single();

      if (error) throw error;
      return data as Hospital;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hospital', data.id] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
}
