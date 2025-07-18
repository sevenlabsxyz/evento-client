import { UserDetails } from '../types/api';

/**
 * Determines if a user needs to complete onboarding
 * A user needs onboarding if they're missing essential profile information
 */
export function userNeedsOnboarding(user: UserDetails | null): boolean {
  if (!user) return false;

  // Check if user has essential profile information
  const hasBasicInfo = !!(user.name && user.username);
  
  // If they don't have basic info, they need onboarding
  if (!hasBasicInfo) return true;

  // Check if this is a very new user (created within last 24 hours)
  // If they have basic info but are very new, they might still benefit from onboarding
  // This is optional - you can remove this check if you prefer
  const userCreatedAt = new Date(user.verification_date || Date.now());
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const isVeryNewUser = userCreatedAt > dayAgo;

  // For very new users, check if they have additional profile details
  // If they only have basic info and are new, suggest onboarding
  if (isVeryNewUser) {
    const hasAdditionalInfo = !!(
      user.bio || 
      user.image || 
      user.bio_link || 
      user.x_handle || 
      user.instagram_handle ||
      user.ln_address ||
      user.nip05
    );
    
    // If they're new and don't have additional info, suggest onboarding
    return !hasAdditionalInfo;
  }

  // Existing users with basic info don't need onboarding
  return false;
}

/**
 * Gets the appropriate redirect URL after authentication
 */
export function getPostAuthRedirectUrl(user: UserDetails | null): string {
  if (userNeedsOnboarding(user)) {
    return '/onboarding';
  }
  return '/';
}