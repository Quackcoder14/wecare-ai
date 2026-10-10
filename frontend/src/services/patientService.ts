import { apiClient, formatApiError } from './apiClient';
import type {
  PatientCreateRequest,
  PatientResponse,
  PatientDetail,
  VitalsInput,
} from '../types/api';

export interface PatientService {
  createPatient(data: PatientCreateRequest, t: (key: string) => string): Promise<PatientResponse>;
  getPatient(patientId: string, t: (key: string) => string): Promise<PatientDetail>;
  listPatients(t: (key: string) => string): Promise<PatientResponse[]>;
  updatePatient(patientId: string, data: Partial<PatientCreateRequest>, t: (key: string) => string): Promise<PatientResponse>;
  deletePatient(patientId: string, t: (key: string) => string): Promise<void>;
}

// Real API implementation
export const realPatientService: PatientService = {
  async createPatient(data, t) {
    try {
      return await apiClient.post<PatientResponse>('/api/patients', data);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },

  async getPatient(patientId, t) {
    try {
      return await apiClient.get<PatientDetail>(`/api/patients/${patientId}`);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },

  async listPatients(t) {
    try {
      return await apiClient.get<PatientResponse[]>('/api/patients');
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },

  async updatePatient(patientId, data, t) {
    try {
      return await apiClient.patch<PatientResponse>(`/api/patients/${patientId}`, data);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },

  async deletePatient(patientId, t) {
    try {
      await apiClient.delete<void>(`/api/patients/${patientId}`);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },
};

// Type guards for vitals
export function isValidVitals(vitals: unknown): vitals is VitalsInput {
  if (!vitals || typeof vitals !== 'object') return false;
  const v = vitals as Record<string, unknown>;
  return (
    (v.heart_rate_bpm === undefined || typeof v.heart_rate_bpm === 'number') &&
    (v.respiratory_rate_per_min === undefined || typeof v.respiratory_rate_per_min === 'number') &&
    (v.spo2_percent === undefined || typeof v.spo2_percent === 'number') &&
    (v.systolic_bp_mmhg === undefined || typeof v.systolic_bp_mmhg === 'number') &&
    (v.temperature_c === undefined || typeof v.temperature_c === 'number')
  );
}

// Validate patient create request
export function validatePatientCreate(data: PatientCreateRequest, t: (key: string) => string): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Age validation
  if (data.age === undefined || data.age === null || (data.age as unknown) === '') {
    errors.age = t('intake.validation.required');
  } else if (isNaN(Number(data.age)) || !Number.isInteger(Number(data.age))) {
    errors.age = t('intake.validation.mustBeInteger');
  } else if (Number(data.age) <= 0) {
    errors.age = t('intake.validation.mustBePositive');
  } else if (Number(data.age) > 150) {
    errors.age = t('intake.validation.maxValue');
  } else if (Number(data.age) < 12) {
    // This is a warning, not an error - we allow submission but show warning
  }

  // At least one symptom or vital sign
  const hasSymptoms = data.symptoms && data.symptoms.length > 0;
  const hasVitals = data.vitals && (
    data.vitals.heart_rate_bpm !== undefined ||
    data.vitals.respiratory_rate_per_min !== undefined ||
    data.vitals.spo2_percent !== undefined ||
    data.vitals.systolic_bp_mmhg !== undefined ||
    data.vitals.temperature_c !== undefined
  );

  if (!hasSymptoms && !hasVitals && !data.transcript) {
    errors.general = 'Please enter at least one symptom, vital sign, or voice transcript.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Format vitals for display
export function formatVitalsForDisplay(vitals: VitalsInput | undefined, t: (key: string) => string): string[] {
  if (!vitals) return [t('common.loading')];

  const parts: string[] = [];

  if (vitals.heart_rate_bpm !== undefined) {
    parts.push(`${t('intake.vitalSigns.heartRate.label')}: ${vitals.heart_rate_bpm} ${t('intake.vitalSigns.heartRate.unit')}`);
  }
  if (vitals.respiratory_rate_per_min !== undefined) {
    parts.push(`${t('intake.vitalSigns.respiratoryRate.label')}: ${vitals.respiratory_rate_per_min} ${t('intake.vitalSigns.respiratoryRate.unit')}`);
  }
  if (vitals.spo2_percent !== undefined) {
    parts.push(`${t('intake.vitalSigns.spo2.label')}: ${vitals.spo2_percent} ${t('intake.vitalSigns.spo2.unit')}`);
  }
  if (vitals.systolic_bp_mmhg !== undefined) {
    parts.push(`${t('intake.vitalSigns.systolicBp.label')}: ${vitals.systolic_bp_mmhg} ${t('intake.vitalSigns.systolicBp.unit')}`);
  }
  if (vitals.temperature_c !== undefined) {
    parts.push(`${t('intake.vitalSigns.temperature.label')}: ${vitals.temperature_c} ${t('intake.vitalSigns.temperature.unit')}`);
  }

  return parts.length > 0 ? parts : [t('intake.vitalSigns.missingInfoNote')];
}
