'use client';

import { McpCtaBand } from '@/components/developers/mcp/mcp-cta-band';
import { McpExampleChat } from '@/components/developers/mcp/mcp-example-chat';
import { McpFlowDiagram } from '@/components/developers/mcp/mcp-flow-diagram';
import { McpHero } from '@/components/developers/mcp/mcp-hero';
import { McpSetupSection } from '@/components/developers/mcp/mcp-setup-section';
import { McpSkillCard } from '@/components/developers/mcp/mcp-skill-card';
import { McpToolsGrid } from '@/components/developers/mcp/mcp-tools-grid';
import { McpTroubleshooting } from '@/components/developers/mcp/mcp-troubleshooting';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useEffect } from 'react';

const MCP_PATHNAME = '/e/mcp';

export default function McpPageClient() {
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  useEffect(() => {
    applyRouteConfig(MCP_PATHNAME);

    setTopBarForRoute(MCP_PATHNAME, {
      title: 'MCP',
      subtitle: '',
      leftMode: 'menu',
      centerMode: 'title',
      showAvatar: true,
      desktopHidden: true,
      isOverlaid: false,
      buttons: [],
      badge: undefined,
    });

    return () => {
      clearRoute(MCP_PATHNAME);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute]);

  return (
    <div className='min-h-full w-full bg-white dark:bg-neutral-900'>
      <div className='mx-auto w-full max-w-7xl space-y-16 px-4 pb-40 pt-4 md:space-y-24 md:px-8 md:pb-16 md:pt-8'>
        <McpHero />
        <McpFlowDiagram />
        <McpSetupSection />
        <McpToolsGrid />
        <McpExampleChat />
        <McpSkillCard />
        <McpTroubleshooting />
        <McpCtaBand />
      </div>
    </div>
  );
}
