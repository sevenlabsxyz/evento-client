# Feature Gap: Command Palette / Quick Search

## Status

**Missing from evento-client** - Exists in legacy evento-api frontend

## Priority

Medium (Power user feature, improves navigation efficiency)

## Description

The legacy frontend includes a command palette (Cmd+K / Ctrl+K) that provides quick access to search, navigation, and common actions. This is a productivity feature that allows users to quickly jump to events, users, or actions without clicking through menus.

## Legacy Implementation Location

- `evento-api/components/command-menu/index.tsx`

## User Flow (Legacy)

1. User presses `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Command palette modal opens with search input focused
3. User can:
    - Search for events by name
    - Search for users by username
    - Navigate to common pages (Hub, Feed, Profile, Create Event)
    - Perform quick actions (Create Event, View Notifications)
4. Arrow keys navigate results, Enter selects
5. Escape closes the palette

## Features

### Search Modes

- **Events**: Search user's events and public events
- **Users**: Search by username or display name
- **Navigation**: Quick links to main pages

### Quick Actions

- Create new event
- Go to Hub
- Go to Feed
- Go to Messages
- Go to Profile
- Go to Settings

## Acceptance Criteria

- [ ] Opens with Cmd+K / Ctrl+K keyboard shortcut
- [ ] Search input auto-focused on open
- [ ] Real-time search results as user types
- [ ] Keyboard navigation (up/down arrows, enter to select)
- [ ] Escape key closes the palette
- [ ] Clicking outside closes the palette
- [ ] Shows recent searches or suggested actions when empty
- [ ] Categorized results (Events, Users, Actions)
- [ ] Works on all pages (global component)

## UI/UX Considerations

- Use `cmdk` library (built for this exact purpose)
- Overlay with backdrop blur
- Grouped results with section headers
- Show keyboard shortcuts for navigation
- Loading states for search results
- Empty states with helpful suggestions

## Related Files in evento-client

- Add to `components/` as a global component (e.g., `components/command-palette.tsx`)
- Include in root layout or app shell
- Connect to existing search hooks:
    - `lib/hooks/use-search.ts`
    - `lib/stores/recent-searches-store.ts`

## Implementation Approach

### Recommended Library

Use `cmdk` by Paco (https://cmdk.paco.me/) - it's the standard for React command palettes, used by Vercel, Linear, and Raycast.

```bash
pnpm add cmdk
```

### Basic Structure

```tsx
'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSearch } from '@/lib/hooks/use-search';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [query, setQuery] = useState('');
    const { data: searchResults, isLoading } = useSearch(query);

    // Toggle with keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSelect = (callback: () => void) => {
        setOpen(false);
        callback();
    };

    return (
        <Command.Dialog open={open} onOpenChange={setOpen} className='fixed inset-0 z-50'>
            <div className='fixed inset-0 bg-black/50' />
            <div className='fixed left-1/2 top-1/4 w-full max-w-lg -translate-x-1/2'>
                <Command className='rounded-xl border bg-background shadow-2xl'>
                    <Command.Input
                        placeholder='Search events, users, or type a command...'
                        value={query}
                        onValueChange={setQuery}
                    />
                    <Command.List className='max-h-[300px] overflow-y-auto p-2'>
                        <Command.Empty>No results found.</Command.Empty>

                        {/* Quick Actions */}
                        <Command.Group heading='Actions'>
                            <Command.Item
                                onSelect={() => handleSelect(() => router.push('/e/create'))}
                            >
                                Create Event
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => router.push('/e/hub'))}
                            >
                                Go to Hub
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => router.push('/e/feed'))}
                            >
                                Go to Feed
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => router.push('/e/messages'))}
                            >
                                Go to Messages
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => router.push('/e/profile'))}
                            >
                                Go to Profile
                            </Command.Item>
                        </Command.Group>

                        {/* Search Results */}
                        {query && searchResults?.users?.length > 0 && (
                            <Command.Group heading='Users'>
                                {searchResults.users.map((user) => (
                                    <Command.Item
                                        key={user.id}
                                        onSelect={() =>
                                            handleSelect(() => router.push(`/${user.username}`))
                                        }
                                    >
                                        @{user.username}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {query && searchResults?.events?.length > 0 && (
                            <Command.Group heading='Events'>
                                {searchResults.events.map((event) => (
                                    <Command.Item
                                        key={event.id}
                                        onSelect={() =>
                                            handleSelect(() => router.push(`/e/${event.id}`))
                                        }
                                    >
                                        {event.title}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                </Command>
            </div>
        </Command.Dialog>
    );
}
```

### Integration

Add to root layout:

```tsx
// app/layout.tsx or app/e/layout.tsx
import { CommandPalette } from '@/components/command-palette';

export default function Layout({ children }) {
    return (
        <>
            {children}
            <CommandPalette />
        </>
    );
}
```

## Dependencies to Add

```bash
pnpm add cmdk
```

## Styling

The `cmdk` library is unstyled by default. Style using Tailwind classes or create a styled wrapper. Consider using shadcn/ui's command component if available:

```bash
pnpm dlx shadcn-ui@latest add command
```

## Estimated Effort

- **Medium** (1-2 days)
- Install and configure cmdk
- Create command palette component
- Integrate with existing search hooks
- Add keyboard shortcut handling
- Style to match app design
- Add to global layout
- Test keyboard navigation

## Notes

- This is a power-user feature but significantly improves UX
- Consider adding a search button in navbar that also opens the palette
- Analytics: Track which commands/searches are most used
- Consider debouncing search queries for performance
