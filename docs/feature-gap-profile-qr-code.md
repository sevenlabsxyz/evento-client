# Feature Gap: Profile QR Code

## Status

**Missing from evento-client** - Exists in legacy evento-api frontend

## Priority

Low-Medium (Nice-to-have for networking at events)

## Description

The legacy frontend provides users with a QR code that links to their public profile. This is useful for in-person networking at events - users can show their QR code and others can scan it to view their profile and follow them.

## Legacy Implementation Location

- `evento-api/components/profile/qr/index.tsx`

## User Flow (Legacy)

1. User navigates to their profile page (`/me` or `/e/profile`)
2. QR code icon/button is visible near profile actions
3. Clicking opens a modal/sheet displaying a large QR code
4. QR code encodes the URL: `https://evento.so/{username}`
5. Other users can scan with their phone camera to open the profile

## Acceptance Criteria

- [ ] QR code button visible on user's own profile page
- [ ] Opens sheet/modal with scannable QR code
- [ ] QR encodes the public profile URL (`https://evento.so/{username}`)
- [ ] QR code is large enough to scan easily
- [ ] Option to download/save QR code as image
- [ ] Works on both desktop and mobile views

## UI/UX Considerations

- Use a QR code library (e.g., `qrcode.react` or `react-qr-code`)
- Display username below the QR code for context
- Consider adding Evento branding/logo in QR code center
- Sheet should have share options (copy link, download image)

## Related Files in evento-client

- `app/e/profile/page.tsx` - Current user profile page
- `components/profile/` - Profile UI components

## Implementation Example

```tsx
// Example using qrcode.react
import { QRCodeSVG } from 'qrcode.react';

export function ProfileQRCode({ username }: { username: string }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant='outline' size='icon'>
                    <QrCode className='h-4 w-4' />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <div className='flex flex-col items-center gap-4 py-8'>
                    <QRCodeSVG
                        value={`https://evento.so/${username}`}
                        size={256}
                        level='M'
                        includeMargin
                    />
                    <p className='text-sm text-muted-foreground'>
                        Scan to view @{username}'s profile
                    </p>
                    <Button variant='outline' onClick={handleDownload}>
                        Download QR Code
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
```

## Dependencies to Add

```bash
pnpm add qrcode.react
```

## Estimated Effort

- **Small** (2-4 hours)
- Install QR code library
- Create QRCode sheet component
- Add button to profile page
- Download functionality
