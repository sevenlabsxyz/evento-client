/**
 * Environment variables centralized in a single file for better maintainability
 * Use these constants instead of directly accessing process.env throughout the app
 */

export const Env = {
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // API URLs
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://evento.so/api',
  API_PROXY_TARGET: process.env.API_PROXY_TARGET || 'http://localhost:3002/api',

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Ghost CMS
  NEXT_PUBLIC_GHOST_URL: process.env.NEXT_PUBLIC_GHOST_URL || '',
  NEXT_PUBLIC_GHOST_CONTENT_API_KEY: process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY || '',

  // Giphy
  NEXT_PUBLIC_GIPHY_API_KEY: process.env.NEXT_PUBLIC_GIPHY_API_KEY || '',

  // Google Maps
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  // OpenWeatherMap
  NEXT_PUBLIC_OPENWEATHERMAP_API_KEY: process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || '',

  // Stream Chat
  NEXT_PUBLIC_STREAM_CHAT_API_KEY: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY || '',

  // Breez SDK
  NEXT_PUBLIC_BREEZ_API_KEY: process.env.NEXT_PUBLIC_BREEZ_API_KEY || '',

  // Beta Access
  NEXT_PUBLIC_BETA_ACCESS_CODE: process.env.NEXT_PUBLIC_BETA_ACCESS_CODE || '',
} as const;

// Type representing all environment variable keys
export type EnvKey = keyof typeof Env;
