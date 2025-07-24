import { z } from 'zod';

/**
 * Base event schema for form validation
 * Matches the backend API expectations
 */
export const eventFormSchema = z.object({
	// Required fields
	title: z.string().min(1, 'Title is required').max(200),
	description: z.string(),
	location: z.string().min(1, 'Location is required'),
	timezone: z.string().min(1, 'Timezone is required'),

	// Cover image
	cover: z.string().nullable().optional(),

	// Start date fields (individual components)
	start_date_day: z.number().min(1).max(31),
	start_date_month: z.number().min(1).max(12),
	start_date_year: z.number().min(2024).max(2050),
	start_date_hours: z.number().min(0).max(23).nullable().optional(),
	start_date_minutes: z.number().min(0).max(59).nullable().optional(),

	// End date fields (individual components)
	end_date_day: z.number().min(1).max(31),
	end_date_month: z.number().min(1).max(12),
	end_date_year: z.number().min(2024).max(2050),
	end_date_hours: z.number().min(0).max(23).nullable().optional(),
	end_date_minutes: z.number().min(0).max(59).nullable().optional(),

	// Visibility and status
	visibility: z.enum(['public', 'private']).default('private'),
	status: z.enum(['published', 'draft']).default('published'),

	// Social media URLs
	spotify_url: z.string().url().optional().or(z.literal('')),
	wavlake_url: z.string().url().optional().or(z.literal('')),

	// Contribution methods
	contrib_cashapp: z.string().optional(),
	contrib_venmo: z.string().optional(),
	contrib_paypal: z.string().optional(),
	contrib_btclightning: z.string().optional(),

	// Cost
	cost: z.string().optional(),

	// Settings (only for creation)
	settings: z
		.object({
			max_capacity: z.number().positive().optional(),
			show_capacity_count: z.boolean().optional(),
		})
		.optional(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

/**
 * Schema for creating an event (POST)
 * Includes settings object
 */
export const createEventSchema = eventFormSchema;

export type CreateEventData = z.infer<typeof createEventSchema>;

/**
 * Schema for updating an event (PATCH)
 * Includes ID and excludes settings
 */
export const updateEventSchema = eventFormSchema.omit({ settings: true }).extend({
	id: z.string().min(1, 'Event ID is required'),
});

export type UpdateEventData = z.infer<typeof updateEventSchema>;

/**
 * Schema for the event object returned from the API
 */
export const apiEventSchema = z.object({
	id: z.string(),
	created_at: z.string(),
	timezone: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	cover: z.string().nullable(),
	location: z.string(),
	start_date_day: z.number(),
	start_date_month: z.number(),
	start_date_year: z.number(),
	start_date_hours: z.number().nullable(),
	start_date_minutes: z.number().nullable(),
	end_date_day: z.number(),
	end_date_month: z.number(),
	end_date_year: z.number(),
	end_date_hours: z.number().nullable(),
	end_date_minutes: z.number().nullable(),
	status: z.string(),
	visibility: z.string(),
	creator_user_id: z.string(),
	user_details: z
		.object({
			id: z.string(),
			username: z.string(),
			image: z.string().nullable(),
			verification_status: z.string().nullable(),
		})
		.nullable(),
	spotify_url: z.string().nullable(),
	wavlake_url: z.string().nullable(),
	contrib_cashapp: z.string().nullable(),
	contrib_venmo: z.string().nullable(),
	contrib_paypal: z.string().nullable(),
	contrib_btclightning: z.string().nullable(),
	cost: z
		.union([z.string(), z.number()])
		.nullable()
		.transform((val) => (val !== null ? String(val) : null)),
	computed_start_date: z.string(),
	computed_end_date: z.string(),
});

export type ApiEvent = z.infer<typeof apiEventSchema>;
