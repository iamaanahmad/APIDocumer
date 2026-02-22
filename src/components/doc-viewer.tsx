"use client";

import { useState, useMemo } from 'react';
import type { OpenAPISpec, Endpoint } from '@/types/openapi';
import type { TaggedEndpoints } from '@/lib/openapi-parser';
import { EndpointNav } from '@/components/endpoint-nav';
import { EndpointDisplay } from '@/components/endpoint-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Menu, BookOpen, Server, Tag, Route } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar';
import { MarkdownDisplay } from './markdown-display';
import { ThemeToggle } from './theme-toggle';
import { SearchEndpoints } from './search-endpoints';

interface OpenApiLogo {
  url: string;
  altText?: string;
}

function getSpecLogo(spec: OpenAPISpec | null): OpenApiLogo | null {
  if (!spec) return null;
  const logo = spec.info['x-logo'];
  if (!logo?.url) return null;
  return logo;
}

function WelcomeDisplay({ spec }: { spec: OpenAPISpec }) {
  const logo = getSpecLogo(spec);
  const endpointCount = Object.values(spec.paths).reduce((total, item) => {
    return total + Object.keys(item).filter((method) => ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)).length;
  }, 0);

  return (
    <div className="space-y-6 animate-[fadeIn_220ms_ease-out]">
      <Card className="docs-panel border-primary/20 overflow-hidden">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-code">
              OpenAPI {spec.openapi}
            </Badge>
            <Badge variant="outline" className="font-code">
              v{spec.info.version}
            </Badge>
          </div>
          <div className="space-y-2">
            {logo && (
              <div className="mb-3 flex items-center">
                <img
                  src={logo.url}
                  alt={logo.altText || `${spec.info.title} logo`}
                  className="h-12 max-w-[180px] rounded-md object-contain bg-background/70 p-1"
                  loading="eager"
                />
              </div>
            )}
            <CardTitle className="text-3xl md:text-4xl tracking-tight">{spec.info.title}</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Interactive API reference with responsive navigation, request/response schemas, and production-ready snippets.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <MarkdownDisplay content={spec.info.description} className="text-muted-foreground" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Operations</p>
              <p className="mt-1 text-2xl font-semibold">{endpointCount}</p>
            </div>
            <div className="rounded-lg border bg-card/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Tags</p>
              <p className="mt-1 text-2xl font-semibold">{spec.tags?.length || 0}</p>
            </div>
            <div className="rounded-lg border bg-card/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Servers</p>
              <p className="mt-1 text-2xl font-semibold">{spec.servers?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="docs-panel">
        <CardContent className="py-6 text-sm text-muted-foreground">
          Select an endpoint from the sidebar to view parameters, schemas, responses, and generated code snippets.
        </CardContent>
      </Card>
    </div>
  );
}

export function DocViewer({ initialSpec, initialTaggedEndpoints }: { initialSpec: OpenAPISpec | null; initialTaggedEndpoints: TaggedEndpoints[] }) {
  const specLogo = getSpecLogo(initialSpec);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTaggedEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return initialTaggedEndpoints;

    const query = searchQuery.toLowerCase();
    return initialTaggedEndpoints
      .map((group) => ({
        ...group,
        endpoints: group.endpoints.filter((endpoint) => {
          return (
            endpoint.path.toLowerCase().includes(query) ||
            endpoint.method.toLowerCase().includes(query) ||
            endpoint.operation.summary?.toLowerCase().includes(query) ||
            endpoint.operation.description?.toLowerCase().includes(query) ||
            group.tag.name.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((group) => group.endpoints.length > 0);
  }, [initialTaggedEndpoints, searchQuery]);

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border/80">
        <SidebarHeader className="border-b h-16 flex items-center justify-center p-2">
          <div className="flex w-full items-center gap-2 rounded-md border border-sidebar-border/70 bg-sidebar-accent/30 px-2 py-2 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:border-0 group-data-[state=collapsed]:bg-transparent">
            {specLogo ? (
              <img
                src={specLogo.url}
                alt={specLogo.altText || `${initialSpec?.info.title || 'API'} logo`}
                className="h-6 w-6 flex-shrink-0 rounded-sm object-contain"
                loading="eager"
              />
            ) : (
              <BookOpen className="h-5 w-5 flex-shrink-0" />
            )}
            <h2 className="text-sm font-semibold tracking-wide group-data-[state=collapsed]:hidden">APIDocumer</h2>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <div className="space-y-2 p-2 group-data-[state=collapsed]:hidden">
            <SearchEndpoints value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="mx-2 h-px bg-sidebar-border" />

          <EndpointNav taggedEndpoints={filteredTaggedEndpoints} selectedEndpoint={selectedEndpoint} onSelectEndpoint={setSelectedEndpoint} />

          {filteredTaggedEndpoints.length === 0 && searchQuery && (
            <div className="p-4 text-center text-sm text-muted-foreground group-data-[state=collapsed]:hidden">No endpoints found for "{searchQuery}"</div>
          )}
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="docs-page-bg">
        <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="md:hidden">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            {specLogo && (
              <img
                src={specLogo.url}
                alt={specLogo.altText || `${initialSpec?.info.title || 'API'} logo`}
                className="h-7 w-7 flex-shrink-0 rounded-sm object-contain md:hidden"
                loading="eager"
              />
            )}
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold md:text-lg">{initialSpec?.info.title || 'APIDocumer'}</h1>
              <p className="hidden text-xs text-muted-foreground md:block">Modern, searchable OpenAPI documentation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {initialSpec?.servers?.[0] && (
              <Badge variant="outline" className="hidden max-w-[22rem] items-center gap-1 truncate md:flex">
                <Server className="h-3 w-3" />
                <span className="truncate">{initialSpec.servers[0].url}</span>
              </Badge>
            )}
            {initialSpec?.openapi && (
              <Badge variant="secondary" className="hidden items-center gap-1 md:flex">
                <Route className="h-3 w-3" />
                {initialSpec.openapi}
              </Badge>
            )}
            {initialSpec?.tags?.length ? (
              <Badge variant="secondary" className="hidden items-center gap-1 lg:flex">
                <Tag className="h-3 w-3" />
                {initialSpec.tags.length} tags
              </Badge>
            ) : null}
            <ThemeToggle />
            <SidebarTrigger className="hidden md:inline-flex" />
          </div>
        </header>

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 xl:px-10 2xl:px-14">
          {selectedEndpoint && initialSpec ? (
            <EndpointDisplay endpoint={selectedEndpoint} spec={initialSpec} />
          ) : initialSpec ? (
            <WelcomeDisplay spec={initialSpec} />
          ) : (
            <div className="mx-auto flex h-full min-h-[60vh] max-w-xl items-center justify-center">
              <Card className="docs-panel w-full text-center">
                <CardHeader>
                  <CardTitle>Specification Not Found</CardTitle>
                  <CardDescription>Could not load `public/openapi.yaml`. Add a valid OpenAPI spec and redeploy.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
        </main>
        <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground md:px-6">
          Powered by <span className="font-medium text-foreground/90">APIDocumer</span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
