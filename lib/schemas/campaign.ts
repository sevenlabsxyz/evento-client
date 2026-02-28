import { z } from 'zod';

/**
 * Schema for the crowdfunding campaign settings form.
 * Used by the event manage crowdfunding page for create/update flows.
 */
export const campaignFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  description: z.string().optional(),
  goal_sats: z
    .number()
    .int('Goal must be a whole number')
    .positive('Goal must be a positive number')
    .optional()
    .nullable(),
  visibility: z.enum(['public', 'private']).default('public'),
});

export type CampaignFormData = z.infer<typeof campaignFormSchema>;
