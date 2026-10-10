import { useEffect, useState } from 'react';
import type { Locale } from '../i18n';

interface SplashScreenProps {
  onLanguageSelect: (locale: Locale) => void;
}

const languages: { locale: Locale; name: string; native: string; flag: string }[] = [
  { locale: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { locale: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { locale: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { locale: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
];

export function SplashScreen({ onLanguageSelect }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'languages'>('logo');
  const [logoVisible, setLogoVisible] = useState(false);
  const [langsVisible, setLangsVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 100);
    const t2 = setTimeout(() => setPhase('languages'), 1600);
    const t3 = setTimeout(() => setLangsVisible(true), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="splash-root">
      {/* Subtle background blobs – light */}
      <div className="splash-blob splash-blob-1" />
      <div className="splash-blob splash-blob-2" />

      <div className="splash-content">
        {/* Logo section */}
        <div className={`splash-logo-section ${logoVisible ? 'splash-logo-visible' : ''}`}>
          <div className="splash-icon-ring">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="splash-icon-svg">
              <circle cx="28" cy="28" r="28" fill="url(#splashGradLight)" />
              <path d="M28 14v28M14 28h28" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="splashGradLight" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1AD8DA" />
                  <stop offset="100%" stopColor="#087F80" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="splash-title">WeCare<span className="splash-title-dot">.AI</span></h1>
          <p className="splash-tagline">Emergency Triage Decision Support</p>
        </div>

        {/* Language selection */}
        {phase === 'languages' && (
          <div className={`splash-lang-section ${langsVisible ? 'splash-lang-visible' : ''}`}>
            <p className="splash-lang-prompt">Choose your language to continue</p>
            <div className="splash-lang-grid">
              {languages.map((lang, i) => (
                <button
                  key={lang.locale}
                  className="splash-lang-btn"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => onLanguageSelect(lang.locale)}
                >
                  <span className="splash-lang-flag">{lang.flag}</span>
                  <span className="splash-lang-native">{lang.native}</span>
                  <span className="splash-lang-name">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
