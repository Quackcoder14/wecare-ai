import { apiClient } from './apiClient';
import { realPatientService, type PatientService } from './patientService';
import { realAssessmentService, type AssessmentService } from './assessmentService';
import { realVoiceService, type VoiceService } from './voiceService';
import { realQueueService, type QueueService } from './queueService';
import {
  mockPatientService,
  mockAssessmentService,
  mockVoiceService,
  mockQueueService,
} from '../mocks/mockAdapter';

export interface Services {
  patient: PatientService;
  assessment: AssessmentService;
  voice: VoiceService;
  queue: QueueService;
}

let servicesCache: Services | null = null;

export function getServices(): Services {
  if (servicesCache) return servicesCache;

  const useMock = apiClient.getConfig().useMock;

  if (useMock) {
    servicesCache = {
      patient: mockPatientService,
      assessment: mockAssessmentService,
      voice: mockVoiceService,
      queue: mockQueueService,
    };
  } else {
    servicesCache = {
      patient: realPatientService,
      assessment: realAssessmentService,
      voice: realVoiceService,
      queue: realQueueService,
    };
  }

  return servicesCache;
}

export function resetServices(): void {
  servicesCache = null;
}

export function setUseMock(useMock: boolean): void {
  apiClient.setConfig({ useMock });
  resetServices();
}