import { z } from 'zod';

// Login form schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
});

// TOTP verification form schema
export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers'),
});

// Combined login and verify schema (for multi-step form)
export const authSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers')
    .optional(),
});

// User profile update schema (for future use)
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .optional(),
  bio: z.string().max(280, 'Bio must be less than 280 characters').optional(),
  bio_link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  x_handle: z.string().max(50, 'X handle must be less than 50 characters').optional(),
  instagram_handle: z
    .string()
    .max(50, 'Instagram handle must be less than 50 characters')
    .optional(),
  ln_address: z
    .string()
    .email('Lightning address must be a valid email format')
    .optional()
    .or(z.literal('')),
  nip05: z
    .string()
    .email('NIP-05 identifier must be a valid email format')
    .optional()
    .or(z.literal('')),
});

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// Common validation messages
export const validationMessages = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
    tooLong: 'Email must be less than 100 characters',
  },
  code: {
    required: 'Verification code is required',
    invalid: 'Code must be exactly 6 digits',
    numbersOnly: 'Code must contain only numbers',
  },
  username: {
    required: 'Username is required',
    tooShort: 'Username must be at least 3 characters',
    tooLong: 'Username must be less than 20 characters',
    invalid: 'Username can only contain letters, numbers, and underscores',
  },
  name: {
    required: 'Name is required',
    tooLong: 'Name must be less than 50 characters',
  },
  bio: {
    tooLong: 'Bio must be less than 280 characters',
  },
  bioLink: {
    invalid: 'Please enter a valid URL',
  },
  lightningAddress: {
    invalid: 'Lightning address must be a valid email format',
  },
  nip05: {
    invalid: 'NIP-05 identifier must be a valid email format',
  },
} as const;
