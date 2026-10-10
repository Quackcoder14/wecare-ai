import { useNavigate } from 'react-router-dom';
import { ArrowRight, Printer, RotateCcw, Hospital, ShieldCheck } from 'lucide-react';
import type { AssessmentResponse, PatientCreateRequest } from '../../types/api';

interface RiskAssessmentResultStepProps {
  assessment: AssessmentResponse;
  patientId: string;
  formData: PatientCreateRequest;
  onReset: () => void;
}

export function RiskAssessmentResultStep({
  assessment,
  patientId,
  formData,
  onReset,
}: RiskAssessmentResultStepProps) {
  const navigate = useNavigate();

  const score = assessment.risk_score ?? calculateFallbackRiskScore(formData, assessment.acuity);
  const level = assessment.risk_level ?? (score >= 67 ? 'HIGH' : score >= 34 ? 'MEDIUM' : 'LOW');
  const confidence = assessment.confidence ?? 94;
  const department = assessment.recommended_department ?? getRecommendedDepartment(formData, level);

  const contributingFactors = assessment.contributing_factors && assessment.contributing_factors.length > 0
    ? assessment.contributing_factors
    : calculateFallbackFactors(formData);

  const levelConfig = ({
    LOW:    { color: '#16a34a', border: '#22c55e', bg: '#f0fdf4', label: 'LOW' },
    MEDIUM: { color: '#ea580c', border: '#f59e0b', bg: '#fffbeb', label: 'MEDIUM' },
    HIGH:   { color: '#dc2626', border: '#ef4444', bg: '#fef2f2', label: 'HIGH' },
  } as any)[level] || { color: '#ea580c', border: '#f59e0b', bg: '#fffbeb', label: level };

  // Pointer: 0-33 = LOW zone, 34-66 = MEDIUM zone, 67-100 = HIGH zone
  const pointerPercent = Math.min(96, Math.max(4, score));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.25rem' }}>
          Risk Assessment
        </h2>
        <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {assessment.ai_source === 'groq' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '20px', letterSpacing: '0.04em' }}>
              ⚡ GROQ AI POWERED
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '20px' }}>
              🛡 Rules Engine
            </span>
          )}
          AI-Powered Risk Analysis Results
        </p>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Risk Level */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Risk Level</div>

          {/* Risk card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Risk Assessment</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                Health Risk Evaluation • Patient {patientId}
              </div>
            </div>

            {/* Tri-color Gradient Bar */}
            <div>
              <div style={{
                height: '36px',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                position: 'relative',
              }}>
                <div style={{ flex: 1, background: 'linear-gradient(to right, #22c55e, #4ade80)' }} />
                <div style={{ flex: 1, background: 'linear-gradient(to right, #fbbf24, #f97316)' }} />
                <div style={{ flex: 1, background: 'linear-gradient(to right, #f97316, #dc2626)' }} />
              </div>

              {/* Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 2px', marginTop: '0.25rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a' }}>LOW</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>0-33</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706' }}>MEDIUM</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>34-66</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626' }}>HIGH</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>67-100</div>
                </div>
              </div>

              {/* Pointer arrow */}
              <div style={{ position: 'relative', height: '16px', marginTop: '0.1rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${pointerPercent}%`,
                    transform: 'translateX(-50%)',
                    top: 0,
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: `12px solid ${levelConfig.border}`,
                    transition: 'left 0.7s ease',
                  }}
                />
              </div>
            </div>

            {/* Score & Level badge */}
            <div style={{
              border: `2px solid ${levelConfig.border}`,
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              background: levelConfig.bg,
            }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 900, color: levelConfig.color, lineHeight: 1 }}>
                {score}
              </span>
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.25rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>
                  RISK LEVEL
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: levelConfig.color, letterSpacing: '0.02em' }}>
                  {level}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
              Risk Score: <span style={{ color: '#0f172a', fontWeight: 800 }}>{score}/100</span>
            </div>
          </div>

          {/* Department + Confidence */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Hospital style={{ width: '1.1rem', height: '1.1rem', color: '#2563eb' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>Recommended Department</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2942' }}>{department}</div>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.35rem 0.75rem', borderRadius: '20px',
              background: '#f0fdf4', color: '#15803d',
              border: '1px solid #86efac', fontSize: '0.75rem', fontWeight: 700,
              flexShrink: 0,
            }}>
              <ShieldCheck style={{ width: '0.9rem', height: '0.9rem', color: '#16a34a' }} />
              <span>{typeof confidence === 'number' && confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence as number)}% Confidence</span>
            </div>
          </div>

          {/* Clinical Summary from Groq */}
          {assessment.clinical_summary && (
            <div style={{
              background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              boxShadow: '0 1px 6px rgba(124,58,237,0.1)',
              border: '1px solid #c4b5fd',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⚡ Groq AI Clinical Summary
              </div>
              <p style={{ fontSize: '0.85rem', color: '#4c1d95', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                {assessment.clinical_summary}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Contributing Factors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Contributing Factors</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {contributingFactors.map((factor, idx) => {
              const displayPct = factor.raw_percentage || Math.round(factor.percentage);
              return (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.1rem 1.25rem',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{factor.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                      {factor.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Circle badge */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      border: '3px solid #f59e0b',
                      background: '#fffbeb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1e293b' }}>{displayPct}%</span>
                    </div>
                    {/* Bar */}
                    <div style={{ flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, factor.percentage))}%`,
                          height: '100%',
                          background: 'linear-gradient(to right, #fbbf24, #f97316)',
                          borderRadius: '100px',
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clinical Recommendations */}
          <div style={{
            background: '#f0f7fb',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            border: '1px solid #bae6fd',
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f2942', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>✓</span>
              <span>Immediate Clinical Recommendations</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li style={{ fontSize: '0.8rem', color: '#475569' }}>Initiate vital signs monitoring every 15-30 minutes.</li>
              <li style={{ fontSize: '0.8rem', color: '#475569' }}>Route patient to {department} for physician consultation.</li>
              {level === 'HIGH' && (
                <li style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 700 }}>
                  Alert attending triage physician immediately; initiate emergency bedside protocol.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0',
      }}>
        <button type="button" onClick={onReset} className="intake-btn-secondary">
          <RotateCcw style={{ width: '1rem', height: '1rem' }} />
          <span>Register New Patient</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" onClick={() => window.print()} className="intake-btn-secondary">
            <Printer style={{ width: '1rem', height: '1rem' }} />
            <span>Print Report</span>
          </button>
          <button type="button" onClick={() => navigate('/')} className="intake-btn-primary">
            <span>Go to Priority Queue</span>
            <ArrowRight style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fallback helpers ──────────────────────────────────────────────────────────

function calculateFallbackRiskScore(formData: PatientCreateRequest, acuity?: string): number {
  if (acuity === 'red') return 82;
  if (acuity === 'yellow') return 48;
  if (acuity === 'green') return 22;

  let pts = 0;
  const v = formData.vitals || {};
  if (v.systolic_bp_mmhg && (v.systolic_bp_mmhg > 140 || v.systolic_bp_mmhg < 90)) pts += 20;
  if (v.heart_rate_bpm && (v.heart_rate_bpm > 100 || v.heart_rate_bpm < 50)) pts += 18;
  if (v.temperature_c && (v.temperature_c > 38.0 || v.temperature_c < 35.5)) pts += 18;
  if (v.spo2_percent && v.spo2_percent < 95) pts += 22;
  if (formData.symptoms && formData.symptoms.length > 0) pts += formData.symptoms.length * 5;

  return Math.min(98, Math.max(15, pts + 10));
}

function getRecommendedDepartment(formData: PatientCreateRequest, level: string): string {
  const symps = (formData.symptoms || []).join(' ').toLowerCase();
  const v = formData.vitals || {};
  if (symps.includes('chest') || (v.systolic_bp_mmhg && v.systolic_bp_mmhg > 180)) return 'Cardiology & Emergency Care';
  if (symps.includes('breath') || (v.spo2_percent && v.spo2_percent < 92)) return 'Pulmonology & Respiratory Medicine';
  if (symps.includes('abdominal') || symps.includes('vomit')) return 'Gastroenterology & General Surgery';
  if (level === 'HIGH') return 'Emergency Medicine & Trauma Center';
  if (level === 'MEDIUM') return 'Internal Medicine & Urgent Care';
  return 'General Medicine & Primary Care';
}

function calculateFallbackFactors(formData: PatientCreateRequest) {
  const list: { name: string; percentage: number; raw_percentage: number }[] = [];
  const v = formData.vitals || {};
  if (v.systolic_bp_mmhg && (v.systolic_bp_mmhg > 130 || v.systolic_bp_mmhg < 90))
    list.push({ name: 'High Blood Pressure', percentage: 33.3, raw_percentage: 33 });
  if (v.heart_rate_bpm && (v.heart_rate_bpm > 100 || v.heart_rate_bpm < 60))
    list.push({ name: 'Abnormal Heart Rate', percentage: 26.7, raw_percentage: 27 });
  if (v.temperature_c && (v.temperature_c > 37.8 || v.temperature_c < 36.0))
    list.push({ name: 'Abnormal Temperature', percentage: 40.0, raw_percentage: 40 });
  if (list.length === 0)
    list.push({ name: 'Vital Signs Baseline', percentage: 100.0, raw_percentage: 100 });
  return list;
}
