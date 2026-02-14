## [2026-02-05] Task 1 & 2 Complete: Username Generation After OTP

### What Was Implemented

1. **lib/utils/username.ts** - Client-side username generation helper
    - `normalizeUsername()` - lowercase, trim, remove non-alphanumeric
    - `isReservedWord()` - blocks api, blog, auth, e, event
    - `checkUsernameAvailability()` - calls GET /v1/user/check-username
    - `generateUsernameBase()` - creates candidates from email prefix + name
    - `generateAvailableUsername()` - main function with collision handling (numeric suffixes 2-10)

2. **components/event-detail/registration-form.tsx** - Post-OTP integration
    - Modified `handleOtpVerify()` to generate username for new users
    - Calls `updateProfile.mutateAsync({ name, username })` after OTP verification
    - Graceful error handling ensures registration proceeds even if username update fails

### Key Implementation Details

- Reserved words are filtered out before checking availability
- Collision handling appends numeric suffix without separator (alex -> alex2)
- Max 10 attempts for collision resolution
- No React hooks in utility - can be called from anywhere
- TypeScript type-safe throughout

### Files Changed

- `lib/utils/username.ts` (160 lines, new)
- `components/event-detail/registration-form.tsx` (+29, -8)

### Verification

- TypeScript compiles without errors
- All tests pass
- Committed successfully

### Notes

- The existing pre-commit hook runs tests automatically
- Backend rules mirror evento-api: 3-20 chars, alphanumeric only
- Username is auto-generated during event registration OTP flow
