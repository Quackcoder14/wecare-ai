import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, X, AlertCircle, CheckCircle, Upload, RotateCcw } from 'lucide-react';
import { realVoiceService, type VoiceRecordingState, getSupportedMimeType, validateAudioBlob } from '../../services/voiceService';
import { getSpeechLanguageCode } from '../../i18n/context';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { animate } from 'animejs';

interface VoiceRecorderProps {
  locale: 'en' | 'ta' | 'te' | 'hi';
  onTranscript: (transcript: string, confirmed: boolean) => void;
  initialTranscript?: string;
  t: (key: string) => string;
}

export function VoiceRecorder({ locale, onTranscript, initialTranscript = '', t }: VoiceRecorderProps) {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<VoiceRecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      clearTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearTimer();
  };

  const resetState = useCallback(() => {
    setState('idle');
    setRecordingTime(0);
    setTranscript('');
    setConfirmed(false);
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];
    onTranscript('', false);
  }, [onTranscript]);

  const handleStartRecording = async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t('voice.errors.unsupportedBrowser'));
      return;
    }

    try {
      setState('requesting_permission');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        setError(t('voice.errors.unsupportedBrowser'));
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const validation = validateAudioBlob(blob);
        if (!validation.valid) {
          setError(validation.error || t('voice.errors.noAudioData'));
          setState('error');
          return;
        }
        setAudioBlob(blob);
        setState('stopped');
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState('recording');
      startTimer();

      if (!reducedMotion) {
        animate('.recording-pulse', {
          scale: [1, 1.2],
          opacity: [1, 0.5],
          duration: 1000,
          loop: true,
          easing: 'easeInOutQuad',
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(t('voice.errors.permissionDenied'));
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError(t('voice.errors.noMicrophone'));
      } else {
        setError(t('voice.errors.networkError'));
      }
      setState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTimer();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (!reducedMotion) {
      // Animation will be cleaned up when element unmounts
    }
  };

  const handleCancel = () => {
    stopRecording();
    resetState();
    setState('cancelled');
  };

  const handleUpload = async () => {
    if (!audioBlob) {
      setError(t('voice.errors.noAudioData'));
      return;
    }

    setState('uploading');
    setError(null);

    try {
      setState('transcribing');
      const languageCode = getSpeechLanguageCode(locale);
      const result = await realVoiceService.transcribe(audioBlob, languageCode, t);

      setTranscript(result.transcript);
      setConfirmed(false);
      setState('ready');
      onTranscript(result.transcript, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('voice.errors.transcriptionFailed'));
      setState('error');
    }
  };

  const handleRetry = () => {
    if (!audioBlob) {
      resetState();
      handleStartRecording();
    } else {
      setError(null);
      handleUpload();
    }
  };

  const handleClear = () => {
    resetState();
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onTranscript(transcript, true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getStateConfig = () => {
    switch (state) {
      case 'idle':
        return { label: t('voice.states.ready'), icon: Mic, color: 'text-teal', bg: 'bg-pale-blue' };
      case 'requesting_permission':
        return { label: t('voice.states.requestingPermission'), icon: Loader2, color: 'text-teal', bg: 'bg-pale-blue', spinning: true };
      case 'recording':
        return { label: t('voice.states.recording'), icon: Mic, color: 'text-acuity-red', bg: 'bg-acuity-red/10', pulsing: true };
      case 'stopped':
        return { label: t('voice.states.stopped'), icon: MicOff, color: 'text-secondary', bg: 'bg-gray-100' };
      case 'uploading':
        return { label: t('voice.states.uploading'), icon: Upload, color: 'text-teal', bg: 'bg-pale-blue', spinning: true };
      case 'transcribing':
        return { label: t('voice.states.transcribing'), icon: Loader2, color: 'text-teal', bg: 'bg-pale-blue', spinning: true };
      case 'ready':
        return { label: t('voice.states.transcriptReady'), icon: CheckCircle, color: 'text-acuity-green', bg: 'bg-acuity-green/10' };
      case 'error':
        return { label: t('voice.states.failed'), icon: AlertCircle, color: 'text-acuity-red', bg: 'bg-acuity-red/10' };
      case 'cancelled':
        return { label: t('voice.states.cancelled'), icon: X, color: 'text-secondary', bg: 'bg-gray-100' };
      default:
        return { label: state, icon: Mic, color: 'text-teal', bg: 'bg-pale-blue' };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  // Compute control buttons based on state
  const canStart = state === 'idle' || state === 'cancelled' || state === 'error' || state === 'stopped';
  const isRecording = state === 'recording';
  const canCancel = state === 'recording' || state === 'stopped' || state === 'uploading' || state === 'transcribing';
  const isUploadingOrTranscribing = state === 'uploading' || state === 'transcribing';
  const isReady = state === 'ready';
  const isError = state === 'error';
  const isStopped = state === 'stopped';

  const controls = (
    <div className="flex flex-wrap gap-3 mb-4" role="group" aria-label={t('voice.title')}>
      {canStart && (
        <button
          onClick={handleStartRecording}
          disabled={!canStart}
          className="btn btn-primary flex items-center gap-2"
        >
          <Mic className="w-4 h-4" aria-hidden="true" />
          {t('voice.buttons.startRecording')}
        </button>
      )}

      {isRecording && (
        <button
          onClick={stopRecording}
          className="btn btn-danger flex items-center gap-2"
        >
          <MicOff className="w-4 h-4" aria-hidden="true" />
          {t('voice.buttons.stopRecording')}
        </button>
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isUploadingOrTranscribing}
          className="btn btn-outline flex items-center gap-2"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          {t('voice.buttons.cancelRecording')}
        </button>
      )}

      {isStopped && (
        <button
          onClick={handleUpload}
          className="btn btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          {t('voice.buttons.retry')}
        </button>
      )}

      {isError && (
        <button
          onClick={handleRetry}
          className="btn btn-primary flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          {t('voice.buttons.retry')}
        </button>
      )}

      {isReady && (
        <>
          <button
            onClick={handleClear}
            className="btn btn-outline flex items-center gap-2"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            {t('voice.buttons.clear')}
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            {t('voice.buttons.confirm')}
          </button>
        </>
      )}
    </div>
  );

  return (
    <section className="card p-5" aria-labelledby="voice-heading">
      <h2 id="voice-heading" className="text-lg font-semibold text-charcoal mb-2 flex items-center gap-2">
        <Mic className="w-5 h-5 text-teal" aria-hidden="true" />
        {t('voice.title')}
      </h2>
      <p className="text-secondary text-sm mb-4">{t('voice.instructions')}</p>

      {/* Language selector for voice */}
      <div className="mb-4">
        <label className="label">{t('voice.selectedLanguage')}</label>
        <div className="input bg-pale-blue cursor-default flex items-center justify-between">
          <span>{locale.toUpperCase()} ({getSpeechLanguageCode(locale)})</span>
        </div>
      </div>

      {/* Recording status */}
      <div className="mb-4 p-4 rounded-lg border" role="status" aria-live="polite" aria-label={config.label}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color} ${config.spinning ? 'animate-spin' : ''} ${config.pulsing ? 'recording-pulse' : ''}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-charcoal">{config.label}</p>
              {state === 'recording' && (
                <p className="text-sm font-mono text-secondary">{t('voice.recordingTime')}: {formatTime(recordingTime)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls based on state */}
      {controls}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={isUploadingOrTranscribing}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  {t('voice.buttons.cancelRecording')}
                </button>
              )}

              {isStopped && (
                <button
                  onClick={handleUpload}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  {t('voice.buttons.retry')}
                </button>
              )}

              {isError && (
                <button
                  onClick={handleRetry}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  {t('voice.buttons.retry')}
                </button>
              )}

              {isReady && (
                <>
                  <button
                    onClick={handleClear}
                    className="btn btn-outline flex items-center gap-2"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    {t('voice.buttons.clear')}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    {t('voice.buttons.confirm')}
                  </button>
                </>
              )}
            {/* Transcript editor */}
      {(state === 'ready' || state === 'error' || transcript) && (
        <div className="border-t border-border pt-4">
          <label htmlFor="transcript" className="label">
            {t('voice.transcriptLabel')} {confirmed && <span className="text-acuity-green text-sm">({t('voice.buttons.confirm')})</span>}
          </label>
          <textarea
            ref={textareaRef}
            id="transcript"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              onTranscript(e.target.value, confirmed);
            }}
            placeholder={t('voice.transcriptPlaceholder')}
            className="input min-h-[100px] resize-y"
            rows={4}
            aria-label={t('voice.transcriptLabel')}
            disabled={state === 'uploading' || state === 'transcribing'}
          />
          {state === 'error' && error && (
            <p className="error-text mt-2 flex items-center gap-1" role="alert">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      )}

      {/* Fallback to manual entry */}
      <button
        type="button"
        onClick={() => onTranscript('', false)}
        className="btn btn-ghost flex items-center gap-2 mt-4 text-secondary"
      >
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
        {t('voice.buttons.manualEntry')}
      </button>
    </section>
  );
}