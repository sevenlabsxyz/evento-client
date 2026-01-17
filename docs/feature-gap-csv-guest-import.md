# Feature Gap: CSV Guest Import

## Status

**Missing from evento-client** - Exists in legacy evento-api frontend

## Priority

Medium-High (Event hosts use this for bulk operations)

## Description

The legacy frontend allows event hosts to import guest lists from CSV/Excel files. This enables bulk addition of attendees without manually entering each guest.

## Legacy Implementation Location

- `evento-api/components/import-csv/index.tsx`

## User Flow (Legacy)

1. Host navigates to event management -> Guest Management
2. Clicks "Import Guests" or "Import CSV" button
3. Uploads a CSV file with columns: `name`, `email`, `phone` (optional)
4. System parses the CSV and displays a preview
5. Host confirms the import
6. Guests are added to the event's attendee list
7. Optional: Send invitations to imported guests

## Expected CSV Format

```csv
name,email,phone
John Doe,john@example.com,+1234567890
Jane Smith,jane@example.com,
```

## API Endpoint

- `POST /api/v1/events/[eventId]/attendees` - Bulk add attendees

## Acceptance Criteria

- [ ] User can upload CSV file from event management page
- [ ] System validates CSV format and shows errors for invalid rows
- [ ] Preview of parsed data before confirming import
- [ ] Handle duplicate emails gracefully (skip or update)
- [ ] Support optional phone numbers
- [ ] Show success count and any skipped rows
- [ ] Option to send invitation emails after import

## UI/UX Considerations

- Add "Import CSV" button to `/e/[id]/manage/guests` page
- Use a sheet/modal for the import flow
- Show clear error messages for malformed CSV files
- Provide a downloadable CSV template

## Related Files in evento-client

- `app/e/[id]/manage/guests/page.tsx` - Where the feature should be added
- `components/manage-event/` - Management UI components

## Implementation Notes

- Consider using a library like `papaparse` for CSV parsing
- Mobile-friendly: Should work on tablet for hosts managing events on-the-go
- Check if `papaparse` or similar is already in dependencies

## Estimated Effort

- **Small-Medium** (1-2 days)
- CSV parsing logic
- Upload UI component
- Preview table
- API integration for bulk add
