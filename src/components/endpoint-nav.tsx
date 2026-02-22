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
    return (
        <div className="p-4 text-sm text-muted-foreground group-data-[state=collapsed]:hidden">
            No endpoints found in the specification.
        </div>
    );
  }

  const handleSelect = (endpoint: Endpoint) => {
    onSelectEndpoint(endpoint);
    if (isMobile) {
      setOpenMobile(false);
    }
  }
  
  return (
    <div className="flex flex-col">
      {taggedEndpoints.map(({ tag, endpoints }) => (
        <div key={tag.name} className="p-2">
            <h3 className="px-2 mb-1 text-xs font-semibold tracking-wider uppercase text-sidebar-foreground/50 group-data-[state=collapsed]:text-center group-data-[state=collapsed]:mb-2">
              <span className="group-data-[state=collapsed]:hidden">{tag.name}</span>
              <span className="hidden group-data-[state=collapsed]:block">{tag.name.slice(0,3)}</span>
            </h3>
            <div className="flex flex-col gap-1 group-data-[state=collapsed]:items-center">
              {endpoints.map((endpoint) => (
                <TooltipProvider key={`${endpoint.method}-${endpoint.path}`} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "justify-start gap-2 h-auto py-1.5 px-2",
                          "group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-0",
                          selectedEndpoint?.operation.operationId === endpoint.operation.operationId && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                        onClick={() => handleSelect(endpoint)}
                      >
                        <MethodBadge method={endpoint.method} />
                        <span className="truncate font-mono text-sm group-data-[state=collapsed]:hidden">{endpoint.path}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="hidden group-data-[state=collapsed]:block">
                        <div className="flex items-center gap-2 max-w-xs break-all">
                            <MethodBadge method={endpoint.method} />
                            <span className="font-mono">{endpoint.path}</span>
                        </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
        </div>
      ))}
    </div>
  );
}
