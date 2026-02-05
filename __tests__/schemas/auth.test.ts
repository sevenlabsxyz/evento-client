import {
  loginSchema,
  verifyCodeSchema,
  authSchema,
  updateProfileSchema,
  validationMessages,
} from '@/lib/schemas/auth';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('validates valid email', () => {
      const data = { email: 'test@example.com' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects empty email', () => {
      const data = { email: '' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email is required');
      }
    });

    it('rejects invalid email format', () => {
      const data = { email: 'not-an-email' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('rejects email without domain', () => {
      const data = { email: 'test@' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects email without @', () => {
      const data = { email: 'testexample.com' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects email longer than 100 characters', () => {
      const longEmail = `${'a'.repeat(90)}@example.com`;
      const data = { email: longEmail };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 100 characters');
      }
    });

    it('accepts email at maximum length boundary', () => {
      const maxEmail = `${'a'.repeat(87)}@example.com`;
      const data = { email: maxEmail };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts email with subdomain', () => {
      const data = { email: 'test@mail.example.com' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts email with plus addressing', () => {
      const data = { email: 'test+tag@example.com' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts email with dots in local part', () => {
      const data = { email: 'test.user@example.com' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts email with numbers', () => {
      const data = { email: 'test123@example.com' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing email field', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('verifyCodeSchema', () => {
    it('validates valid 6-digit code', () => {
      const data = { code: '123456' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects code shorter than 6 digits', () => {
      const data = { code: '12345' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 digits');
      }
    });

    it('rejects code longer than 6 digits', () => {
      const data = { code: '1234567' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 digits');
      }
    });

    it('rejects code with letters', () => {
      const data = { code: '12345a' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('only numbers');
      }
    });

    it('rejects code with special characters', () => {
      const data = { code: '12345!' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects code with spaces', () => {
      const data = { code: '123 456' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects empty code', () => {
      const data = { code: '' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts code with all zeros', () => {
      const data = { code: '000000' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts code with all nines', () => {
      const data = { code: '999999' };
      const result = verifyCodeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing code field', () => {
      const result = verifyCodeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('authSchema', () => {
    it('validates email and code together', () => {
      const data = { email: 'test@example.com', code: '123456' };
      const result = authSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates email without code', () => {
      const data = { email: 'test@example.com' };
      const result = authSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const data = { email: 'not-an-email', code: '123456' };
      const result = authSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid code', () => {
      const data = { email: 'test@example.com', code: '12345' };
      const result = authSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts undefined code', () => {
      const data = { email: 'test@example.com', code: undefined };
      const result = authSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateProfileSchema', () => {
    it('validates complete profile data', () => {
      const data = {
        username: 'testuser123',
        name: 'Test User',
        bio: 'This is my bio',
        bio_link: 'https://example.com',
        x_handle: 'testuser',
        instagram_handle: 'testuser',
        ln_address: 'test@getalby.com',
        nip05: 'test@nostr.com',
      };
      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates partial profile data', () => {
      const data = { name: 'Test User' };
      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates empty object', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    describe('username validation', () => {
      it('accepts valid username', () => {
        const data = { username: 'test_user123' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects username shorter than 3 characters', () => {
        const data = { username: 'ab' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3 characters');
        }
      });

      it('rejects username longer than 20 characters', () => {
        const data = { username: 'a'.repeat(21) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 20 characters');
        }
      });

      it('accepts username at minimum length boundary', () => {
        const data = { username: 'abc' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts username at maximum length boundary', () => {
        const data = { username: 'a'.repeat(20) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts username with underscores', () => {
        const data = { username: 'test_user' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects username with special characters', () => {
        const data = { username: 'test@user' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('letters, numbers, and underscores');
        }
      });

      it('rejects username with spaces', () => {
        const data = { username: 'test user' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('rejects username with hyphens', () => {
        const data = { username: 'test-user' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('accepts username with only letters', () => {
        const data = { username: 'testuser' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts username with only numbers', () => {
        const data = { username: '123456' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts username with mixed case', () => {
        const data = { username: 'TestUser123' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('name validation', () => {
      it('accepts valid name', () => {
        const data = { name: 'John Doe' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects empty name', () => {
        const data = { name: '' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Name is required');
        }
      });

      it('rejects name longer than 50 characters', () => {
        const data = { name: 'a'.repeat(51) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 50 characters');
        }
      });

      it('accepts name at maximum length boundary', () => {
        const data = { name: 'a'.repeat(50) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts name with special characters', () => {
        const data = { name: "O'Brien-Smith Jr." };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('bio validation', () => {
      it('accepts valid bio', () => {
        const data = { bio: 'This is my bio' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts empty bio', () => {
        const data = { bio: '' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects bio longer than 280 characters', () => {
        const data = { bio: 'a'.repeat(281) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 280 characters');
        }
      });

      it('accepts bio at maximum length boundary', () => {
        const data = { bio: 'a'.repeat(280) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('bio_link validation', () => {
      it('accepts valid URL', () => {
        const data = { bio_link: 'https://example.com' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts empty string', () => {
        const data = { bio_link: '' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects invalid URL', () => {
        const data = { bio_link: 'not-a-url' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('social handle validation', () => {
      it('accepts valid x_handle', () => {
        const data = { x_handle: 'testuser' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts valid instagram_handle', () => {
        const data = { instagram_handle: 'testuser' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects x_handle longer than 50 characters', () => {
        const data = { x_handle: 'a'.repeat(51) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 50 characters');
        }
      });

      it('rejects instagram_handle longer than 50 characters', () => {
        const data = { instagram_handle: 'a'.repeat(51) };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('less than 50 characters');
        }
      });

      it('accepts handles at maximum length boundary', () => {
        const xData = { x_handle: 'a'.repeat(50) };
        expect(updateProfileSchema.safeParse(xData).success).toBe(true);

        const igData = { instagram_handle: 'a'.repeat(50) };
        expect(updateProfileSchema.safeParse(igData).success).toBe(true);
      });
    });

    describe('ln_address validation', () => {
      it('accepts valid Lightning address', () => {
        const data = { ln_address: 'user@getalby.com' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts empty string', () => {
        const data = { ln_address: '' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects invalid Lightning address format', () => {
        const data = { ln_address: 'not-an-email' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('nip05 validation', () => {
      it('accepts valid NIP-05 identifier', () => {
        const data = { nip05: 'user@nostr.com' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('accepts empty string', () => {
        const data = { nip05: '' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('rejects invalid NIP-05 format', () => {
        const data = { nip05: 'not-an-email' };
        const result = updateProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validationMessages', () => {
    it('contains email validation messages', () => {
      expect(validationMessages.email.required).toBe('Email is required');
      expect(validationMessages.email.invalid).toBe('Please enter a valid email address');
      expect(validationMessages.email.tooLong).toBe('Email must be less than 100 characters');
    });

    it('contains code validation messages', () => {
      expect(validationMessages.code.required).toBe('Verification code is required');
      expect(validationMessages.code.invalid).toBe('Code must be exactly 6 digits');
      expect(validationMessages.code.numbersOnly).toBe('Code must contain only numbers');
    });

    it('contains username validation messages', () => {
      expect(validationMessages.username.required).toBe('Username is required');
      expect(validationMessages.username.tooShort).toBe('Username must be at least 3 characters');
      expect(validationMessages.username.tooLong).toBe('Username must be less than 20 characters');
      expect(validationMessages.username.invalid).toBe(
        'Username can only contain letters, numbers, and underscores'
      );
    });

    it('contains name validation messages', () => {
      expect(validationMessages.name.required).toBe('Name is required');
      expect(validationMessages.name.tooLong).toBe('Name must be less than 50 characters');
    });

    it('contains bio validation messages', () => {
      expect(validationMessages.bio.tooLong).toBe('Bio must be less than 280 characters');
    });

    it('contains bio_link validation messages', () => {
      expect(validationMessages.bioLink.invalid).toBe('Please enter a valid URL');
    });

    it('contains Lightning address validation messages', () => {
      expect(validationMessages.lightningAddress.invalid).toBe(
        'Lightning address must be a valid email format'
      );
    });

    it('contains NIP-05 validation messages', () => {
      expect(validationMessages.nip05.invalid).toBe(
        'NIP-05 identifier must be a valid email format'
      );
    });

    it('is a constant object', () => {
      expect(validationMessages).toBeDefined();
      expect(typeof validationMessages).toBe('object');
    });
  });
});
