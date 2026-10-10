import { useState, useRef } from 'react';
import { Upload, FileText, Check, X, CheckCircle2 } from 'lucide-react';

interface MedicalHistoryStepProps {
  medicalHistory: string;
  onMedicalHistoryChange: (history: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const COMMON_CONDITIONS = [
  'No History',
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'COPD',
  'Cancer',
  'Kidney Disease',
  'Stroke / TIA',
  'Liver Disease',
  'Immunodeficiency',
];

const DOCUMENT_CONDITION_KEYWORDS: Record<string, string[]> = {
  'Diabetes': ['diabetes', 'diabetic', 't2d', 't1d', 'insulin', 'metformin', 'hba1c', 'hyperglycemia'],
  'Hypertension': ['hypertension', 'high blood pressure', 'htn', 'amlodipine', 'lisinopril', 'telmisartan'],
  'Heart Disease': ['heart disease', 'cad', 'coronary', 'myocardial', 'stent', 'angina', 'cardiac', 'congestive heart failure', 'chf'],
  'Asthma': ['asthma', 'bronchial', 'inhaler', 'albuterol', 'salbutamol', 'budesonide'],
  'COPD': ['copd', 'emphysema', 'chronic bronchitis', 'chronic obstructive'],
  'Cancer': ['cancer', 'malignancy', 'carcinoma', 'chemotherapy', 'radiation oncology', 'tumor', 'lymphoma'],
  'Kidney Disease': ['kidney disease', 'ckd', 'renal failure', 'nephropathy', 'dialysis', 'creatinine'],
  'Stroke / TIA': ['stroke', 'tia', 'transient ischemic', 'cerebrovascular', 'cva'],
  'Liver Disease': ['liver disease', 'cirrhosis', 'hepatitis', 'fatty liver', 'jaundice'],
  'Immunodeficiency': ['immunodeficiency', 'hiv', 'immunosuppressed', 'autoimmune'],
};

export function MedicalHistoryStep({
  medicalHistory,
  onMedicalHistoryChange,
  onBack,
  onNext,
}: MedicalHistoryStepProps) {
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [extractedNotice, setExtractedNotice] = useState<string[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanDetails, setScanDetails] = useState<{
    medications?: string[];
    allergies?: string[];
    lab_values?: Record<string, string>;
    clinical_notes?: string;
    extracted_symptoms?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSelectedConditions = (): string[] => {
    if (!medicalHistory || medicalHistory.trim() === '' || medicalHistory === 'No History') {
      return ['No History'];
    }
    const parts = medicalHistory.split(',').map((p) => p.trim()).filter(Boolean);
    return parts.length > 0 ? parts : ['No History'];
  };

  const selectedConditions = getSelectedConditions();

  const toggleCondition = (condition: string) => {
    if (condition === 'No History') {
      onMedicalHistoryChange('No History');
      return;
    }
    let updated: string[];
    if (selectedConditions.includes(condition)) {
      updated = selectedConditions.filter((c) => c !== condition && c !== 'No History');
    } else {
      updated = [...selectedConditions.filter((c) => c !== 'No History'), condition];
    }
    onMedicalHistoryChange(updated.length === 0 ? 'No History' : updated.join(', '));
  };

  const parseAndExtractFile = async (file: File) => {
    setUploadedFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
    setIsScanning(true);
    setScanDetails(null);
    setExtractedNotice(null);

    try {
      // --- Primary: Groq AI document scan ---
      const formData = new FormData();
      formData.append('file', file);
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
      const resp = await fetch(`${apiBase}/api/assessments/scan-document`, {
        method: 'POST',
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        const extracted = data.extracted || {};
        const aiConditions: string[] = (extracted.conditions || []).filter((c: string) =>
          COMMON_CONDITIONS.includes(c)
        );
        const allConditions = Array.from(new Set([
          ...selectedConditions.filter((c) => c !== 'No History'),
          ...aiConditions,
        ]));
        if (allConditions.length > 0) {
          onMedicalHistoryChange(allConditions.join(', '));
          setExtractedNotice(aiConditions);
        } else {
          setExtractedNotice([]);
        }
        setScanDetails({
          medications: extracted.medications,
          allergies: extracted.allergies,
          lab_values: extracted.lab_values,
          clinical_notes: extracted.clinical_notes,
          extracted_symptoms: extracted.extracted_symptoms,
        });
        setIsScanning(false);
        return;
      }
    } catch (_) {
      // fall through to keyword matching
    }

    // --- Fallback: keyword-matching ---
    let contentToSearch = file.name.toLowerCase();
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
      try { contentToSearch += ' ' + (await file.text()).toLowerCase(); } catch (_) { /* ignore */ }
    } else {
      try {
        const buffer = await file.arrayBuffer();
        contentToSearch += ' ' + new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 50000)).toLowerCase();
      } catch (_) { /* ignore */ }
    }
    const detected: string[] = [];
    Object.entries(DOCUMENT_CONDITION_KEYWORDS).forEach(([condition, keywords]) => {
      if (keywords.some((kw) => contentToSearch.includes(kw))) detected.push(condition);
    });
    if (detected.length > 0) {
      const current = selectedConditions.filter((c) => c !== 'No History');
      onMedicalHistoryChange(Array.from(new Set([...current, ...detected])).join(', '));
      setExtractedNotice(detected);
    } else {
      setExtractedNotice([]);
    }
    setIsScanning(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseAndExtractFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseAndExtractFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setExtractedNotice(null);
    setScanDetails(null);
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.25rem' }}>
          Medical History
        </h2>
        <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>
          Select pre-existing conditions or upload medical records
        </p>
      </div>

      {/* Two-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        alignItems: 'start',
      }}>

        {/* LEFT: Upload Document */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload style={{ width: '1.1rem', height: '1.1rem', color: '#475569' }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Upload Medical Document</span>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#3b82f6' : '#bae6fd'}`,
              borderRadius: '16px',
              padding: '2.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? '#eff6ff' : '#f8fbfe',
              transition: 'all 0.2s',
              minHeight: '180px',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#ffffff', border: '1px solid #bae6fd',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <Upload style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
              Drag and drop or click to browse
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Supported: PDF, JPG, PNG, DOCX, TXT
            </div>
          </div>

          {/* Uploaded file chip */}
          {uploadedFile && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{uploadedFile.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{uploadedFile.size}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#64748b' }}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          )}

          {/* Scanning spinner */}
          {isScanning && (
            <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg style={{ width: '1rem', height: '1rem', color: '#0284c7', animation: 'spin 1s linear infinite', flexShrink: 0 }} fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1' }}>Scanning with Groq AI…</span>
            </div>
          )}

          {/* Extraction banners */}
          {!isScanning && extractedNotice && extractedNotice.length > 0 && (
            <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d' }}>
                AI detected conditions: <strong>{extractedNotice.join(', ')}</strong>
              </span>
            </div>
          )}
          {!isScanning && extractedNotice && extractedNotice.length === 0 && !scanDetails && (
            <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
              No conditions automatically detected. Please select manually.
            </div>
          )}

          {/* Scan Details (medications, allergies, lab values, symptoms) */}
          {!isScanning && scanDetails && (
            <div style={{ padding: '1rem', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Groq AI Document Scan Results
              </div>
              {scanDetails.clinical_notes && (
                <div style={{ fontSize: '0.75rem', color: '#1e40af', fontStyle: 'italic' }}>{scanDetails.clinical_notes}</div>
              )}
              {scanDetails.medications && scanDetails.medications.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#1e293b' }}><strong>Medications:</strong> {scanDetails.medications.join(', ')}</div>
              )}
              {scanDetails.allergies && scanDetails.allergies.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}><strong>Allergies:</strong> {scanDetails.allergies.join(', ')}</div>
              )}
              {scanDetails.extracted_symptoms && scanDetails.extracted_symptoms.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#1e293b' }}><strong>Symptoms noted:</strong> {scanDetails.extracted_symptoms.join(', ')}</div>
              )}
              {scanDetails.lab_values && Object.keys(scanDetails.lab_values).length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#1e293b' }}>
                  <strong>Lab values:</strong>{' '}
                  {Object.entries(scanDetails.lab_values).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>


        {/* RIGHT: Pre-Existing Conditions */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Pre-Existing Condition
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
            {COMMON_CONDITIONS.map((cond) => {
              const isSelected = selectedConditions.includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => toggleCondition(cond)}
                  style={{
                    backgroundColor: isSelected ? '#0f2942' : '#e0f2fe',
                    color: isSelected ? '#ffffff' : '#0f2942',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    fontWeight: 700,
                    fontSize: '0.925rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cond}</span>
                  {isSelected && <Check style={{ width: '1rem', height: '1rem' }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onBack} className="intake-btn-secondary">
          <span>←</span>
          <span>Back to Symptoms</span>
        </button>
        <button type="button" onClick={onNext} className="intake-btn-primary">
          <span>Next: Review Information</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
