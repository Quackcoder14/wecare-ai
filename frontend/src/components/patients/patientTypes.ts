export interface PatientDetail {
  patient_id: string;
  age: number;
  symptoms: string[];
  symptom_onset?: string;
  vitals?: {
    heart_rate_bpm?: number;
    respiratory_rate_per_min?: number;
    spo2_percent?: number;
    systolic_bp_mmhg?: number;
    temperature_c?: number;
  };
  medical_history?: string;
  preferred_language: string;
  input_method: string;
  transcript?: string;
  created_at: string;
  assessments: AssessmentResponse[];
}

export interface AssessmentResponse {
  assessment_id: string;
  patient_id: string;
  acuity: 'red' | 'yellow' | 'green';
  reasons: string[];
  missing_information: string[];
  review_required: boolean;
  rules_version: string;
  assessed_at: string;
}