import type {
  PatientCreateRequest,
  PatientResponse,
  PatientDetail,
  AssessmentCreateRequest,
  AssessmentResponse,
  ReassessmentRequest,
  AcknowledgementRequest,
  AcknowledgementResponse,
  QueueItem,
  QueueResponse,
  VoiceTranscribeResponse,
  AcuityCategory,
} from '../types/api';

// Mock data fixtures
const MOCK_PATIENTS: PatientDetail[] = [
  {
    patient_id: 'PAT-001',
    name: 'Meera Krishnan',
    age: 67,
    symptoms: ['Chest pain', 'Shortness of breath'],
    symptom_onset: '2 hours ago',
    vitals: {
      heart_rate_bpm: 112,
      respiratory_rate_per_min: 28,
      spo2_percent: 91,
      systolic_bp_mmhg: 95,
      temperature_c: 37.2,
    },
    medical_history: 'Hypertension, Type 2 Diabetes',
    preferred_language: 'en',
    input_method: 'manual',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    assessments: [
      {
        assessment_id: 'ASM-001',
        patient_id: 'PAT-001',
        acuity: 'red',
        reasons: [
          'Chest pain with hemodynamic instability (SBP < 100)',
          'Tachycardia > 110 bpm',
          'Hypoxia SpO2 < 92%',
          'History of CAD risk factors',
        ],
        missing_information: ['ECG', 'Troponin'],
        review_required: true,
        rules_version: 'v1.2.0',
        assessed_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
  {
    patient_id: 'PAT-002',
    name: 'Arjun Nair',
    age: 34,
    symptoms: ['Abdominal pain', 'Nausea'],
    symptom_onset: '4 hours ago',
    vitals: {
      heart_rate_bpm: 98,
      respiratory_rate_per_min: 20,
      spo2_percent: 98,
      systolic_bp_mmhg: 118,
      temperature_c: 38.1,
    },
    medical_history: 'None',
    preferred_language: 'ta',
    input_method: 'voice',
    transcript: 'Patient reports severe abdominal pain since morning with vomiting',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    assessments: [
      {
        assessment_id: 'ASM-002',
        patient_id: 'PAT-002',
        acuity: 'yellow',
        reasons: [
          'Abdominal pain with fever',
          'Tachycardia > 90 bpm',
          'Unable to rule out surgical abdomen',
        ],
        missing_information: ['Labs', 'Imaging'],
        review_required: true,
        rules_version: 'v1.2.0',
        assessed_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  {
    patient_id: 'PAT-003',
    name: 'Kavya Reddy',
    age: 45,
    symptoms: ['Minor laceration', 'Bleeding controlled'],
    symptom_onset: '30 minutes ago',
    vitals: {
      heart_rate_bpm: 78,
      respiratory_rate_per_min: 16,
      spo2_percent: 99,
      systolic_bp_mmhg: 125,
      temperature_c: 36.8,
    },
    medical_history: 'None',
    preferred_language: 'te',
    input_method: 'manual',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    assessments: [
      {
        assessment_id: 'ASM-003',
        patient_id: 'PAT-003',
        acuity: 'green',
        reasons: [
          'Minor laceration, bleeding controlled',
          'Normal vital signs',
          'No neurovascular compromise',
        ],
        missing_information: [],
        review_required: false,
        rules_version: 'v1.2.0',
        assessed_at: new Date(Date.now() - 900000).toISOString(),
      },
    ],
  },
  {
    patient_id: 'PAT-004',
    name: 'Ravi Menon',
    age: 72,
    symptoms: ['Confusion', 'Fall'],
    symptom_onset: '1 hour ago',
    vitals: {
      heart_rate_bpm: 88,
      respiratory_rate_per_min: 18,
      spo2_percent: 95,
      systolic_bp_mmhg: 140,
      temperature_c: 37.0,
    },
    medical_history: 'Atrial fibrillation on anticoagulation',
    preferred_language: 'hi',
    input_method: 'voice',
    transcript: 'Elderly patient found confused after a fall at home',
    created_at: new Date(Date.now() - 5400000).toISOString(),
    assessments: [
      {
        assessment_id: 'ASM-004',
        patient_id: 'PAT-004',
        acuity: 'red',
        reasons: [
          'Altered mental status in elderly',
          'Fall with possible head trauma',
          'Anticoagulation increases bleed risk',
        ],
        missing_information: ['CT Head', 'INR', 'Glucose'],
        review_required: true,
        rules_version: 'v1.2.0',
        assessed_at: new Date(Date.now() - 2700000).toISOString(),
      },
    ],
  },
  {
    patient_id: 'PAT-005',
    name: 'Priya Shah',
    age: 28,
    symptoms: ['Anxiety', 'Palpitations'],
    symptom_onset: '20 minutes ago',
    vitals: {
      heart_rate_bpm: 105,
      respiratory_rate_per_min: 22,
      spo2_percent: 97,
      systolic_bp_mmhg: 130,
      temperature_c: 36.9,
    },
    medical_history: 'Generalized anxiety disorder',
    preferred_language: 'en',
    input_method: 'manual',
    created_at: new Date(Date.now() - 1200000).toISOString(),
    assessments: [
      {
        assessment_id: 'ASM-005',
        patient_id: 'PAT-005',
        acuity: 'yellow',
        reasons: [
          'Tachycardia with anxiety',
          'Rule out cardiac arrhythmia',
          'History of anxiety disorder',
        ],
        missing_information: ['ECG', 'Electrolytes'],
        review_required: false,
        rules_version: 'v1.2.0',
        assessed_at: new Date(Date.now() - 600000).toISOString(),
      },
    ],
  },
];

let mockPatients = [...MOCK_PATIENTS];
let mockAssessmentCounter = 6;
let mockPatientCounter = 6;

// Generate mock queue from patients
function generateMockQueue(): QueueItem[] {
  return mockPatients.map(patient => {
    const latestAssessment = patient.assessments[patient.assessments.length - 1];
    const createdAt = new Date(patient.created_at).getTime();
    const waitingSeconds = Math.floor((Date.now() - createdAt) / 1000);

    return {
      patient_id: patient.patient_id,
      patient_name: patient.name,
      age: patient.age,
      acuity: latestAssessment.acuity,
      assessment_summary: latestAssessment.reasons[0] || 'Assessment completed',
      waiting_duration_seconds: waitingSeconds,
      review_status: latestAssessment.review_required ? 'pending' : 'not_required',
      latest_assessment_id: latestAssessment.assessment_id,
      created_at: patient.created_at,
    };
  });
}

// Mock delay helper
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockPatientService = {
  async createPatient(data: PatientCreateRequest): Promise<PatientResponse> {
    await mockDelay();

    const patientId = `PAT-${String(mockPatientCounter++).padStart(3, '0')}`;
    const newPatient: PatientDetail = {
      patient_id: patientId,
      name: data.name,
      gender: data.gender,
      age: data.age,
      symptoms: data.symptoms,
      symptom_onset: data.symptom_onset,
      vitals: data.vitals,
      medical_history: data.medical_history,
      preferred_language: data.preferred_language,
      input_method: data.input_method,
      transcript: data.transcript,
      created_at: new Date().toISOString(),
      assessments: [],
    };

    mockPatients.unshift(newPatient);
    return {
      patient_id: patientId,
      name: data.name,
      gender: data.gender,
      age: data.age,
      symptoms: data.symptoms,
      symptom_onset: data.symptom_onset,
      vitals: data.vitals,
      medical_history: data.medical_history,
      preferred_language: data.preferred_language,
      input_method: data.input_method,
      transcript: data.transcript,
      created_at: newPatient.created_at,
    };
  },

  async getPatient(patientId: string): Promise<PatientDetail> {
    await mockDelay(300);
    const patient = mockPatients.find(p => p.patient_id === patientId);
    if (!patient) throw new Error('Patient not found');
    return { ...patient };
  },

  async listPatients(): Promise<PatientResponse[]> {
    await mockDelay(300);
    return mockPatients.map(({ assessments, ...patient }) => patient);
  },

  async updatePatient(patientId: string, data: Partial<PatientCreateRequest>): Promise<PatientResponse> {
    await mockDelay();
    const index = mockPatients.findIndex(p => p.patient_id === patientId);
    if (index === -1) throw new Error('Patient not found');

    mockPatients[index] = { ...mockPatients[index], ...data };
    return mockPatients[index];
  },

  async deletePatient(patientId: string): Promise<void> {
    await mockDelay(300);
    const index = mockPatients.findIndex(p => p.patient_id === patientId);
    if (index === -1) throw new Error('Patient not found');
    mockPatients.splice(index, 1);
  },
};

export const mockAssessmentService = {
  async createAssessment(data: AssessmentCreateRequest): Promise<AssessmentResponse> {
    await mockDelay(800);

    const patient = mockPatients.find(p => p.patient_id === data.patient_id);
    if (!patient) throw new Error('Patient not found');

    // Simple mock logic based on age and vitals
    let acuity: AcuityCategory = 'green';
    const reasons: string[] = ['Mock assessment - demo mode'];
    const missingInfo: string[] = [];
    let reviewRequired = false;

    const vitals = patient.vitals;
    const age = patient.age;

    if (age >= 65 && (vitals?.heart_rate_bpm ?? 0) > 100) {
      acuity = 'red';
      reasons.push('Elderly with tachycardia');
      missingInfo.push('ECG');
      reviewRequired = true;
    } else if ((vitals?.heart_rate_bpm ?? 0) > 110 || (vitals?.spo2_percent ?? 100) < 93) {
      acuity = 'red';
      reasons.push('Abnormal vital signs');
      missingInfo.push('Labs');
      reviewRequired = true;
    } else if ((vitals?.heart_rate_bpm ?? 0) > 90 || (vitals?.temperature_c ?? 37) > 38) {
      acuity = 'yellow';
      reasons.push('Mild vital sign abnormalities');
      missingInfo.push('Observation');
    }

    const assessmentId = `ASM-${String(mockAssessmentCounter++).padStart(3, '0')}`;
    const assessment: AssessmentResponse = {
      assessment_id: assessmentId,
      patient_id: data.patient_id,
      acuity,
      reasons,
      missing_information: missingInfo,
      review_required: reviewRequired,
      rules_version: 'v1.2.0-mock',
      assessed_at: new Date().toISOString(),
    };

    patient.assessments.push(assessment);
    return assessment;
  },

  async reassessPatient(data: ReassessmentRequest): Promise<AssessmentResponse> {
    await mockDelay(800);

    const patient = mockPatients.find(p => p.patient_id === data.patient_id);
    if (!patient) throw new Error('Patient not found');

    // Update patient data if provided
    if (data.symptoms) patient.symptoms = data.symptoms;
    if (data.symptom_onset) patient.symptom_onset = data.symptom_onset;
    if (data.vitals) patient.vitals = data.vitals;
    if (data.medical_history) patient.medical_history = data.medical_history;

    return this.createAssessment({ patient_id: data.patient_id });
  },

  async acknowledgeAssessment(data: AcknowledgementRequest): Promise<AcknowledgementResponse> {
    await mockDelay(300);

    // Find and update the assessment
    for (const patient of mockPatients) {
      const assessment = patient.assessments.find(a => a.assessment_id === data.assessment_id);
      if (assessment) {
        assessment.review_required = false;
        return {
          success: true,
          acknowledged_at: new Date().toISOString(),
        };
      }
    }

    throw new Error('Assessment not found');
  },
};

export const mockQueueService = {
  async getQueue(): Promise<QueueResponse> {
    await mockDelay(400);
    const items = generateMockQueue();
    return {
      items: sortQueueByAcuity(items),
      total: items.length,
    };
  },

  async refreshQueue(): Promise<QueueResponse> {
    return this.getQueue();
  },
};

export const mockVoiceService = {
  async transcribe(_audioBlob: Blob, languageCode: string): Promise<VoiceTranscribeResponse> {
    await mockDelay(1500);

    // Simulate different transcripts based on language
    const mockTranscripts: Record<string, string> = {
      'en-IN': 'Patient reports severe chest pain radiating to left arm, shortness of breath, and diaphoresis for the past two hours.',
      'ta-IN': 'ரோகி கடுமான மார்பு வலி, இடது கையில் விளைவதற்கும், శ்வாசக்கோசம், மற்றும் பással estrechez குறிக்கிறார்.',
      'te-IN': 'రోగి తీవ్ర ఉర్రృహ వెంట Baptiste Demi、ఎడమ ചെ육చ్ కలుగుతున్న మenchymal، శ్వాసకోసం, మరియు Tennessee వరుసా Tennessee..',
      'hi-IN': 'रोगी गंभीर छाती में दर्द की शिकायत करते हैं जो बाएं हाथ तक फैलता है, सांस की तकलीफ, और पसीना आना।',
    };

    const transcript = mockTranscripts[languageCode] || mockTranscripts['en-IN'];

    return {
      transcript,
      language_code: languageCode,
      confidence: 0.92,
    };
  },
};

// Helper to sort queue by acuity
function sortQueueByAcuity(items: QueueItem[]): QueueItem[] {
  const acuityPriority: Record<AcuityCategory, number> = {
    red: 0,
    yellow: 1,
    green: 2,
  };

  return [...items].sort((a, b) => {
    const acuityDiff = acuityPriority[a.acuity] - acuityPriority[b.acuity];
    if (acuityDiff !== 0) return acuityDiff;
    return b.waiting_duration_seconds - a.waiting_duration_seconds;
  });
}

// Reset mock data (useful for testing)
export function resetMockData(): void {
  mockPatients = [...MOCK_PATIENTS];
  mockAssessmentCounter = 6;
  mockPatientCounter = 6;
}
