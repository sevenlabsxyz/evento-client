import type { Metadata } from 'next';
import McpPageClient from './page-client';

export const metadata: Metadata = {
  title: 'MCP server — Evento',
  description:
    'Connect Evento to Claude Desktop, Cursor, OpenClaw, and other MCP clients. List a user’s events and fetch event details from your AI agent with the Evento public MCP server.',
};

export default function McpPage() {
  return <McpPageClient />;
}
