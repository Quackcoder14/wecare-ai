import { apiClient, formatApiError } from './apiClient';
import type { VoiceTranscribeResponse } from '../types/api';

export interface VoiceService {
  transcribe(audioBlob: Blob, languageCode: string, t: (key: string) => string): Promise<VoiceTranscribeResponse>;
}

export const realVoiceService: VoiceService = {
  async transcribe(audioBlob, languageCode, t) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language_code', languageCode);

      const response = await fetch(`${apiClient.getConfig().baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorData: { code: string; message: string; status_code: number };
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = {
            code: 'HTTP_ERROR',
            message: text || `HTTP ${response.status}: ${response.statusText}`,
            status_code: response.status,
          };
        }

        throw errorData;
      }

      return response.json();
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },
};

// Voice recording states
export type VoiceRecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopped'
  | 'uploading'
  | 'transcribing'
  | 'ready'
  | 'error'
  | 'cancelled'
  | 'error'
  | 'cancelled';

// Supported audio MIME types in order of preference
export const SUPPORTED_AUDIO_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
];

export function getSupportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;

  for (const type of SUPPORTED_AUDIO_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

// Check if browser supports voice recording
export function isVoiceRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined' &&
    getSupportedMimeType() !== null
  );
}

// Format recording duration
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Create audio blob from chunks
export function createAudioBlob(chunks: BlobPart[], mimeType: string): Blob {
  return new Blob(chunks, { type: mimeType });
}

// Validate audio blob
export function validateAudioBlob(blob: Blob): { valid: boolean; error?: string } {
  if (!blob || blob.size === 0) {
    return { valid: false, error: 'No audio data recorded' };
  }
  if (blob.size > 25 * 1024 * 1024) { // 25MB limit
    return { valid: false, error: 'Audio file too large (max 25MB)' };
  }
  return { valid: true };
}