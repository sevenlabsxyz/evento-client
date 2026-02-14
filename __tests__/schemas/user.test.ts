import {
  followUserSchema,
  safeValidateFollowUser,
  safeValidateUserDetails,
  safeValidateUserProfile,
  safeValidateUserSearch,
  updateUserProfileSchema,
  userDetailsSchema,
  userSearchSchema,
  validateFollowUser,
  validateUpdateUserProfile,
  validateUserDetails,
  validateUserSearch,
} from '@/lib/schemas/user';

describe('User Schemas', () => {
  describe('updateUserProfileSchema', () => {
    it('validates complete valid profile data', () => {
      const validData = {
        username: 'testuser123',
        name: 'Test User',
        bio: 'This is my bio',
        bio_link: 'https://example.com',
        x_handle: 'testuser',
        instagram_handle: 'testuser',
        ln_address: 'test@getalby.com',
        nip05: 'test@nostr.com',
        image: 'https://example.com/avatar.jpg',
      };

      const result = updateUserProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates partial profile updates', () => {
      const partialData = {
        name: 'Updated Name',
      };

      const result = updateUserProfileSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('validates empty object', () => {
      const result = updateUserProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    describe('username validation', () => {
      it('accepts valid username', () => {
        const data = { username: 'validUser123' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects username shorter than 3 characters', () => {
        const data = { username: 'ab' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3 characters');
        }
      });

      it('rejects username longer than 20 characters', () => {
        const data = { username: 'a'.repeat(21) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 20 characters');
        }
      });

      it('accepts username at minimum length boundary', () => {
        const data = { username: 'abc' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts username at maximum length boundary', () => {
        const data = { username: 'a'.repeat(20) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects username with special characters', () => {
        const data = { username: 'user@name' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('letters and numbers');
        }
      });

      it('rejects username with spaces', () => {
        const data = { username: 'user name' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('rejects username with underscores', () => {
        const data = { username: 'user_name' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('accepts username with only letters', () => {
        const data = { username: 'username' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts username with only numbers', () => {
        const data = { username: '123456' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts username with mixed case', () => {
        const data = { username: 'UserName123' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('name validation', () => {
      it('accepts valid name', () => {
        const data = { name: 'John Doe' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects empty name', () => {
        const data = { name: '' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Name is required');
        }
      });

      it('rejects name longer than 100 characters', () => {
        const data = { name: 'a'.repeat(101) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 100 characters');
        }
      });

      it('accepts name at maximum length boundary', () => {
        const data = { name: 'a'.repeat(100) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts name with special characters', () => {
        const data = { name: "O'Brien-Smith Jr." };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('bio validation', () => {
      it('accepts valid bio', () => {
        const data = { bio: 'This is my bio' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts empty bio', () => {
        const data = { bio: '' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects bio longer than 280 characters', () => {
        const data = { bio: 'a'.repeat(281) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 280 characters');
        }
      });

      it('accepts bio at maximum length boundary', () => {
        const data = { bio: 'a'.repeat(280) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('bio_link validation', () => {
      it('accepts valid URL', () => {
        const data = { bio_link: 'https://example.com' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts empty string', () => {
        const data = { bio_link: '' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects invalid URL', () => {
        const data = { bio_link: 'not-a-url' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('accepts URL with path', () => {
        const data = { bio_link: 'https://example.com/path/to/page' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts URL with query parameters', () => {
        const data = { bio_link: 'https://example.com?param=value' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('social handle validation', () => {
      it('accepts valid x_handle', () => {
        const data = { x_handle: 'testuser' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts valid instagram_handle', () => {
        const data = { instagram_handle: 'testuser' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects x_handle longer than 50 characters', () => {
        const data = { x_handle: 'a'.repeat(51) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 50 characters');
        }
      });

      it('rejects instagram_handle longer than 50 characters', () => {
        const data = { instagram_handle: 'a'.repeat(51) };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 50 characters');
        }
      });

      it('accepts handles at maximum length boundary', () => {
        const xData = { x_handle: 'a'.repeat(50) };
        expect(updateUserProfileSchema.safeParse(xData).success).toBe(true);

        const igData = { instagram_handle: 'a'.repeat(50) };
        expect(updateUserProfileSchema.safeParse(igData).success).toBe(true);
      });

      it('accepts empty social handles', () => {
        const data = { x_handle: '', instagram_handle: '' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('ln_address validation', () => {
      it('accepts valid Lightning address', () => {
        const data = { ln_address: 'user@getalby.com' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects invalid Lightning address format', () => {
        const data = { ln_address: 'not-an-email' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Lightning address');
        }
      });

      it('accepts Lightning address with subdomain', () => {
        const data = { ln_address: 'user@wallet.example.com' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('nip05 validation', () => {
      it('accepts valid NIP-05 identifier', () => {
        const data = { nip05: 'user@nostr.com' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects invalid NIP-05 format', () => {
        const data = { nip05: 'not-an-email' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('NIP-05');
        }
      });

      it('accepts NIP-05 with subdomain', () => {
        const data = { nip05: 'user@relay.nostr.com' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('image validation', () => {
      it('accepts valid image URL', () => {
        const data = { image: 'https://example.com/avatar.jpg' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts empty string', () => {
        const data = { image: '' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects invalid image URL', () => {
        const data = { image: 'not-a-url' };
        const result = updateUserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('userSearchSchema', () => {
    it('validates valid search query', () => {
      const data = { q: 'test' };
      const result = userSearchSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects empty search query', () => {
      const data = { q: '' };
      const result = userSearchSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Search query is required');
      }
    });

    it('rejects search query longer than 100 characters', () => {
      const data = { q: 'a'.repeat(101) };
      const result = userSearchSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 100 characters');
      }
    });

    it('accepts search query at minimum length boundary', () => {
      const data = { q: 'a' };
      const result = userSearchSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts search query at maximum length boundary', () => {
      const data = { q: 'a'.repeat(100) };
      const result = userSearchSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts search query with special characters', () => {
      const data = { q: 'test@user.com' };
      const result = userSearchSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing query field', () => {
      const result = userSearchSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('followUserSchema', () => {
    it('validates follow action', () => {
      const data = { user_id: 'usr_123', action: 'follow' as const };
      const result = followUserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates unfollow action', () => {
      const data = { user_id: 'usr_123', action: 'unfollow' as const };
      const result = followUserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid action', () => {
      const data = { user_id: 'usr_123', action: 'invalid' };
      const result = followUserSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('follow');
      }
    });

    it('rejects empty user_id', () => {
      const data = { user_id: '', action: 'follow' as const };
      const result = followUserSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('User ID is required');
      }
    });

    it('rejects missing user_id', () => {
      const data = { action: 'follow' as const };
      const result = followUserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing action', () => {
      const data = { user_id: 'usr_123' };
      const result = followUserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('userDetailsSchema', () => {
    const validUserDetails = {
      id: 'usr_123',
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      bio_link: 'https://example.com',
      x_handle: 'testuser',
      instagram_handle: 'testuser',
      ln_address: 'test@getalby.com',
      nip05: 'test@nostr.com',
      verification_status: 'verified' as const,
      verification_date: '2025-01-01T00:00:00Z',
    };

    it('validates complete user details', () => {
      const result = userDetailsSchema.safeParse(validUserDetails);
      expect(result.success).toBe(true);
    });

    it('accepts null verification_status', () => {
      const data = { ...validUserDetails, verification_status: null };
      const result = userDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts pending verification_status', () => {
      const data = { ...validUserDetails, verification_status: 'pending' as const };
      const result = userDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid verification_status', () => {
      const data = { ...validUserDetails, verification_status: 'invalid' };
      const result = userDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const { id, ...dataWithoutId } = validUserDetails;
      const result = userDetailsSchema.safeParse(dataWithoutId);
      expect(result.success).toBe(false);
    });
  });

  describe('validation helper functions', () => {
    describe('validateUpdateUserProfile', () => {
      it('returns valid for correct data', () => {
        const data = { username: 'testuser', name: 'Test User' };
        const result = validateUpdateUserProfile(data);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('returns error for invalid data', () => {
        const data = { username: 'ab' };
        const result = validateUpdateUserProfile(data);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('validateUserSearch', () => {
      it('validates and returns parsed data', () => {
        const data = { q: 'test' };
        const result = validateUserSearch(data);
        expect(result.q).toBe('test');
      });

      it('throws error for invalid data', () => {
        const data = { q: '' };
        expect(() => validateUserSearch(data)).toThrow();
      });
    });

    describe('validateFollowUser', () => {
      it('validates and returns parsed data', () => {
        const data = { user_id: 'usr_123', action: 'follow' as const };
        const result = validateFollowUser(data);
        expect(result.user_id).toBe('usr_123');
        expect(result.action).toBe('follow');
      });

      it('throws error for invalid data', () => {
        const data = { user_id: '', action: 'follow' as const };
        expect(() => validateFollowUser(data)).toThrow();
      });
    });

    describe('validateUserDetails', () => {
      it('validates and returns parsed data', () => {
        const data = {
          id: 'usr_123',
          username: 'testuser',
          name: 'Test User',
          bio: 'Test bio',
          image: 'https://example.com/avatar.jpg',
          bio_link: 'https://example.com',
          x_handle: 'testuser',
          instagram_handle: 'testuser',
          ln_address: 'test@getalby.com',
          nip05: 'test@nostr.com',
          verification_status: 'verified' as const,
          verification_date: '2025-01-01T00:00:00Z',
        };
        const result = validateUserDetails(data);
        expect(result.id).toBe('usr_123');
      });

      it('throws error for invalid data', () => {
        const data = { id: 'usr_123' };
        expect(() => validateUserDetails(data)).toThrow();
      });
    });

    describe('safe validation functions', () => {
      it('safeValidateUserProfile returns success result', () => {
        const data = { username: 'testuser' };
        const result = safeValidateUserProfile(data);
        expect(result.success).toBe(true);
      });

      it('safeValidateUserProfile returns error result', () => {
        const data = { username: 'ab' };
        const result = safeValidateUserProfile(data);
        expect(result.success).toBe(false);
      });

      it('safeValidateUserSearch returns success result', () => {
        const data = { q: 'test' };
        const result = safeValidateUserSearch(data);
        expect(result.success).toBe(true);
      });

      it('safeValidateUserSearch returns error result', () => {
        const data = { q: '' };
        const result = safeValidateUserSearch(data);
        expect(result.success).toBe(false);
      });

      it('safeValidateFollowUser returns success result', () => {
        const data = { user_id: 'usr_123', action: 'follow' as const };
        const result = safeValidateFollowUser(data);
        expect(result.success).toBe(true);
      });

      it('safeValidateFollowUser returns error result', () => {
        const data = { user_id: '', action: 'follow' as const };
        const result = safeValidateFollowUser(data);
        expect(result.success).toBe(false);
      });

      it('safeValidateUserDetails returns success result', () => {
        const data = {
          id: 'usr_123',
          username: 'testuser',
          name: 'Test User',
          bio: 'Test bio',
          image: 'https://example.com/avatar.jpg',
          bio_link: 'https://example.com',
          x_handle: 'testuser',
          instagram_handle: 'testuser',
          ln_address: 'test@getalby.com',
          nip05: 'test@nostr.com',
          verification_status: 'verified' as const,
          verification_date: '2025-01-01T00:00:00Z',
        };
        const result = safeValidateUserDetails(data);
        expect(result.success).toBe(true);
      });

      it('safeValidateUserDetails returns error result', () => {
        const data = { id: 'usr_123' };
        const result = safeValidateUserDetails(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
