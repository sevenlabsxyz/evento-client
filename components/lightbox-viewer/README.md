# Lightbox Viewer Component

A full-screen image viewer with swipe gestures, keyboard navigation, and user details display.

## Usage

```tsx
import { LightboxViewer } from '@/components/lightbox-viewer';

// In your component
<LightboxViewer
  images={formattedImages}
  selectedImage={selectedImage}
  onClose={() => setSelectedImage(null)}
  onImageChange={setSelectedImage}
  showDropdownMenu={showMenu}
  handleDelete={handleDelete}
  userId={userData?.id}
  eventId={params.id as string}
/>
```

## Props

- `images`: Array of image objects with user details
- `selectedImage`: Index of currently selected image (null when closed)
- `onClose`: Function called when lightbox is closed
- `onImageChange`: Function called when user navigates to different image
- `showDropdownMenu`: Whether to show delete/menu options
- `handleDelete`: Function to handle photo deletion
- `userId`: Current user ID
- `eventId`: Event ID for context

## Features

- **Swipe Navigation**: Swipe left/right to navigate, swipe down to close
- **Keyboard Navigation**: Arrow keys to navigate, Escape to close
- **Image Download**: Support for iOS share API and traditional download
- **User Details**: Shows uploader avatar, username, verification badge
- **Delete Functionality**: Mobile and desktop delete menus
- **Responsive**: Adapts to mobile and desktop interfaces

## Components

- `LightboxViewer`: Main component
- `LikeButton`: Photo like button (placeholder)
- `DeleteConfirmation`: Delete confirmation dialog
- `GalleryDropdownMenu`: Desktop dropdown menu
- `MobileGalleryMenu`: Mobile bottom sheet menu

## Dependencies

- `react-swipeable`: For swipe gesture support
- `@/components/ui/*`: Various UI components from the project
- `lucide-react`: Icons