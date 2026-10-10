import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, Plus, Edit2, CheckCircle2 } from 'lucide-react';

interface SymptomsStepProps {
  selectedSymptoms: string[];
  transcript: string;
  preferredLanguage: string;
  onSymptomsChange: (symptoms: string[]) => void;
  onTranscriptChange: (transcript: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Difficulty Breathing', 'Chest Pain',
  'Headache', 'Severe Headache', 'Nausea', 'Vomiting',
  'Abdominal Pain', 'Severe Abdominal Pain', 'Fatigue', 'Dizziness',
  'Back Pain', 'Joint Pain', 'Muscle Pain', 'Sore Throat',
  'Runny Nose', 'Congestion', 'Sneezing', 'Loss of Taste',
  'Loss of Smell', 'Rash', 'Itching', 'Swelling',
  'Bleeding', 'Bruising', 'Numbness', 'Tingling',
];

const SYMPTOM_KEYWORDS: Record<string, string[]> = {
  'Fever': ['fever', 'hot', 'temperature', 'pyrexia', 'காச்சல்', 'காய்ச்சல்', 'बुखार', 'ताप', 'జ్వరం'],
  'Cough': ['cough', 'coughing', 'இருமல்', 'खांसी', 'దగ్గు'],
  'Difficulty Breathing': ['difficulty breathing', 'shortness of breath', 'breathless', 'breathing trouble', 'suffocation', 'dyspnea', 'மூச்சுத்திணறல்', 'மூச்சு விட சிரமம்', 'सांस लेने में तकलीफ', 'सांस फूलना', 'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'ఆయాసం'],
  'Chest Pain': ['chest pain', 'chest tightness', 'heart pain', 'chest ache', 'நெஞ்சு வலி', 'மார்பு வலி', 'सीने में दर्द', 'छाती में दर्द', 'ఛాతీ నొప్పి'],
  'Headache': ['headache', 'head ache', 'தலைவலி', 'सिरदर्द', 'सिर में दर्द', 'తలనొప్పి'],
  'Severe Headache': ['severe headache', 'migraine', 'கடும் தலைவலி', 'तीव्र सिरदर्द', 'తీవ్రమైన తలనొప్పి'],
  'Nausea': ['nausea', 'nauseous', 'feel like vomiting', 'sick to stomach', 'குமட்டல்', 'जी मिचलाना', 'వికారం'],
  'Vomiting': ['vomit', 'vomiting', 'threw up', 'throwing up', 'வாந்தி', 'उल्टी', 'వాంతులు'],
  'Abdominal Pain': ['abdominal pain', 'stomach pain', 'belly ache', 'stomach ache', 'வயிறு வலி', 'पेट दर्द', 'కడుపు నొప్పి'],
  'Severe Abdominal Pain': ['severe abdominal pain', 'severe stomach pain', 'கடும் வயிறு வலி', 'तीव्र पेट दर्द', 'తీవ్రమైన కడుపు నొప్పి'],
  'Fatigue': ['fatigue', 'tired', 'exhausted', 'weakness', 'சோர்வு', 'பலவீனம்', 'थकान', 'कमजोरी', 'అలసట', 'నీరసం'],
  'Dizziness': ['dizziness', 'dizzy', 'lightheaded', 'fainting', 'faint', 'vertigo', 'மயக்கம்', 'தலைசுற்றல்', 'चक्कर', 'కళ్ళు తిరగడం'],
  'Back Pain': ['back pain', 'backache', 'முதுகு வலி', 'पीठ दर्द', 'నడుము నొప్పి', 'వెన్నునొప్పి'],
  'Joint Pain': ['joint pain', 'arthralgia', 'joints hurt', 'மூட்டு வலி', 'जोड़ों का दर्द', 'కీళ్ల నొప్పులు'],
  'Muscle Pain': ['muscle pain', 'body ache', 'myalgia', 'தசை வலி', 'உடல் வலி', 'मांसपेशियों में दर्द', 'బడలిక', 'కండరాల నొప్పులు'],
  'Sore Throat': ['sore throat', 'throat hurts', 'throat pain', 'தொண்டை வலி', 'गले में खराश', 'गले में दर्द', 'గొంతు నొప్పి'],
  'Runny Nose': ['runny nose', 'running nose', 'rhinorrhea', 'மூக்கு ஒழுகுதல்', 'बहती नाक', 'కారే ముక్కు'],
  'Congestion': ['congestion', 'stuffy nose', 'blocked nose', 'மூக்கடைப்பு', 'नाक बंद', 'రద్దీ'],
  'Sneezing': ['sneezing', 'sneeze', 'தும்மல்', 'छींक', 'తుమ్ములు'],
  'Loss of Taste': ['loss of taste', 'cannot taste', 'ageusia', 'சுவை இழப்பு', 'स्वाद न आना', 'రుచి కోల్పోవడం'],
  'Loss of Smell': ['loss of smell', 'cannot smell', 'anosmia', 'வாசனை இழப்பு', 'गंध न आना', 'వాసన కోల్పోవడం'],
  'Rash': ['rash', 'skin eruption', 'spots', 'தடிப்புகள்', 'दाने', 'దద్దుర్లు'],
  'Itching': ['itching', 'itchy', 'pruritus', 'அரிப்பு', 'खुजली', 'దురద'],
  'Swelling': ['swelling', 'swollen', 'edema', 'வீக்கம்', 'सूजन', 'వాపు'],
  'Bleeding': ['bleeding', 'blood', 'hemorrhage', 'ரத்தப்போக்கு', 'ரத்தம்', 'रक्तस्राव', 'खून बहना', 'రక్తస్రావం', 'రక్తం'],
  'Bruising': ['bruising', 'bruise', 'contusion', 'நீலக்காயம்', 'காயம்', 'नील पड़ना', 'గాయం'],
  'Numbness': ['numbness', 'numb', 'lost sensation', 'மரத்துப்போதல்', 'உணர்வின்மை', 'सुन्नपन', 'తిమ్మిరి'],
  'Tingling': ['tingling', 'pins and needles', 'paresthesia', 'கூச்சம்', 'झुनझुनी', 'జలదరింపు'],
};

export function SymptomsStep({
  selectedSymptoms,
  transcript,
  preferredLanguage,
  onSymptomsChange,
  onTranscriptChange,
  onBack,
  onNext,
}: SymptomsStepProps) {
  const [isListening, setIsListening] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [tempTranscript, setTempTranscript] = useState(transcript);
  const [otherInput, setOtherInput] = useState('');
  const [identifiedNotice, setIdentifiedNotice] = useState<string[] | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setTempTranscript(transcript);
  }, [transcript]);

