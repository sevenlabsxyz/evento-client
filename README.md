# Evento - Social Events Management Platform

<div align="center">

![Evento Logo](public/assets/pwa/icon@256px.png)

<div>
Create Events. Connect People. Build Communities.
</div>
</div>

## Overview

Evento is a modern, social-first event management platform. It's designed to make event organizing friction-free and fun, whether you're bringing together five friends or five hundred attendees. It features a built-in Bitcoin Lightning wallet allowing for frictionless movement of money between event goers and hosts.

This README is kept intentionally high-level and focused on local development basics.

### Key Features

- 🎉 **Seamless Event Creation** - Intuitive event builder with rich text editing
- 👥 **Interactive Guest Management** - RSVP tracking, check-ins\*, and guest lists
- 🎨 **Beautiful UI** - Modern, responsive design with minimalistic branding
- ⚡ **Bitcoin Wallet** - In-app Bitcoin wallet powered by Breez SDK for Lightning payments
- 📧 **Email Communications** - Targeted email blasts with scheduling
- 📍 **Location Services** - Google Maps integration with dynamic location display
- 🎵 **Music Integration** - Embed playlists from Spotify and Wavlake
- 📸 **Event Gallery** - Share and react to event photos
- 💬 **Live Chat** - Real-time messaging for DMs and group chats\*

## Quick Start

### Prerequisites

- **Node.js** 18.x or later
- **PNPM** package manager
- **Supabase** account
- **Google Maps API** key

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

    Then edit `.env.local` and fill in the required values:
    - `NEXT_PUBLIC_API_URL` — Backend API endpoint
    - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
    - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps API key
    - `NEXT_PUBLIC_GIPHY_API_KEY` — GIPHY API key
    - `NEXT_PUBLIC_STREAM_CHAT_API_KEY` — Stream Chat API key
    - `NEXT_PUBLIC_BREEZ_API_KEY` — Breez SDK API key (request from [breez.technology](https://breez.technology/request-api-key))

    See `.env.example` for the full list of available variables.

4. **Start the development server**

    ```bash
    pnpm dev
    ```

5. **Open your browser**

    Navigate to [http://localhost:3003](http://localhost:3003)

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

1. **Ensure you're on the main branch**

    ```bash
    git checkout main
    git pull origin main
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

6. **Push and create a Pull Request** to the `main` branch

## API Integration

The application uses a RESTful API for backend communication. API endpoints are proxied through Next.js API routes for security and CORS handling.

## Contributing

We love contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a Pull Request.

### Quick Contribution Guide

1. Fork the repository
2. Clone and switch to main branch (`git clone <repo> && cd evento-client && git checkout main`)
3. Create your feature branch (`git checkout -b feature/AmazingFeature`)
4. Commit your changes (`git commit -m 'feat: add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request to the `main` branch

**Note:** All PRs should target the `main` branch.

## Community

- **Report bugs** by opening an [issue](https://github.com/sevenlabsxyz/evento-client/issues)

## License

This project is licensed under the GNU License - see the [LICENSE](LICENSE) file for details.
