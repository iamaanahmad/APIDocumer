"use client";

import { useEffect, useRef, useState } from 'react';
import type { TaggedEndpoints } from '@/lib/openapi-parser';
import { getOperationAnchor, getTagAnchor } from '@/lib/operation-utils';
import { MethodBadge } from './method-badge';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface EndpointNavProps {
  taggedEndpoints: TaggedEndpoints[];
  activeAnchor: string;
  onNavigate?: () => void;
}

export function EndpointNav({ taggedEndpoints, activeAnchor, onNavigate }: EndpointNavProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  // Keep the active item visible inside the scrollable sidebar.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeAnchor]);

  if (!taggedEndpoints || taggedEndpoints.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No endpoints found.</div>;
  }

  return (
    <nav aria-label="API endpoints" className="flex flex-col gap-1 pb-6">
      {taggedEndpoints.map(({ tag, endpoints }) => {
        const tagAnchor = getTagAnchor(tag.name);
        const isCollapsed = collapsed[tag.name] ?? false;
        const groupActive = activeAnchor === tagAnchor || endpoints.some((endpoint) => getOperationAnchor(endpoint) === activeAnchor);

        return (
          <div key={tag.name} className="px-2">
            <div className="flex items-center">
              <button
                type="button"
                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${tag.name}`}
                aria-expanded={!isCollapsed}
                onClick={() => setCollapsed((prev) => ({ ...prev, [tag.name]: !isCollapsed }))}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', !isCollapsed && 'rotate-90')} />
              </button>
              <a
                href={`#${tagAnchor}`}
                onClick={onNavigate}
                className={cn(
                  'flex-1 truncate rounded-md px-1.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:text-foreground',
                  groupActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {tag.name}
              </a>
              <span className="pr-2 text-[11px] text-muted-foreground">{endpoints.length}</span>
            </div>

            {!isCollapsed && (
              <ul className="ml-3 space-y-0.5 border-l pl-2">
                {endpoints.map((endpoint) => {
                  const anchor = getOperationAnchor(endpoint);
                  const isActive = anchor === activeAnchor;
                  const label = endpoint.operation.summary || endpoint.path;

                  return (
                    <li key={anchor}>
                      <a
                        ref={isActive ? activeRef : undefined}
                        href={`#${anchor}`}
                        onClick={onNavigate}
                        title={`${endpoint.method.toUpperCase()} ${endpoint.path}`}
                        aria-current={isActive ? 'location' : undefined}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                          isActive ? 'bg-primary/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                        )}
                      >
                        <MethodBadge method={endpoint.method} size="sm" />
                        <span className="truncate">{label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
