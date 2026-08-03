import * as RNLocalize from 'react-native-localize';

export type LanguageCode = 'auto' | 'pt-BR' | 'en-US' | 'es-ES';

export interface SystemLocaleInfo {
  languageCode: string;
  languageTag: string;
  countryCode: string;
  source: 'react-native-localize' | 'browser-navigator';
}

/**
 * Gets the current system/device locale information using react-native-localize
 * with browser navigator fallback for web runtime.
 */
export function getDeviceLocale(): SystemLocaleInfo {
  try {
    const locales = RNLocalize.getLocales();
    if (Array.isArray(locales) && locales.length > 0 && locales[0]?.languageTag) {
      return {
        languageCode: locales[0].languageCode || 'pt',
        languageTag: locales[0].languageTag || 'pt-BR',
        countryCode: locales[0].countryCode || 'BR',
        source: 'react-native-localize',
      };
    }
  } catch (err) {
    // react-native-localize native modules may not be available on web
  }

  // Web Navigator fallback
  const navLang = typeof navigator !== 'undefined'
    ? (navigator.language || (navigator.languages && navigator.languages[0]) || 'pt-BR')
    : 'pt-BR';

  const parts = navLang.split('-');
  const langCode = parts[0].toLowerCase();
  const country = parts[1] ? parts[1].toUpperCase() : (langCode === 'pt' ? 'BR' : 'US');

  return {
    languageCode: langCode,
    languageTag: `${langCode}-${country}`,
    countryCode: country,
    source: 'browser-navigator',
  };
}

/**
 * Resolves the active language tag ('pt-BR', 'en-US', 'es-ES') based on user setting or auto detection
 */
export function resolveLanguage(selectedSetting: string): 'pt-BR' | 'en-US' | 'es-ES' {
  if (selectedSetting && selectedSetting !== 'auto') {
    if (selectedSetting === 'en-US' || selectedSetting === 'pt-BR' || selectedSetting === 'es-ES') {
      return selectedSetting;
    }
  }

  // Auto detect via react-native-localize / system locale
  const dev = getDeviceLocale();
  if (dev.languageCode === 'en') return 'en-US';
  if (dev.languageCode === 'es') return 'es-ES';
  return 'pt-BR';
}

/**
 * Friendly label for current language configuration
 */
export function getLanguageLabel(selectedSetting: string): string {
  const active = resolveLanguage(selectedSetting);
  const isAuto = selectedSetting === 'auto' || !selectedSetting;

  let name = 'Português (BR)';
  if (active === 'en-US') name = 'English (US)';
  if (active === 'es-ES') name = 'Español (ES)';

  return isAuto ? `Automático (${name})` : name;
}
