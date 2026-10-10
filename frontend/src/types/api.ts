/**
 * WeCare.AI API Types
 * Shared between frontend and backend
 */

// Patient types
export interface PatientCreateRequest {
  name?: string;
  gender?: string;
  age: number;
  symptoms: string[];
  symptom_onset?: string;
  vitals?: VitalsInput;
  medical_history?: string;
  preferred_language: 'en' | 'ta' | 'te' | 'hi';
  input_method: 'manual' | 'voice';
  transcript?: string;
}

export interface VitalsInput {
  heart_rate_bpm?: number;
  respiratory_rate_per_min?: number;
  spo2_percent?: number;
  systolic_bp_mmhg?: number;
  diastolic_bp_mmhg?: number;
  temperature_c?: number;
}

export interface PatientResponse {
  patient_id: string;
  name?: string;
  gender?: string;
  age: number;
  symptoms: string[];
  symptom_onset?: string;
  vitals?: VitalsInput;
  medical_history?: string;
  preferred_language: string;
  input_method: string;
  transcript?: string;
  created_at: string;
}

export type AcuityCategory = 'red' | 'yellow' | 'green';

// Assessment types
export interface AssessmentCreateRequest {
  patient_id: string;
}

export interface ContributingFactor {
  name: string;
  percentage: number;
  raw_percentage: number;
}

export interface AssessmentResponse {
  assessment_id: string;
  patient_id: string;
  acuity: AcuityCategory;
  reasons: string[];
  missing_information: string[];
  review_required: boolean;
  rules_version: string;
  assessed_at: string;
  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  confidence?: number;
  recommended_department?: string;
  contributing_factors?: ContributingFactor[];
  clinical_summary?: string;
  ai_source?: 'groq' | 'rules' | string;
}

export interface PatientDetail extends PatientResponse {
  assessments: AssessmentResponse[];
}

export interface AcuityDisplay {
  category: AcuityCategory;
  label: string;
  color: string;
  bgColor: string;
}

// Queue types
export interface QueueItem {
  patient_id: string;
  patient_name?: string;
  age: number;
  acuity: AcuityCategory;
  assessment_summary: string;
  waiting_duration_seconds: number;
  review_status: ReviewStatus;
  latest_assessment_id: string;
  created_at: string;
  risk_score?: number;
}

export type ReviewStatus = 'pending' | 'acknowledged' | 'not_required';

export interface QueueResponse {
  items: QueueItem[];
  total: number;
}

// Voice types
export interface VoiceTranscribeRequest {
  audio: Blob;
  language_code: string;
}

export interface VoiceTranscribeResponse {
  transcript: string;
  language_code: string;
  confidence?: number;
}

// Reassessment types
export interface ReassessmentRequest {
  patient_id: string;
  symptoms?: string[];
  symptom_onset?: string;
  vitals?: VitalsInput;
  medical_history?: string;
}

// Acknowledgement types
export interface AcknowledgementRequest {
  assessment_id: string;
}

export interface AcknowledgementResponse {
  success: boolean;
  acknowledged_at: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status_code: number;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
  }[];
}

// HTTP types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Configuration
export interface ApiConfig {
  baseUrl: string;
  useMock: boolean;
}

// Frontend-specific types
export interface FormErrors {
  [key: string]: string;
}

export interface FormState<T> {
  values: T;
  errors: FormErrors;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// UI State types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}
