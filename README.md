# Evento - Social Event Management Platform

<div align="center">

![Evento Logo](public/evento-logo.svg)

**Create Events. Connect People. Build Communities.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing) • [License](#license)

</div>

---

## Overview

Evento is a modern, social-first event management platform built with Next.js 14 and TypeScript. It's designed to make event organizing friction-free and fun, whether you're bringing together five friends or five hundred attendees.

### Key Features

- 🎉 **Seamless Event Creation** - Intuitive event builder with rich text editing
- 👥 **Interactive Guest Management** - RSVP tracking, check-ins, and guest lists
- 📧 **Email Communications** - Targeted email blasts with scheduling
- 📍 **Location Services** - Google Maps integration with dynamic location display
- 💳 **Multiple Payment Options** - Stripe, PayPal, Lightning Network, and Venmo
- ⚡ **Bitcoin Wallet** - In-app Bitcoin wallet powered by Breez SDK for Lightning payments
- 🎵 **Music Integration** - Embed playlists from Spotify and Wavlake
- 🔔 **Real-time Notifications** - Stay updated with instant alerts
- 📸 **Event Gallery** - Share and react to event photos
- 💬 **Live Chat** - Real-time messaging with Stream Chat
- 🌤️ **Weather Integration** - Event weather forecasts
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 🔐 **Secure Authentication** - Powered by Supabase Auth

## Quick Start

### Prerequisites

- **Node.js** 18.x or later ([Download](https://nodejs.org/))
- **PNPM** package manager ([Install](https://pnpm.io/installation))
- **Supabase** account ([Sign up](https://supabase.com))
- **Google Maps API** key ([Get key](https://console.cloud.google.com/))

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/sevenlabsxyz/evento-client.git
    cd evento-client
    ```

2. **Install dependencies**

    ```bash
    pnpm install
    ```

3. **Set up environment variables**

    ```bash
    cp .env.example .env.local
    ```

    Edit `.env.local` with your credentials:

    ```env
    # Required
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

    # Optional
    NEXT_PUBLIC_GHOST_URL=your_ghost_url
    NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_key
    NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_weather_key
    NEXT_PUBLIC_STREAM_CHAT_API_KEY=your_stream_key
    ```

4. **Set up the database**

    ```bash
    # Install Supabase CLI
    npm install -g supabase

    # Link to your project
    supabase link --project-ref your-project-ref

    # Push migrations
    supabase db push
    ```

5. **Start the development server**

    ```bash
    pnpm dev
    ```

6. **Open your browser**

    Navigate to [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

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

## Tech Stack

### Frontend

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Rich Text**: [TipTap](https://tiptap.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Data

- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase PostgreSQL](https://supabase.com/database)
- **State Management**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **API Client**: [Axios](https://axios-http.com/)

### Integrations

- **Maps**: Google Maps API
- **Chat**: Stream Chat
- **CMS**: Ghost
- **Weather**: OpenWeatherMap
- **Media**: Giphy API

### Development

- **Testing**: Jest + React Testing Library
- **Linting**: ESLint
- **Package Manager**: PNPM

## Environment Variables

All environment variables are centralized in `lib/constants/env.ts`. Always use these constants instead of directly accessing `process.env` in your code:

```typescript
// ❌ Bad
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ Good
import { Env } from '@/lib/constants/env';
const apiUrl = Env.NEXT_PUBLIC_API_URL;
```

## Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm tsc

# Lint code
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

### Development Workflow

1. **Ensure you're on the dev branch**

    ```bash
    git checkout dev
    git pull origin dev
    ```

2. **Create a new branch** for your feature/fix

    ```bash
    git checkout -b feature/your-feature-name
    ```

3. **Make your changes** following our coding standards

4. **Run tests** to ensure everything works

    ```bash
    pnpm test
    pnpm tsc
    ```

5. **Commit your changes** with a descriptive message

    ```bash
    git commit -m "feat: add new feature"
    ```

6. **Push and create a Pull Request** to the `dev` branch

## Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation and configuration
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to this project
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines

## API Integration

The application uses a RESTful API for backend communication. API endpoints are proxied through Next.js API routes for security and CORS handling. The backend API should be configured via the `API_PROXY_TARGET` environment variable.

## Contributing

We love contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a Pull Request.

### Quick Contribution Guide

1. Fork the repository
2. Clone and switch to dev branch (`git clone <repo> && cd evento-client && git checkout dev`)
3. Create your feature branch (`git checkout -b feature/AmazingFeature`)
4. Commit your changes (`git commit -m 'feat: add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request to the `dev` branch

**Note:** All PRs should target the `dev` branch, not `main`.

## Community

- **Report bugs** by opening an [issue](https://github.com/sevenlabsxyz/evento-client/issues)
- **Request features** through [GitHub Discussions](https://github.com/sevenlabsxyz/evento-client/discussions)
- **Ask questions** in our community channels

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/) and [Silk UI](https://silkhq.com/)
- Database and auth by [Supabase](https://supabase.com/)
- Bitcoin wallet powered by [Breez SDK](https://breez.technology/)
- Icons by [Lucide](https://lucide.dev/)

## Support

- 📖 **Documentation**: Check our [Setup Guide](SETUP_GUIDE.md)
- 🐛 **Bug Reports**: [Open an issue](https://github.com/sevenlabsxyz/evento-client/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sevenlabsxyz/evento-client/discussions)
- 📧 **Email**: support@evento.so
