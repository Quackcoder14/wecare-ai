import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { getLocaleName } from '../../i18n/context';

export function LanguageSelector() {
  const { locale, setLocale, availableLocales, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current?.contains(event.target as Node)) return;
      if (menuRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center gap-2 px-3 py-1.5"
        aria-label={t('a11y.selectLanguage')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="language-menu"
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{getLocaleName(locale)}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id="language-menu"
          role="listbox"
          aria-label={t('a11y.selectLanguage')}
          className="absolute right-0 mt-1 w-40 bg-surface border border-border rounded-lg shadow-lg py-1 z-40 animate-fade-in"
        >
          {availableLocales.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={locale === loc}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                locale === loc
                  ? 'bg-pale-blue text-teal'
                  : 'text-charcoal hover:bg-pale-blue'
              }`}
            >
              {locale === loc && <Check className="w-4 h-4 text-teal flex-shrink-0" aria-hidden="true" />}
              <span className="flex-1 truncate">{getLocaleName(loc)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}