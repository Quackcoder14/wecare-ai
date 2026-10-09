import { useState, useRef, useEffect } from 'react';
import { CheckCircle, X, Edit2, Copy } from 'lucide-react';

interface TranscriptEditorProps {
  transcript: string;
  onChange: (transcript: string) => void;
  onConfirm: () => void;
  onClear: () => void;
  confirmed?: boolean;
  recognizedLanguage?: string;
  t: (key: string) => string;
}

export function TranscriptEditor({
  transcript,
  onChange,
  onConfirm,
  onClear,
  confirmed = false,
  recognizedLanguage,
  t,
}: TranscriptEditorProps) {
  const [editing, setEditing] = useState(!confirmed);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  };

  return (
    <div className="card p-5" aria-labelledby="transcript-heading">
      <h2 id="transcript-heading" className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {t('voice.transcriptLabel')}
      </h2>

      {recognizedLanguage && (
        <p className="text-sm text-secondary mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          {t('voice.recognizedLanguage')}: {recognizedLanguage}
        </p>
      )}

      {confirmed && (
        <div className="mb-4 p-3 bg-acuity-green/10 border border-acuity-green/20 rounded-lg flex items-center gap-2 text-acuity-green">
          <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">{t('voice.buttons.confirm')}</span>
        </div>
      )}

      <div className="relative">
        {editing ? (
          <>
            <textarea
              ref={textareaRef}
              value={transcript}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t('voice.transcriptPlaceholder')}
              className="input min-h-[100px] resize-y pr-28"
              rows={4}
              aria-label={t('a11y.transcriptEditable')}
            />
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-ghost p-1.5"
                aria-label={copied ? 'Copied' : 'Copy transcript'}
              >
                {copied ? <CheckCircle className="w-4 h-4 text-acuity-green" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn btn-primary flex items-center gap-1 text-xs"
              >
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                {t('voice.buttons.confirm')}
              </button>
              <button
                type="button"
                onClick={onClear}
                className="btn btn-ghost p-1.5 text-secondary hover:text-acuity-red"
                aria-label={t('voice.buttons.clear')}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="input min-h-[100px] bg-background cursor-text"
              role="textbox"
              aria-label={t('a11y.transcriptEditable')}
              aria-readonly="true"
            >
              {transcript || <span className="text-secondary">{t('voice.transcriptPlaceholder')}</span>}
            </div>
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-ghost p-1.5"
                aria-label={copied ? 'Copied' : 'Copy transcript'}
              >
                {copied ? <CheckCircle className="w-4 h-4 text-acuity-green" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn btn-ghost p-1.5"
                aria-label={t('voice.buttons.retry')}
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>

      {!editing && !confirmed && transcript && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            {t('voice.buttons.useAsNotes')}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="btn btn-outline flex items-center gap-2"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            {t('voice.buttons.clear')}
          </button>
        </div>
      )}
    </div>
  );
}