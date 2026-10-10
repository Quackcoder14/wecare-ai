import { User, Phone, Globe, Calendar } from 'lucide-react';
import type { PatientCreateRequest } from '../../types/api';
import { useTranslation } from '../../i18n/context';

interface BasicInfoStepProps {
  formData: PatientCreateRequest;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  onNext: () => void;
}

export function BasicInfoStep({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  onNext,
}: BasicInfoStepProps) {
  const { t } = useTranslation();
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('intake.sections.patientInfo')}</h2>
            <p className="text-sm text-slate-500">{t('intake.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Patient Name */}
          <div>
            <label htmlFor="patient-name" className="block text-sm font-semibold text-slate-700 mb-2">
              Patient Full Name *
            </label>
            <div className="relative">
              <input
                id="patient-name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => onChange('name', e.target.value)}
                onBlur={() => onBlur('name')}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 text-base"
                required
              />
              <User className="w-5 h-5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label htmlFor="patient-age" className="block text-sm font-semibold text-slate-700 mb-2">
              {t('intake.patientInfo.ageLabel')} *
            </label>
            <div className="relative">
              <input
                id="patient-age"
                type="number"
                min="1"
                max="120"
                step="1"
                value={formData.age === 0 ? '' : formData.age}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  onChange('age', isNaN(val as number) ? '' : val);
                }}
                onBlur={() => onBlur('age')}
                placeholder="e.g. 33"
                className={`w-full px-4 py-3 rounded-xl border ${
                  touched.age && errors.age ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 text-base`}
                required
              />
              <Calendar className="w-5 h-5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
            {touched.age && errors.age ? (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.age}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">{t('intake.patientInfo.ageInvalid')}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Gender *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChange('gender', 'male')}
                style={{
                  backgroundColor: (formData.gender || 'male') === 'male' ? '#0f2942' : '#e0f2fe',
                  color: (formData.gender || 'male') === 'male' ? '#ffffff' : '#0f2942',
                }}
                className="gender-btn"
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => onChange('gender', 'female')}
                style={{
                  backgroundColor: formData.gender === 'female' ? '#0f2942' : '#e0f2fe',
                  color: formData.gender === 'female' ? '#ffffff' : '#0f2942',
                }}
                className="gender-btn"
              >
                Female
              </button>
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="preferred-language" className="block text-sm font-semibold text-slate-700 mb-2">
              {t('header.language')} *
            </label>
            <div className="relative">
              <select
                id="preferred-language"
                value={formData.preferred_language || 'en'}
                onChange={(e) => onChange('preferred_language', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 text-base bg-white"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              <Globe className="w-5 h-5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Voice recognition will adapt to this language</p>
          </div>

          {/* Contact / Phone (optional) */}
          <div className="md:col-span-2">
            <label htmlFor="patient-contact" className="block text-sm font-semibold text-slate-700 mb-2">
              Contact / Patient Phone (Optional)
            </label>
            <div className="relative">
              <input
                id="patient-contact"
                type="tel"
                value={formData.symptom_onset || ''}
                onChange={(e) => onChange('symptom_onset', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 text-base"
              />
              <Phone className="w-5 h-5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
          className="intake-btn-primary"
        >
            <span>{t('common.next')}: {t('intake.sections.vitalSigns')}</span>
          <span>→</span>
        </button>
      </div>
    </form>
  );
}
