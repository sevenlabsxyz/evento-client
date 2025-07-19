// Cache for timezone data to avoid repeated fetch calls
let timezoneCache: any[] | null = null;

/**
 * Load timezone data from tz.json file
 */
async function loadTimezoneData(): Promise<any[]> {
  if (timezoneCache) {
    return timezoneCache;
  }

  try {
    const response = await fetch('/assets/tz/tz.json');
    const data = await response.json();
    timezoneCache = data;
    return data;
  } catch (error) {
    console.error('Failed to load timezone data:', error);
    return [];
  }
}

/**
 * Get timezone abbreviation from timezone identifier
 * @param timezone - Timezone identifier (e.g., "America/Los_Angeles")
 * @returns Timezone abbreviation (e.g., "PST") or fallback
 */
export async function getTimezoneAbbreviation(timezone: string): Promise<string> {
  if (!timezone) {
    return '';
  }

  try {
    const timezoneData = await loadTimezoneData();

    // Find timezone entry where utc array contains the timezone
    const entry = timezoneData.find((tz: any) => tz.utc && tz.utc.includes(timezone));

    if (entry && entry.abbr) {
      return entry.abbr;
    }

    // Fallback: extract abbreviation from timezone string
    // e.g., "America/Los_Angeles" -> "PST" (simplified)
    const parts = timezone.split('/');
    if (parts.length >= 2) {
      const location = parts[1].replace(/_/g, ' ');
      // This is a basic fallback - the JSON lookup is preferred
      return location.substring(0, 3).toUpperCase();
    }

    return timezone;
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return timezone;
  }
}

/**
 * Synchronous version using a pre-loaded timezone map for better performance
 * This requires the timezone data to be imported statically
 */
export function getTimezoneAbbreviationSync(timezone: string): string {
  if (!timezone) {
    return '';
  }

  // Basic timezone mapping for common cases (can be expanded)
  const commonTimezones: Record<string, string> = {
    'America/New_York': 'EST',
    'America/Chicago': 'CST',
    'America/Denver': 'MST',
    'America/Los_Angeles': 'PST',
    'America/Phoenix': 'MST',
    'America/Anchorage': 'AKST',
    'Pacific/Honolulu': 'HST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Asia/Tokyo': 'JST',
    'Australia/Sydney': 'AEDT',
  };

  return commonTimezones[timezone] || timezone;
}
