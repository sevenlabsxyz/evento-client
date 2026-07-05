import { logger } from '@/lib/utils/logger';

export type FundingCountry = 'US' | 'non-US' | 'unknown';
export type FundingConfidence = 'high' | 'medium' | 'low';

export interface FundingRegion {
  country: FundingCountry;
  countryCode: string | null;
  confidence: FundingConfidence;
  signals: string[];
}

interface GeoResponse {
  country?: string | null;
}

const US_TIME_ZONES = new Set([
  'America/Adak',
  'America/Anchorage',
  'America/Boise',
  'America/Chicago',
  'America/Denver',
  'America/Detroit',
  'America/Indiana/Indianapolis',
  'America/Indiana/Knox',
  'America/Indiana/Marengo',
  'America/Indiana/Petersburg',
  'America/Indiana/Tell_City',
  'America/Indiana/Vevay',
  'America/Indiana/Vincennes',
  'America/Indiana/Winamac',
  'America/Juneau',
  'America/Kentucky/Louisville',
  'America/Kentucky/Monticello',
  'America/Los_Angeles',
  'America/Metlakatla',
  'America/New_York',
  'America/Nome',
  'America/North_Dakota/Beulah',
  'America/North_Dakota/Center',
  'America/North_Dakota/New_Salem',
  'America/Phoenix',
  'America/Sitka',
  'America/Yakutat',
  'Pacific/Honolulu',
]);

const US_COMPATIBLE_UTC_OFFSETS = new Set([240, 300, 360, 420, 480, 540, 600]);

function normalizeCountryCode(countryCode: string | null | undefined): string | null {
  if (!countryCode) {
    return null;
  }

  const normalized = countryCode.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function getLocaleRegion(locale: string): string | null {
  const normalizedLocale = locale.replace('_', '-');

  try {
    const region = new Intl.Locale(normalizedLocale).region;
    return normalizeCountryCode(region);
  } catch {
    const parts = normalizedLocale.split('-');
    return normalizeCountryCode(parts.length > 1 ? parts[parts.length - 1] : null);
  }
}

async function getServerCountry(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const response = await fetch('/api/geo', { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GeoResponse;
    return normalizeCountryCode(data.country);
  } catch (error) {
    logger.warn('Failed to detect funding country from server geo', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function getBrowserSignals(): {
  localeCountry: string | null;
  signals: string[];
  timezoneIsUs: boolean;
  utcOffsetIsUsCompatible: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      localeCountry: null,
      signals: [],
      timezoneIsUs: false,
      utcOffsetIsUsCompatible: false,
    };
  }

  const signals: string[] = [];
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneIsUs = US_TIME_ZONES.has(timeZone);

  if (timeZone) {
    signals.push(`timezone:${timeZone}`);
  }

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const localeCountry =
    languages.map((language) => getLocaleRegion(language)).find((country) => !!country) ?? null;

  if (localeCountry) {
    signals.push(`locale-region:${localeCountry}`);
  }

  const utcOffsetMinutes = new Date().getTimezoneOffset();
  const utcOffsetIsUsCompatible = US_COMPATIBLE_UTC_OFFSETS.has(utcOffsetMinutes);
  signals.push(`utc-offset-minutes:${utcOffsetMinutes}`);

  return {
    localeCountry,
    signals,
    timezoneIsUs,
    utcOffsetIsUsCompatible,
  };
}

export async function detectFundingRegion(): Promise<FundingRegion> {
  const serverCountry = await getServerCountry();
  const browserSignals = getBrowserSignals();
  const signals = [...browserSignals.signals];

  if (serverCountry) {
    signals.unshift(`server-country:${serverCountry}`);

    if (serverCountry === 'US') {
      return {
        country: 'US',
        countryCode: 'US',
        confidence: 'high',
        signals,
      };
    }

    return {
      country: 'non-US',
      countryCode: serverCountry,
      confidence: 'medium',
      signals,
    };
  }

  if (browserSignals.timezoneIsUs) {
    return {
      country: 'US',
      countryCode: 'US',
      confidence: 'high',
      signals,
    };
  }

  if (browserSignals.localeCountry === 'US' && browserSignals.utcOffsetIsUsCompatible) {
    return {
      country: 'US',
      countryCode: 'US',
      confidence: 'high',
      signals,
    };
  }

  if (browserSignals.localeCountry && browserSignals.localeCountry !== 'US') {
    return {
      country: 'non-US',
      countryCode: browserSignals.localeCountry,
      confidence: 'medium',
      signals,
    };
  }

  return {
    country: 'unknown',
    countryCode: null,
    confidence: 'low',
    signals,
  };
}

export function isCashAppFundingRegion(region: FundingRegion | null): boolean {
  return region?.country === 'US' && region.confidence === 'high';
}
