import { z } from 'zod';

// User profile update schema
export const updateUserProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers')
    .optional(),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),

  bio: z.string().max(280, 'Bio must be less than 280 characters').optional(),

  bio_link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),

  x_handle: z.string().max(50, 'X handle must be less than 50 characters').optional(),

  instagram_handle: z
    .string()
    .max(50, 'Instagram handle must be less than 50 characters')
    .optional(),

  ln_address: z.email('Please enter a valid Lightning address').optional(),

  nip05: z.email('Please enter a valid NIP-05 identifier').optional(),

  image: z.url('Please enter a valid image URL').optional().or(z.literal('')),
});

// User search schema
export const userSearchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters'),
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
        error: firstErrorMessage || 'Invalid profile data',
      };
    }
    return { valid: false, error: 'Invalid profile data' };
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
