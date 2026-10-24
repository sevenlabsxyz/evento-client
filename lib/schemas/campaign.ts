import { validationMessage } from '@/lib/schemas/validation-message';
import { z } from 'zod';

/**
 * Schema for the crowdfunding campaign settings form.
 * Used by the event manage crowdfunding page for create/update flows.
 */
export const campaignFormSchema = z.object({
  title: z
    .string()
    .min(1, validationMessage('validation.titleRequired'))
    .max(200, validationMessage('validation.titleTooLong')),
  description: z.string().optional(),
  goal_sats: z
    .number()
    .int(validationMessage('validation.goalWholeNumber'))
    .positive(validationMessage('validation.goalPositive'))
    .optional()
    .nullable(),
  visibility: z.enum(['public', 'private']),
  status: z.enum(['active', 'paused']),
});

export type CampaignFormData = z.infer<typeof campaignFormSchema>;
