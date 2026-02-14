## Task 1: Client-side Username Generation Utility

### Implementation Details

- Created `lib/utils/username.ts` with 5 exported functions
- Follows evento-api algorithm exactly: email prefix → name → combinations
- Reserved words: `api`, `blog`, `auth`, `e`, `event`
- Normalization: `toLowerCase().replace(/[^a-z0-9]/g, '')`
- Collision handling: numeric suffixes without separators (alex → alex2 → alex3)
- Max 10 generation attempts before throwing error

### Key Functions

1. `normalizeUsername(input)` - Strips to alphanumeric lowercase
2. `isReservedWord(username)` - Checks against reserved list
3. `checkUsernameAvailability(username)` - API call to `/v1/user/check-username`
4. `generateUsernameBase(email, name?)` - Generates candidate array in priority order
5. `generateAvailableUsername(email, name?)` - Main function with collision handling

### API Integration

- Uses `apiClient` from `@/lib/api/client`
- Endpoint: `GET /v1/user/check-username?username=...`
- Returns `{ available: boolean }`
- 404 response = username available (not found in DB)

### Validation Rules (matching backend)

- Length: 3-20 characters
- Pattern: alphanumeric only (no underscores, no special chars)
- Case: lowercase only
- Reserved words blocked

### Next Steps

- Task 2 will integrate this into `lib/hooks/use-auth.ts` post-OTP flow
- No React hooks dependency - can be called from any context

## Task 2: Username Generation Integration (Completed)

### Implementation Details

- Modified `components/event-detail/registration-form.tsx` to wire username generation into post-OTP verification flow
- Added import for `generateAvailableUsername` helper from `lib/utils/username.ts`
- Updated `handleOtpVerify` function to:
    1. Check if user needs name update: `!userToUse.name || userToUse.name !== name.trim()`
    2. Check if user needs username: `!userToUse.username`
    3. Generate username using `generateAvailableUsername(email.trim(), name.trim())` if needed
    4. Call `updateProfile.mutateAsync()` with both `name` and `username` updates
    5. Gracefully handle failures with try-catch (non-blocking)

### Code Pattern

```typescript
const userToUse = freshUserData || userData;
if (userToUse) {
    const needsNameUpdate = !userToUse.name || userToUse.name !== name.trim();
    const needsUsername = !userToUse.username;

    if (needsNameUpdate || needsUsername) {
        try {
            const updates: { name?: string; username?: string } = {};
            if (needsNameUpdate) updates.name = name.trim();
            if (needsUsername) {
                const generatedUsername = await generateAvailableUsername(
                    email.trim(),
                    name.trim()
                );
                updates.username = generatedUsername;
            }
            await updateProfile.mutateAsync(updates);
        } catch (error) {
            console.warn('Failed to update profile, continuing with registration:', error);
        }
    }
}
```

### Verification

- TypeScript compilation: ✅ No errors in `registration-form.tsx`
- Import added: ✅ `generateAvailableUsername` from `@/lib/utils/username`
- Flow preserved: ✅ Registration continues even if username generation fails
- Graceful fallback: ✅ Try-catch ensures non-blocking behavior

### Integration Points

- **Hook used**: `useUpdateUserProfile()` from `lib/hooks/use-user-profile.ts`
- **API endpoint**: `PATCH /v1/user` accepts `{ name, username }` updates
- **Helper function**: `generateAvailableUsername(email, name)` from Task 1
- **Flow position**: After OTP verification, before registration submission

### Expected Behavior

1. User completes OTP verification in event registration flow
2. System checks if user has a username
3. If no username exists, generates one using email and name
4. Updates user profile with both name and username
5. Proceeds with event registration regardless of profile update success
6. New users will have both `name` and `username` in their profile after registration

### Notes

- Username generation is non-blocking - registration succeeds even if it fails
- Follows existing pattern of updating user name after OTP verification
- Reuses the same `updateProfile` mutation for both name and username updates
- Collision handling is built into the helper (tries numeric suffixes)
