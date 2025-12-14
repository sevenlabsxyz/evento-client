/**
 * Detect user's country code using various methods
 * Priority: Vercel headers > Browser locale > Default
 */

export type CountryCode = string; // ISO 3166-1 alpha-2 code (e.g., 'US', 'GB', 'BR')

/**
 * Get country from Vercel geo headers
 * This should be called from an API route to access headers
 */
export async function getCountryFromVercel(): Promise<CountryCode | null> {
  try {
    const response = await fetch('/api/geo');
    if (response.ok) {
      const data = await response.json();
      return data.country || null;
    }
  } catch (error) {
    console.error('Failed to fetch country from Vercel:', error);
  }
  return null;
}

/**
 * Get country from browser locale
 * Falls back to extracting region from language tag (e.g., 'en-US' -> 'US')
 */
export function getCountryFromBrowser(): CountryCode | null {
  try {
    // Try to get from Intl API (more reliable for region)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Map common timezones to countries (simplified)
    const timezoneCountryMap: Record<string, CountryCode> = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Sao_Paulo': 'BR',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Australia/Sydney': 'AU',
    };

    if (timeZone && timezoneCountryMap[timeZone]) {
      return timezoneCountryMap[timeZone];
    }

    // Fallback: extract from navigator.language
    const locale = navigator.language || '';
    const parts = locale.split('-');
    if (parts.length > 1) {
      return parts[1].toUpperCase();
    }
  } catch (error) {
    console.error('Failed to detect country from browser:', error);
  }
  return null;
}

/**
 * Detect user's country with fallback chain
 */
export async function detectUserCountry(): Promise<CountryCode> {
  // Try Vercel geo headers first
  const vercelCountry = await getCountryFromVercel();
  if (vercelCountry) {
    return vercelCountry;
  }

  // Fallback to browser detection
  const browserCountry = getCountryFromBrowser();
  if (browserCountry) {
    return browserCountry;
  }

  // Default fallback
  return 'US';
}
