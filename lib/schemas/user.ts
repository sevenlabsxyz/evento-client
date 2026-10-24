import { translateHooks } from '@/lib/i18n/active-translator';
import { validationMessage } from '@/lib/schemas/validation-message';
import { z } from 'zod';

// User profile update schema
export const updateUserProfileSchema = z.object({
  username: z
    .string()
    .min(3, validationMessage('username.tooShort'))
    .max(20, validationMessage('username.tooLong'))
    .regex(/^[a-zA-Z0-9]+$/, validationMessage('validation.usernameAlphanumeric'))
    .optional(),

  name: z
    .string()
    .min(1, validationMessage('validation.nameRequired'))
    .max(100, validationMessage('validation.nameTooLong100'))
    .optional(),

  bio: z.string().max(280, validationMessage('validation.bioTooLong')).optional(),

  bio_link: z
    .string()
    .regex(/^https?:\/\/.+/, validationMessage('validation.httpUrlInvalid'))
    .optional()
    .or(z.literal('')),

  x_handle: z.string().max(50, validationMessage('validation.xHandleTooLong')).optional(),

  instagram_handle: z
    .string()
    .max(50, validationMessage('validation.instagramHandleTooLong'))
    .optional(),

  ln_address: z.email(validationMessage('validation.lightningAddressInvalid')).optional(),

  nip05: z.email(validationMessage('validation.nip05Invalid')).optional(),

  image: z.url(validationMessage('validation.imageUrlInvalid')).optional().or(z.literal('')),
});

// User search schema
export const userSearchSchema = z.object({
  q: z
    .string()
    .min(1, validationMessage('validation.searchRequired'))
    .max(100, validationMessage('validation.searchTooLong')),
});

// Follow user schema
export const followUserSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  action: z.enum(['follow', 'unfollow'], {
    error: 'Action must be either "follow" or "unfollow"',
  }),
});

// User details response schema (for validation)
export const userDetailsSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  bio: z.string(),
  image: z.string(),
  bio_link: z.string(),
  x_handle: z.string(),
  instagram_handle: z.string(),
  ln_address: z.string(),
  nip05: z.string(),
  verification_status: z.enum(['verified', 'pending']).nullable(),
  verification_date: z.string(),
});

// Type exports
export type UpdateUserProfileData = z.infer<typeof updateUserProfileSchema>;
export type UserSearchData = z.infer<typeof userSearchSchema>;
export type FollowUserData = z.infer<typeof followUserSchema>;
export type UserDetailsData = z.infer<typeof userDetailsSchema>;

// Validation helper functions
/**
 * Validates profile data and returns an error message if invalid
 */
export function validateUpdateUserProfile(data: Record<string, any>): {
  valid: boolean;
  error?: string;
} {
  try {
    updateUserProfileSchema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return the first error message
      const formattedError = z.treeifyError(error);
      // Get the first error message from the formatted error
      const firstErrorPath = Object.keys(formattedError)[0];
      const firstErrorMessage = firstErrorPath && formattedError.errors[0];
      return {
        valid: false,
        error: firstErrorMessage || translateHooks('validation.profileInvalid'),
      };
    }
    return { valid: false, error: translateHooks('validation.profileInvalid') };
  }
}
export const validateUserSearch = (data: unknown): UserSearchData => {
  return userSearchSchema.parse(data);
};

export const validateFollowUser = (data: unknown): FollowUserData => {
  return followUserSchema.parse(data);
};

export const validateUserDetails = (data: unknown): UserDetailsData => {
  return userDetailsSchema.parse(data);
};

// Form validation with safe parsing
export const safeValidateUserProfile = (data: unknown) => {
  return updateUserProfileSchema.safeParse(data);
};

export const safeValidateUserSearch = (data: unknown) => {
  return userSearchSchema.safeParse(data);
};

export const safeValidateFollowUser = (data: unknown) => {
  return followUserSchema.safeParse(data);
};

export const safeValidateUserDetails = (data: unknown) => {
  return userDetailsSchema.safeParse(data);
};
