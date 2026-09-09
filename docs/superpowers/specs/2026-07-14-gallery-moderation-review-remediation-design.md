# Gallery Moderation Review Remediation Design

## Context

PR #467 gives accepted event hosts the same comment and gallery moderation controls as event creators. An independent Fable 5 review verified the permission model but found a gallery rendering regression and several newly reachable defects on the dedicated gallery page.

The API stores gallery object URLs as relative paths such as `/eventos/gallery/<event-id>/<file>`. Existing client display paths normalize those values through `getOptimizedImageUrl`, which maps them to Evento's public CDN. The PR's new `GalleryItem` and lightbox mappings currently pass the relative values through unchanged, causing the browser or Next Image optimizer to request them from the client origin.

## Scope

This remediation remains entirely inside the evento-client PR. It will:

- normalize gallery URLs in reusable gallery tiles and both affected lightbox mappings;
- keep empty galleries as valid event pages after the final photo is deleted;
- replace the dedicated gallery page's inert Add Photos control with the existing upload sheet;
- restore keyboard access to clickable gallery tiles; and
- add focused regression coverage for these behaviors.

It will not change API authorization, Stream chat behavior, the API drafts query, or the established creator/cohost/uploader permission policy. It will not introduce a new host-fetching abstraction.

## Component Design

### Gallery image URLs

`components/event-detail/gallery-item.tsx` will derive one display URL with `getOptimizedImageUrl(item.url)` and use it for GIF and non-GIF rendering. The helper leaves absolute HTTPS URLs unchanged and converts relative storage paths to Evento CDN URLs.

`app/e/[id]/page-client.tsx` and `app/e/[id]/gallery/page.tsx` will map lightbox images through `getOptimizedImageUrl(item.url, 1200, 90)`. Normalization happens before data reaches `LightboxViewer`, so the component does not need broader URL-routing behavior.

### Empty gallery behavior

The dedicated gallery page's missing-event guard will check only `!eventData`. A valid event with zero photos will render the page header and the existing `No Photos Yet` state. When the final photo is deleted, the existing deletion mutation invalidates gallery data and the lightbox closes through its established final-item handling.

### Photo uploads

The dedicated gallery page will own an `uploadSheetOpen` boolean. Its host-only Add Photos button will open `PhotoUploadSheet`, and the page will render that existing component with the current event ID. Upload success will continue using the sheet's existing gallery-query invalidation and toast behavior.

### Keyboard accessibility

`GalleryItem` will remain a non-button wrapper because it contains nested interactive like and moderation controls. When an image-click callback is present, the wrapper will expose button semantics, a focus target, an accessible label, visible focus styling, and Enter/Space activation. Activation will only occur when the wrapper itself is the event target, preventing child controls from opening the lightbox.

## Error Handling

The remediation reuses existing behavior:

- upload failures remain handled by `PhotoUploadSheet` and its upload hook;
- deletion failures remain handled by the deletion hook and existing toasts;
- absolute external URLs remain untouched;
- relative paths are normalized deterministically; and
- child control events remain isolated from tile navigation.

No new error state or retry policy is introduced.

## Testing

Focused tests will cover:

- a relative `/eventos/gallery/...` URL rendering as an Evento CDN URL in `GalleryItem`;
- both lightbox mappings receiving normalized 1200px/90-quality URLs;
- an empty gallery rendering `No Photos Yet` instead of `Event Not Found`;
- the host Add Photos button opening `PhotoUploadSheet`;
- Enter and Space opening a gallery image;
- child interactive controls not activating the tile; and
- existing creator, accepted cohost, uploader, attendee, and signed-out permission behavior remaining unchanged.

After focused tests, the full Jest suite and TypeScript typecheck will run. No local HTTP server will be started.

## Success Criteria

- Relative gallery photos render correctly in grids and lightboxes.
- Deleting the final photo leaves a valid empty gallery page.
- Hosts can upload from the dedicated gallery page through the existing working flow.
- Gallery tiles are keyboard accessible without interfering with nested actions.
- Authorization behavior remains unchanged.
- Focused tests, the full client suite, and TypeScript pass before the PR branch is pushed.
