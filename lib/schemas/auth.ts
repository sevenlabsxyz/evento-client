import { translateHooks } from '@/lib/i18n/active-translator';
import { validationMessage } from '@/lib/schemas/validation-message';
import { z } from 'zod';

// Login form schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, validationMessage('validation.emailRequired'))
    .email(validationMessage('validation.emailInvalid'))
    .max(100, validationMessage('validation.emailTooLong')),
});

// TOTP verification form schema
export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, validationMessage('validation.codeLength'))
    .regex(/^\d{6}$/, validationMessage('validation.codeNumbersOnly')),
});

// Combined login and verify schema (for multi-step form)
export const authSchema = z.object({
  email: z
    .string()
    .min(1, validationMessage('validation.emailRequired'))
    .email(validationMessage('validation.emailInvalid'))
    .max(100, validationMessage('validation.emailTooLong')),
  code: z
    .string()
    .length(6, validationMessage('validation.codeLength'))
    .regex(/^\d{6}$/, validationMessage('validation.codeNumbersOnly'))
    .optional(),
});

// User profile update schema (for future use)
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, validationMessage('username.tooShort'))
    .max(20, validationMessage('username.tooLong'))
    .regex(/^[a-zA-Z0-9_]+$/, validationMessage('username.invalidChars'))
    .optional(),
  name: z
    .string()
    .min(1, validationMessage('validation.nameRequired'))
    .max(50, validationMessage('validation.nameTooLong50'))
    .optional(),
  bio: z.string().max(280, validationMessage('validation.bioTooLong')).optional(),
  bio_link: z.string().url(validationMessage('validation.urlInvalid')).optional().or(z.literal('')),
  x_handle: z.string().max(50, validationMessage('validation.xHandleTooLong')).optional(),
  instagram_handle: z
    .string()
    .max(50, validationMessage('validation.instagramHandleTooLong'))
    .optional(),
  ln_address: z
    .string()
    .email(validationMessage('validation.lightningAddressEmailFormat'))
    .optional()
    .or(z.literal('')),
  nip05: z
    .string()
    .email(validationMessage('validation.nip05EmailFormat'))
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
    get required() {
      return translateHooks('validation.emailRequired');
    },
    get invalid() {
      return translateHooks('validation.emailInvalid');
    },
    get tooLong() {
      return translateHooks('validation.emailTooLong');
    },
  },
  code: {
    get required() {
      return translateHooks('validation.codeRequired');
    },
    get invalid() {
      return translateHooks('validation.codeLength');
    },
    get numbersOnly() {
      return translateHooks('validation.codeNumbersOnly');
    },
  },
  username: {
    get required() {
      return translateHooks('validation.usernameRequired');
    },
    get tooShort() {
      return translateHooks('username.tooShort');
    },
    get tooLong() {
      return translateHooks('username.tooLong');
    },
    get invalid() {
      return translateHooks('username.invalidChars');
    },
  },
  name: {
    get required() {
      return translateHooks('validation.nameRequired');
    },
    get tooLong() {
      return translateHooks('validation.nameTooLong50');
    },
  },
  bio: {
    get tooLong() {
      return translateHooks('validation.bioTooLong');
    },
  },
  bioLink: {
    get invalid() {
      return translateHooks('validation.urlInvalid');
    },
  },
  lightningAddress: {
    get invalid() {
      return translateHooks('validation.lightningAddressEmailFormat');
    },
  },
  nip05: {
    get invalid() {
      return translateHooks('validation.nip05EmailFormat');
    },
  },
} as const;
