"use client";

import type { Endpoint } from '@/types/openapi';
import type { TaggedEndpoints } from '@/lib/openapi-parser';
import { Button } from '@/components/ui/button';
import { MethodBadge } from './method-badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

interface EndpointNavProps {
  taggedEndpoints: TaggedEndpoints[];
  selectedEndpoint: Endpoint | null;
  onSelectEndpoint: (endpoint: Endpoint) => void;
}

export function EndpointNav({ taggedEndpoints, selectedEndpoint, onSelectEndpoint }: EndpointNavProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  if (!taggedEndpoints || taggedEndpoints.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground group-data-[state=collapsed]:hidden">No endpoints found in this specification.</div>;
  }

  const handleSelect = (endpoint: Endpoint) => {
    onSelectEndpoint(endpoint);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="flex flex-col pb-4">
      {taggedEndpoints.map(({ tag, endpoints }) => (
        <div key={tag.name} className="px-2 pt-3">
          <h3 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/55 group-data-[state=collapsed]:text-center">
            <span className="group-data-[state=collapsed]:hidden">{tag.name}</span>
            <span className="hidden group-data-[state=collapsed]:inline">{tag.name.slice(0, 3)}</span>
          </h3>

          <div className="flex flex-col gap-1 group-data-[state=collapsed]:items-center">
            {endpoints.map((endpoint) => {
              const isActive = selectedEndpoint?.operation.operationId === endpoint.operation.operationId && selectedEndpoint?.path === endpoint.path;

              return (
                <TooltipProvider key={`${endpoint.method}-${endpoint.path}`} delayDuration={80}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'h-auto w-full justify-start gap-2 rounded-lg px-2 py-1.5',
                          'group-data-[state=collapsed]:h-10 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-0',
                          'hover:bg-sidebar-accent/70',
                          isActive && 'bg-sidebar-primary/12 text-sidebar-foreground ring-1 ring-sidebar-primary/35'
                        )}
                        onClick={() => handleSelect(endpoint)}
                      >
                        <MethodBadge method={endpoint.method} />
                        <span className="truncate font-code text-xs group-data-[state=collapsed]:hidden">{endpoint.path}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="hidden max-w-xs break-all group-data-[state=collapsed]:block">
                      <div className="flex items-center gap-2">
                        <MethodBadge method={endpoint.method} />
                        <span className="font-code text-xs">{endpoint.path}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
