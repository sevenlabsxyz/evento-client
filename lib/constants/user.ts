export const VERIFICATION_STATUS = {
  VERIFIED: 'verified' as const,
  PENDING: 'pending' as const,
  NONE: null as const,
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];