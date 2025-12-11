# Complete Setup Guide

This guide will help you set up the Evento application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or later ([Download](https://nodejs.org/))
- **PNPM** package manager ([Install](https://pnpm.io/installation))
- **Git** for version control

## Required External Services

You'll need accounts and API keys for the following services:

### 1. Supabase (Required)

- **Purpose**: Authentication and database
- **Sign up**: [supabase.com](https://supabase.com)
- **What you need**:
    - Project URL
    - Anon/Public key
    - Service role key (for admin operations)

### 2. Google Maps (Required for location features)

- **Purpose**: Map display and location services
- **Sign up**: [Google Cloud Console](https://console.cloud.google.com/)
- **What you need**: Maps JavaScript API key

### 3. Ghost CMS (Optional - for blog)

- **Purpose**: Blog content management
- **Sign up**: [ghost.org](https://ghost.org)
- **What you need**:
    - Ghost URL
    - Content API key

### 4. Additional Services (Optional)

- **Giphy**: For GIF picker functionality
- **OpenWeatherMap**: For weather information
- **Stream Chat**: For real-time messaging

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sevenlabsxyz/evento-client.git
cd evento-client
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Node Environment
NODE_ENV=development

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_PROXY_TARGET=http://localhost:3002/api

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Ghost CMS (Optional)
NEXT_PUBLIC_GHOST_URL=https://your-ghost-site.com
NEXT_PUBLIC_GHOST_CONTENT_API_KEY=your-content-api-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Giphy (Optional)
NEXT_PUBLIC_GIPHY_API_KEY=your-giphy-key

# OpenWeatherMap (Optional)
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your-weather-key

# Stream Chat (Optional)
NEXT_PUBLIC_STREAM_CHAT_API_KEY=your-stream-key
```

### 4. Set Up Supabase Database

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Link to your project:

```bash
supabase link --project-ref your-project-ref
```

3. Push database migrations:

```bash
supabase db push
```

#### Option B: Manual Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/20250728010118_remote_schema.sql`

**Important**: Before running the migration, update the webhook URLs in the SQL file:

- Replace `YOUR_API_URL` with your actual API URL
- Replace `YOUR_WEBHOOK_SECRET` with a secure secret key
- Uncomment the trigger statements you want to enable

### 5. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **URL Configuration**
2. Add your site URL: `http://localhost:3000`
3. Add redirect URLs:
    - `http://localhost:3000/auth/callback`
    - Any other URLs you'll use for OAuth

4. Enable desired auth providers in **Authentication** > **Providers**

### 6. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 7. Run Tests (Optional)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run type checking
pnpm tsc
```

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

#### 2. Supabase connection errors

- Verify your Supabase URL and keys in `.env.local`
- Check that your Supabase project is active
- Ensure you're using the correct project credentials

#### 3. API proxy errors

- Verify `API_PROXY_TARGET` points to your backend API
- Check that the backend server is running
- Review CORS settings if making cross-origin requests

#### 4. Build errors

```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Check linting
pnpm lint
```

### Getting Help

- Check existing [GitHub Issues](https://github.com/sevenlabsxyz/evento-client/issues)
- Create a new issue with:
    - Your environment details
    - Steps to reproduce
    - Error messages
    - What you've tried

## Development Workflow

### Code Quality

```bash
# Lint code
pnpm lint

# Format code (if Prettier is configured)
pnpm format

# Type check
pnpm tsc
```

### Building for Production

```bash
# Create production build
pnpm build

# Test production build locally
pnpm start
```

### Database Migrations

When making database changes:

1. Create a new migration:

```bash
supabase migration new your_migration_name
```

2. Edit the migration file in `supabase/migrations/`

3. Apply migration:

```bash
supabase db push
```

## Project Structure Overview

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── blog/              # Blog pages
│   ├── e/                 # Event pages
│   └── [username]/        # User profile pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── event-detail/     # Event-specific components
│   └── manage-event/     # Event management components
├── lib/                   # Shared utilities
│   ├── api/              # API client
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Service layer
│   ├── stores/           # State management
│   └── utils/            # Utility functions
├── public/                # Static assets
├── supabase/             # Database migrations
└── __tests__/            # Test files
```

## Next Steps

1. **Explore the codebase**: Start with `app/page.tsx` for the home page
2. **Review components**: Check `components/` for reusable UI elements
3. **Understand data flow**: Review hooks in `lib/hooks/`
4. **Read the API docs**: Check how API calls are structured in `lib/api/`
5. **Run tests**: Familiarize yourself with the test suite

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

[Add license information]

---

**Need Help?** Open an issue on GitHub or check our documentation.
