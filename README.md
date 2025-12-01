# Evento App + Bitcoin Wallet ([app.evento.so](https://app.evento.so))

## Overview

**Create Events. Connect People. Build Communities.**

Evento is a social-first event management platform designed to make organizing friction-free and fun. Whether bringing together five friends or five hundred attendees, our platform equips organizers with powerful tools to create meaningful connections.

The application features a comprehensive suite of capabilities:

- **Seamless event creation and management**
- **Interactive guest list and RSVP tracking**
- **Targeted email communications with scheduling**
- **Dynamic location services with map integration**
- **Payments via multiple channels such as Stripe, PayPal, Lightning Network and Venmo**
- **Music embedding via Spotify and Wavlake**
- **Real-time updates and notifications**
- **Community building tools**
- **_etc..._**

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PNPM package manager
- Supabase account (for authentication and database)
- Google Maps API key (for location services)
- Ghost CMS setup (for blog functionality)

### Environment Setup

1. Clone this repository
2. Copy `.env.example` to `.env.local` and fill in the required environment variables
3. Install dependencies:

```bash
pnpm install
```

4. Start the development server:

```bash
pnpm dev
```

5. Access the application at `http://localhost:3000`

## Project Structure

```
├── app/             # Next.js 14 App Router pages and API routes
│   ├── api/         # API routes (primarily for proxying)
│   ├── blog/        # Blog pages
│   ├── e/           # Event-specific pages
├── components/      # React components
│   ├── event-detail/# Event detail page components
│   ├── manage-event/# Event management components
│   ├── shared/      # Shared components
│   ├── ui/          # UI components (based on shadcn UI)
├── lib/             # Shared utilities
│   ├── api/         # API client and utilities
│   ├── constants/   # Constants including environment variables
│   ├── hooks/       # Custom React hooks
│   ├── schemas/     # Zod validation schemas
│   ├── services/    # Service-specific utilities
│   ├── stores/      # State management stores
│   ├── supabase/    # Supabase client setup
│   ├── types/       # TypeScript type definitions
│   └── utils/       # Utility functions
├── public/          # Static assets
└── styles/          # Global styles
```

## Key Technologies

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components based on shadcn/ui
- **State Management**: React Query for server state, React Context/Hooks for local state
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Rich Text Editing**: TipTap
- **Form Validation**: React Hook Form with Zod
- **API Communication**: Axios
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Environment Variables

All environment variables are centralized in `lib/constants/env.ts`. Always use these constants instead of directly accessing `process.env` in your code:

```typescript
// ❌ Bad
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ Good
import { Env } from '@/lib/constants/env';
const apiUrl = Env.NEXT_PUBLIC_API_URL;
```

## Development Workflow

### Code Formatting and Linting

```bash
# Run ESLint
pnpm lint
```

### Building for Production

```bash
pnpm build
```

### Running Production Build

```bash
pnpm start
```

## API Integration

For detailed information about integrating with our APIs:

- See `FRONTEND_INTEGRATION_GUIDE.md` for implementing new frontend features
- See `INTERNAL_API_REFERENCE.md` for internal API documentation

## Additional Resources

- **API Docs**: See `EVENTO_API_DOCS.md` for detailed API documentation

## Support

For questions or assistance, contact the engineering team through our internal channels.
