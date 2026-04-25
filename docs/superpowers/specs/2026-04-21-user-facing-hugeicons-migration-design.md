# User-Facing Hugeicons Migration Design

## Summary

Replace remaining user-facing rendered `lucide-react` icons across the app with appropriate Hugeicons equivalents, while leaving shared UI primitives and generic icon-type APIs unchanged.

## Goals

- Remove `lucide-react` from user-visible product surfaces outside the primitive layer.
- Reuse the Hugeicons packages already introduced for the sidebar.
- Keep icon rendering visually consistent with the new Hugeicons direction.
- Avoid destabilizing shared UI primitives and internal type contracts.

## Non-Goals

- Rewriting `components/ui/*` primitive internals such as `sheet`, `select`, `dropdown-menu`, `calendar`, `checkbox`, `pagination`, and similar shared building blocks.
- Replacing type-only `LucideIcon` APIs where they are part of generic component contracts.
- Converting every `lucide-react` import in the repo regardless of whether it is user-facing.

## Scope

In scope:

- user-facing screens and feature components that directly render Lucide icons
- app routes, feature sheets, onboarding, profile, auth, wallet, event-detail, messages, notifications, and similar product surfaces
- non-primitive components that render icons directly to users

Out of scope:

- primitive components under [components/ui](/Users/andreneves/Code/evento/evento-client/components/ui)
- generic icon-type contracts that should remain library-agnostic for now
- hidden/internal-only development tools unless they render in normal product usage

## Approach

1. Search the codebase for `lucide-react` imports.
2. Exclude primitive-layer files and type-only usage that does not render visible icons.
3. Group remaining files by product area to keep the migration reviewable.
4. Replace rendered Lucide icons with appropriate Hugeicons equivalents.
5. Reuse the shared Hugeicons wrapper pattern where it meaningfully reduces duplication or enforces a consistent stroke treatment.

## Implementation Notes

- Prefer direct Hugeicons mappings that preserve current semantics instead of introducing new metaphors.
- Where an exact one-to-one icon does not exist, choose the closest user-facing equivalent and keep the surrounding behavior unchanged.
- Be careful with mixed imports where a file uses both type-only and rendered Lucide symbols.
- Avoid touching primitive-only icon imports even if they are technically rendered, because they are part of the reusable UI layer the user asked to preserve.

## Risks

- A broad migration can accidentally touch primitive or type-contract files if the search is not filtered carefully.
- Some feature areas may have icon config arrays that mix rendered usage with shared component contracts.
- Hugeicons and Lucide differ slightly in visual balance, so some rows or buttons may need small spacing adjustments after the swap.

## Mitigations

- Filter aggressively by file role before editing.
- Migrate by product area instead of making an indiscriminate global replacement.
- Reuse a shared Hugeicons wrapper where consistent sizing or stroke treatment matters.
- Validate with both type-check and production build after the migration.

## Testing

- Run `pnpm run tsc`.
- Run `pnpm run build`.
- Spot-check major user-facing surfaces that still had Lucide imports before the migration.
- Confirm primitive-layer files remain unchanged unless explicitly out of primitive scope.
