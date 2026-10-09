/**
 * WeCare.AI Translation Keys
 * All keys must be present in all four language files
 */

import type { ReactNode } from 'react';

export type Locale = 'en' | 'ta' | 'te' | 'hi';

export { type ReactNode };

export interface Translations {
  // App
  app: {
    name: string;
    subtitle: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    newPatient: string;
    patientRecords: string;
    help: string;
  };

  // Header
  header: {
    language: string;
    connectionStatus: {
      connected: string;
      demoMode: string;
      unavailable: string;
    };
    userRole: string;
    date: string;
  };

  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    newPatientAction: string;
    summaryCards: {
      waiting: string;
      highAcuity: string;
      needsReview: string;
    };
    queue: {
      title: string;
      patientId: string;
      age: string;
      acuity: string;
      assessment: string;
      waitingTime: string;
      reviewStatus: string;
      action: string;
      emptyState: string;
      loadingState: string;
      errorState: string;
      retry: string;
    };
    filters: {
      all: string;
      red: string;
      yellow: string;
      green: string;
      needsReview: string;
    };
    refresh: string;
  };

  // Patient Intake
  intake: {
    title: string;
    subtitle: string;
    sections: {
      patientInfo: string;
      symptoms: string;
      vitalSigns: string;
      inputMethod: string;
      review: string;
    };
    patientInfo: {
      ageLabel: string;
      agePlaceholder: string;
      ageRequired: string;
      ageInvalid: string;
      ageUnder12: string;
      ageUnder12Message: string;
    };
    symptoms: {
      label: string;
      placeholder: string;
      addSymptom: string;
      removeSymptom: string;
      onsetLabel: string;
      onsetPlaceholder: string;
      medicalHistoryLabel: string;
      medicalHistoryPlaceholder: string;
      structuredSymptoms: string;
      freeTextSymptoms: string;
    };
    vitalSigns: {
      label: string;
      heartRate: { label: string; unit: string; placeholder: string };
      respiratoryRate: { label: string; unit: string; placeholder: string };
      spo2: { label: string; unit: string; placeholder: string };
      systolicBp: { label: string; unit: string; placeholder: string };
      temperature: { label: string; unit: string; placeholder: string };
      missingInfoNote: string;
    };
    inputMethod: {
      label: string;
      manual: string;
      voice: string;
      voiceDescription: string;
    };
    review: {
      title: string;
      age: string;
      symptoms: string;
      vitalSigns: string;
      inputMethod: string;
      language: string;
      transcript: string;
      submit: string;
      submitting: string;
      submitSuccess: string;
      submitError: string;
      duplicateError: string;
    };
    validation: {
      required: string;
      mustBeNumber: string;
      mustBePositive: string;
      mustBeInteger: string;
      maxValue: string;
    };
  };

  // Voice Recorder
  voice: {
    title: string;
    instructions: string;
    selectedLanguage: string;
    states: {
      ready: string;
      requestingPermission: string;
      recording: string;
      stopped: string;
      uploading: string;
      transcribing: string;
      transcriptReady: string;
      failed: string;
      cancelled: string;
    };
    buttons: {
      startRecording: string;
      stopRecording: string;
      cancelRecording: string;
      retry: string;
      clear: string;
      confirm: string;
      useAsNotes: string;
      manualEntry: string;
    };
    errors: {
      noMicrophone: string;
      permissionDenied: string;
      noAudioData: string;
      uploadFailed: string;
      transcriptionFailed: string;
      unsupportedBrowser: string;
      networkError: string;
    };
    recordingTime: string;
    transcriptLabel: string;
    transcriptPlaceholder: string;
    recognizedLanguage: string;
  };

  // Assessment Result
  assessment: {
    title: string;
    patientId: string;
    age: string;
    assessmentId: string;
    acuity: string;
    reasons: string;
    missingInformation: string;
    reviewRequired: string;
    timestamp: string;
    rulesVersion: string;
    actions: {
      acknowledge: string;
      reassess: string;
      backToDashboard: string;
      viewDetails: string;
    };
    acuityLabels: {
      red: string;
      yellow: string;
      green: string;
      unknown: string;
    };
    reviewLabels: {
      required: string;
      acknowledged: string;
      notRequired: string;
    };
  };

  // Patient Details
  patientDetails: {
    title: string;
    subtitle: string;
    tabs: {
      overview: string;
      history: string;
      reassess: string;
    };
    overview: {
      patientId: string;
      age: string;
      currentAssessment: string;
      acuity: string;
      reasons: string;
      vitalSigns: string;
      missingInfo: string;
      reviewStatus: string;
      assessedAt: string;
      rulesVersion: string;
    };
    history: {
      title: string;
      empty: string;
      assessmentId: string;
      acuity: string;
      reasons: string;
      timestamp: string;
      rulesVersion: string;
    };
    reassess: {
      title: string;
      subtitle: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
      changedValues: string;
    };
    actions: {
      acknowledge: string;
      acknowledging: string;
      acknowledgeSuccess: string;
      acknowledgeError: string;
      reassess: string;
      back: string;
    };
  };

  // Common
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    yes: string;
    no: string;
    ok: string;
    search: string;
    filter: string;
    clear: string;
    refresh: string;
    demoModeBanner: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    justNow: string;
  };

  // Accessibility
  a11y: {
    closeMenu: string;
    openMenu: string;
    selectLanguage: string;
    currentLanguage: string;
    recordingInProgress: string;
    recordingStopped: string;
    transcriptEditable: string;
    queueRow: string;
    acuityLevel: string;
    reviewRequired: string;
    expandDetails: string;
    collapseDetails: string;
  };
}

export type TranslationKeys = Translations;