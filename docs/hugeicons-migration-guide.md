# Hugeicons Migration Guide

## Purpose

This repo now uses Hugeicons for user-facing product iconography outside the shared primitive layer.

The migration path is intentionally split:

- User-facing app and feature code should import from [components/icons/lucide.tsx](/Users/andreneves/Code/evento/evento-client/components/icons/lucide.tsx), which preserves the familiar Lucide-style API while rendering Hugeicons underneath.
- Shared primitives under [components/ui](/Users/andreneves/Code/evento/evento-client/components/ui) are intentionally left on their existing `lucide-react` internals unless there is a deliberate primitive-layer migration.

## What To Import

For user-facing icons, prefer:

```ts
import { Search, Settings, UserPlus } from '@/components/icons/lucide';
```

Do not add new direct `lucide-react` imports in user-facing product code.

## Sidebar Rules

The dashboard sidebar has its own Hugeicons wrapper at [components/dashboard/sidebar-icon.tsx](/Users/andreneves/Code/evento/evento-client/components/dashboard/sidebar-icon.tsx). That wrapper enforces:

- Hugeicons rendering
- `strokeWidth={1.5}`
- consistent sidebar sizing

The wallet/sidebar visual language also uses `BitcoinEllipse` for wallet/bitcoin affordances instead of the old Lucide `Zap`.

## Primitive Boundary

Keep these areas unchanged unless you are intentionally migrating the primitive layer:

- [components/ui](/Users/andreneves/Code/evento/evento-client/components/ui)
- generic `LucideIcon`-typed APIs that exist to support reusable primitives

That boundary keeps broad icon refreshes from destabilizing low-level shared components.

## Adding New Icons

If the icon you need is already exposed by [components/icons/lucide.tsx](/Users/andreneves/Code/evento/evento-client/components/icons/lucide.tsx), import it from there.

If it is not exposed yet:

1. Find the appropriate Hugeicons export in `@hugeicons/core-free-icons`.
2. Add a mapped component to [components/icons/lucide.tsx](/Users/andreneves/Code/evento/evento-client/components/icons/lucide.tsx).
3. Keep the exported name aligned with the Lucide-style name expected by product code when that improves migration compatibility.

## Validation

After expanding the adapter or migrating icon usage, run:

```bash
pnpm run tsc
pnpm run build
```

Those two commands are the current safety net for this migration path.
