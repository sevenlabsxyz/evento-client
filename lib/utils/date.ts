import { getTimezoneAbbreviationSync } from './timezone';

/**
 * Format ISO date string to display format
 * @param isoString - ISO date string (e.g., "2025-09-20T19:00:00.000Z")
 * @param timezone - Optional timezone identifier (e.g., "America/Los_Angeles")
 * @returns Formatted date object with date and time strings
 */
export function formatEventDate(isoString: string, timezone?: string) {
	if (!isoString) {
		return {
			date: '',
			time: '',
			timeWithTz: '',
			dayOfWeek: '',
			shortDate: '',
		};
	}

	const date = new Date(isoString);

	// Format date as "Sep 20, 2025"
	const formattedDate = date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	// Format time as "7:00 PM"
	const formattedTime = date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});

	// Format time with timezone if provided
	let timeWithTz = formattedTime;
	if (timezone) {
		const tzAbbr = getTimezoneAbbreviationSync(timezone);
		timeWithTz = `${formattedTime} ${tzAbbr}`;
	}

	// Day of week
	const dayOfWeek = date.toLocaleDateString('en-US', {
		weekday: 'short',
	});

	// Short date format "Sep 20"
	const shortDate = date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});

	return {
		date: formattedDate,
		time: formattedTime,
		timeWithTz,
		dayOfWeek,
		shortDate,
	};
}

/**
 * Get relative time string (e.g., "2h ago", "1d ago")
 */
export function getRelativeTime(isoString: string): string {
	if (!isoString) return '';

	const now = new Date();
	const date = new Date(isoString);
	const diffMs = now.getTime() - date.getTime();

	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`;
	} else if (diffHours < 24) {
		return `${diffHours}h ago`;
	} else {
		return `${diffDays}d ago`;
	}
}