  const getSpeechLangCode = (lang: string) => {
    switch (lang) {
      case 'ta': return 'ta-IN';
      case 'te': return 'te-IN';
      case 'hi': return 'hi-IN';
      default: return 'en-US';
    }
  };

  const detectSymptoms = (text: string) => {
    if (!text.trim()) return [];
    const lower = text.toLowerCase();
    const detected: string[] = [];
    Object.entries(SYMPTOM_KEYWORDS).forEach(([symptom, keywords]) => {
      if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        detected.push(symptom);
      }
    });
    return detected;
  };

  const handleApplyDetected = (newDetected: string[]) => {
    if (newDetected.length === 0) return;
    const merged = Array.from(new Set([...selectedSymptoms, ...newDetected]));
    onSymptomsChange(merged);
    setIdentifiedNotice(newDetected);
    setTimeout(() => setIdentifiedNotice(null), 5000);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. You can type or select symptoms directly.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechLangCode(preferredLanguage);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        currentTranscript = currentTranscript.trim();
        onTranscriptChange(currentTranscript);
        setTempTranscript(currentTranscript);
        const detected = detectSymptoms(currentTranscript);
        if (detected.length > 0) handleApplyDetected(detected);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      onSymptomsChange(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      onSymptomsChange([...selectedSymptoms, symptom]);
    }
  };

  const handleAddOther = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otherInput.trim()) return;
    const formatted = otherInput.trim();
    if (!selectedSymptoms.includes(formatted)) {
      onSymptomsChange([...selectedSymptoms, formatted]);
    }
    setOtherInput('');
  };

  const saveEditedTranscript = () => {
    onTranscriptChange(tempTranscript);
    setIsEditingTranscript(false);
    const detected = detectSymptoms(tempTranscript);
    if (detected.length > 0) handleApplyDetected(detected);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Page Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.25rem' }}>
          Select Symptoms
        </h2>
        <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>
          Choose all symptoms the patient is experiencing
        </p>
      </div>

      {/* Voice Input Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '1.25rem 1.75rem',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Voice Input</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              Speak in {preferredLanguage.toUpperCase()} — symptoms will be recognized automatically
            </div>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            style={{
              backgroundColor: isListening ? '#dc2626' : '#0f2942',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              animation: isListening ? 'pulse 1.5s infinite' : 'none',
            }}
          >
            {isListening ? (
              <><MicOff style={{ width: '1rem', height: '1rem' }} /><span>Stop Listening</span></>
            ) : (
              <><Mic style={{ width: '1rem', height: '1rem' }} /><span>Click to Speak</span></>
            )}
          </button>
        </div>

        {/* Live Transcript */}
        {(transcript || isListening) && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '12px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0369a1' }}>
                Spoken Transcript:
              </span>
              <button
                type="button"
                onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit2 style={{ width: '0.75rem', height: '0.75rem' }} />
                <span>{isEditingTranscript ? 'Done Editing' : 'Edit Transcript'}</span>
              </button>
            </div>
            {isEditingTranscript ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={tempTranscript}
                  onChange={(e) => setTempTranscript(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.875rem', color: '#1e293b', background: '#ffffff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={saveEditedTranscript}
                  style={{ alignSelf: 'flex-start', padding: '0.35rem 0.9rem', borderRadius: '8px', background: '#2563eb', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Save & Update Symptoms
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#1e293b', fontStyle: 'italic', margin: 0 }}>
                "{transcript || 'Listening for speech...'}"
              </p>
            )}
          </div>
        )}

        {/* Identified Notice */}
        {identifiedNotice && identifiedNotice.length > 0 && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#16a34a', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d' }}>
              Auto-selected: <strong>{identifiedNotice.join(', ')}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Select Symptoms Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '1.5rem 1.75rem',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Select Symptoms</div>

        {/* Selected count banner */}
        <div style={{
          background: '#f0f9ff',
          borderRadius: '10px',
          padding: '0.6rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0f2942',
          border: '1px solid #e0f2fe',
        }}>
          Selected: {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''}
        </div>

        {/* 4-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.6rem',
        }}>
          {COMMON_SYMPTOMS.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                style={{
                  backgroundColor: isSelected ? '#0f2942' : '#e0f2fe',
                  color: isSelected ? '#ffffff' : '#0f2942',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.7rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{symptom}</span>
                {isSelected && <Check style={{ width: '0.9rem', height: '0.9rem', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Custom / Other symptoms */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
            Other Symptoms (Optional)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={otherInput}
              onChange={(e) => setOtherInput(e.target.value)}
              placeholder="e.g. Chills, night sweats, earache..."
              style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', background: '#f8fafc' }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOther(); } }}
            />
            <button
              type="button"
              onClick={() => handleAddOther()}
              className="intake-btn-primary"
              style={{ padding: '0.65rem 1rem', gap: '0.35rem' }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              <span>Add</span>
            </button>
          </div>

          {/* Custom tags */}
          {selectedSymptoms.filter((s) => !COMMON_SYMPTOMS.includes(s)).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {selectedSymptoms.filter((s) => !COMMON_SYMPTOMS.includes(s)).map((custom) => (
                <span
                  key={custom}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem', borderRadius: '8px', background: '#0f2942', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <span>{custom}</span>
                  <button type="button" onClick={() => toggleSymptom(custom)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onBack} className="intake-btn-secondary">
          <span>←</span>
          <span>Back to Vitals</span>
        </button>
        <button type="button" onClick={onNext} className="intake-btn-primary">
          <span>Next: Medical History</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
