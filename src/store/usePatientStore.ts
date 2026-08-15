import { create } from 'zustand';
import type { Paciente } from '@/types';
import { supabase } from '@/lib/supabase';

interface PatientState {
  patients: Paciente[];
  isLoading: boolean;
  fetchPatients: () => Promise<void>;
  addPatient: (patient: Omit<Paciente, 'id'>) => Promise<void>;
  updatePatient: (id: string, updatedPatient: Partial<Paciente>) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  isLoading: false,

  fetchPatients: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('pacientes').select('*');
      if (error) throw error;
      
      const patients: Paciente[] = (data || []).map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        edad: p.edad,
        sexo: p.sexo as any,
        peso: Number(p.peso),
        talla: Number(p.talla),
        imc: Number(p.imc),
        porcentajeGrasa: p.porcentaje_grasa ? Number(p.porcentaje_grasa) : undefined,
        circunferenciaCintura: p.circunferencia_cintura ? Number(p.circunferencia_cintura) : undefined,
        circunferenciaCadera: p.circunferencia_cadera ? Number(p.circunferencia_cadera) : undefined,
        circunferenciaBraquial: p.circunferencia_braquial ? Number(p.circunferencia_braquial) : undefined,
        circunferenciaPantorrilla: p.circunferencia_pantorrilla ? Number(p.circunferencia_pantorrilla) : undefined,
        diagnostico: p.diagnostico || [],
        discapacidadFisica: p.discapacidad_fisica || [],
        dificultadMasticacion: p.dificultad_masticacion || false,
        observaciones: p.observaciones || undefined,
        medicamentos: p.medicamentos || [],
      }));

      set({ patients, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  addPatient: async (patient) => {
    try {
      const { error } = await supabase.from('pacientes').insert({
        nombre: patient.nombre,
        edad: patient.edad,
        sexo: patient.sexo,
        peso: patient.peso,
        talla: patient.talla,
        imc: patient.imc,
        porcentaje_grasa: patient.porcentajeGrasa,
        circunferencia_cintura: patient.circunferenciaCintura,
        circunferencia_cadera: patient.circunferenciaCadera,
        circunferencia_braquial: patient.circunferenciaBraquial,
        circunferencia_pantorrilla: patient.circunferenciaPantorrilla,
        diagnostico: patient.diagnostico,
        discapacidad_fisica: patient.discapacidadFisica,
        dificultad_masticacion: patient.dificultadMasticacion,
        observaciones: patient.observaciones,
        medicamentos: patient.medicamentos,
      });
      if (error) throw error;
      await get().fetchPatients();
    } catch (error) {
      console.error('Error addPatient', error);
      throw error;
    }
  },
  
  updatePatient: async (id, updatedPatient) => {
    try {
      const payload: any = {};
      if (updatedPatient.nombre) payload.nombre = updatedPatient.nombre;
      if (updatedPatient.edad !== undefined) payload.edad = updatedPatient.edad;
      if (updatedPatient.sexo) payload.sexo = updatedPatient.sexo;
      if (updatedPatient.peso !== undefined) payload.peso = updatedPatient.peso;
      if (updatedPatient.talla !== undefined) payload.talla = updatedPatient.talla;
      if (updatedPatient.imc !== undefined) payload.imc = updatedPatient.imc;
      if (updatedPatient.porcentajeGrasa !== undefined) payload.porcentaje_grasa = updatedPatient.porcentajeGrasa;
      if (updatedPatient.circunferenciaCintura !== undefined) payload.circunferencia_cintura = updatedPatient.circunferenciaCintura;
      if (updatedPatient.circunferenciaCadera !== undefined) payload.circunferencia_cadera = updatedPatient.circunferenciaCadera;
      if (updatedPatient.circunferenciaBraquial !== undefined) payload.circunferencia_braquial = updatedPatient.circunferenciaBraquial;
      if (updatedPatient.circunferenciaPantorrilla !== undefined) payload.circunferencia_pantorrilla = updatedPatient.circunferenciaPantorrilla;
      if (updatedPatient.diagnostico) payload.diagnostico = updatedPatient.diagnostico;
      if (updatedPatient.discapacidadFisica !== undefined) payload.discapacidad_fisica = updatedPatient.discapacidadFisica;
      if (updatedPatient.dificultadMasticacion !== undefined) payload.dificultad_masticacion = updatedPatient.dificultadMasticacion;
      if (updatedPatient.observaciones !== undefined) payload.observaciones = updatedPatient.observaciones;
      if (updatedPatient.medicamentos) payload.medicamentos = updatedPatient.medicamentos;

      const { error } = await supabase.from('pacientes').update(payload).eq('id', id);
      if (error) throw error;
      await get().fetchPatients();
    } catch (error) {
      console.error('Error updatePatient', error);
      throw error;
    }
  },
  
  removePatient: async (id) => {
    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (error) throw error;
      await get().fetchPatients();
    } catch (error) {
      console.error('Error removePatient', error);
      throw error;
    }
  },
}));

