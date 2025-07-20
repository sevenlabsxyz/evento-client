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

  // Expanded timezone mapping for common cases
  const commonTimezones: Record<string, string> = {
    // US Timezones
    'America/New_York': 'ET',
    'America/Detroit': 'ET',
    'America/Indiana/Indianapolis': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Los_Angeles': 'PT',
    'America/Phoenix': 'MST',
    'America/Anchorage': 'AKST',
    'Pacific/Honolulu': 'HST',

    // International
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Europe/Rome': 'CET',
    'Europe/Madrid': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Shanghai': 'CST',
    'Asia/Kolkata': 'IST',
    'Australia/Sydney': 'AEDT',
    'Australia/Melbourne': 'AEDT',
  };

  return commonTimezones[timezone] || timezone;
}

/**
 * Format timezone for display in UI
 * @param timezone - Timezone identifier (e.g., "America/Los_Angeles")
 * @returns Formatted display string (e.g., "Los Angeles (PST)")
 */
export function formatTimezoneDisplay(timezone: string): string {
  if (!timezone) {
    return '';
  }

  // Handle GMT offset format (e.g., "+8", "-5")
  if (timezone.match(/^[+-]\d+(\.\d+)?$/)) {
    return `GMT${timezone}`;
  }

  try {
    // Extract city name from timezone identifier
    const parts = timezone.split('/');
    let cityName = '';

    if (parts.length >= 2) {
      // Get the last part (city) and format it
      cityName = parts[parts.length - 1]
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Handle camelCase
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } else {
      // Fallback for simple timezone names
      cityName = timezone.replace(/_/g, ' ');
    }

    // Get timezone abbreviation
    const abbreviation = getTimezoneAbbreviationSync(timezone);

    // If abbreviation is different from the original timezone, show it
    if (abbreviation && abbreviation !== timezone && abbreviation.length <= 5) {
      return `${cityName} (${abbreviation})`;
    }

    return cityName;
  } catch (error) {
    console.error('Error formatting timezone display:', error);
    return timezone;
  }
}

/**
 * Format timezone offset with abbreviation for display in timezone picker
 * @param timezoneValue - Timezone identifier (e.g., "America/Los_Angeles")
 * @param gmtOffset - GMT offset string (e.g., "GMT-8")
 * @returns Formatted string (e.g., "GMT-8 (PT)")
 */
export function formatTimezoneOffsetWithAbbreviation(
  timezoneValue: string,
  gmtOffset: string
): string {
  if (!timezoneValue || !gmtOffset) {
    return gmtOffset || '';
  }

  const abbreviation = getTimezoneAbbreviationSync(timezoneValue);

  // If we have a meaningful abbreviation that's different from the timezone value
  if (abbreviation && abbreviation !== timezoneValue && abbreviation.length <= 5) {
    return `${gmtOffset} (${abbreviation})`;
  }

  return gmtOffset;
}

/**
 * Format timezone for display in selected timezone button
 * Shows abbreviation if available, otherwise falls back to GMT offset
 * @param timezone - Timezone identifier (e.g., "America/Los_Angeles") or GMT offset (e.g., "+8")
 * @returns Abbreviated timezone (e.g., "PT") or GMT offset (e.g., "GMT+8")
 */
export function formatSelectedTimezone(timezone: string): string {
  if (!timezone) {
    return '';
  }

  // Handle direct GMT offset format (legacy support)
  if (timezone.match(/^[+-]\d+(\.\d+)?$/)) {
    return `GMT${timezone}`;
  }

  // Get timezone abbreviation
  const abbreviation = getTimezoneAbbreviationSync(timezone);

  // If we have a meaningful abbreviation, use it
  if (abbreviation && abbreviation !== timezone && abbreviation.length <= 5) {
    return abbreviation;
  }

  // Fallback: calculate GMT offset from timezone identifier
  try {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const targetTime = new Date(utc + 0); // UTC time

    // Get offset for the target timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });

    const parts = formatter.formatToParts(targetTime);
    const offsetPart = parts.find((part) => part.type === 'timeZoneName');

    if (offsetPart && offsetPart.value !== timezone) {
      // Convert from "GMT+10:00" format to "GMT+10"
      const match = offsetPart.value.match(/GMT([+-]\d{1,2}):?(\d{2})?/);
      if (match) {
        const hours = match[1];
        const minutes = match[2];
        if (minutes && minutes !== '00') {
          return `GMT${hours}:${minutes}`;
        } else {
          return `GMT${hours}`;
        }
      }
      return offsetPart.value;
    }
  } catch (error) {
    console.error('Error calculating timezone offset:', error);
  }

  // Final fallback: return the abbreviation or a cleaned up timezone name
  return abbreviation || timezone;
}
