/**
 * Detect country code from browser locale.
 */
const LOCALE_MAP = {
  'en-in': 'IN',
  'en-gb': 'GB',
  'en-au': 'AU',
  'ar': 'AE',
};

export function detectCountryCode() {
  const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  // Check full locale first (e.g. en-in), then language prefix (e.g. ar)
  for (const [prefix, code] of Object.entries(LOCALE_MAP)) {
    if (lang.startsWith(prefix)) return code;
  }
  return 'US';
}
