"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OpenAPISpec } from '@/types/openapi';
import type { TaggedEndpoints } from '@/lib/openapi-parser';
import { countOperations, describeSecurityScheme, getOperationAnchor, getSecuritySchemes, getTagAnchor } from '@/lib/operation-utils';
import { EndpointNav } from '@/components/endpoint-nav';
import { EndpointDisplay } from '@/components/endpoint-display';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { BookOpen, ExternalLink, KeyRound, Menu, Server } from 'lucide-react';
import { MarkdownDisplay } from './markdown-display';
import { ThemeToggle } from './theme-toggle';
import { SearchEndpoints } from './search-endpoints';
import { AskAIButton } from './ask-ai-button';
import { cn } from '@/lib/utils';

const LANG_STORAGE_KEY = 'apidocumer:snippet-lang';

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

function Overview({ spec, taggedEndpoints }: { spec: OpenAPISpec; taggedEndpoints: TaggedEndpoints[] }) {
  const logo = getSpecLogo(spec);
  const securitySchemes = getSecuritySchemes(spec);

  return (
    <section id="overview" className="scroll-mt-20 space-y-8 pb-10" aria-labelledby="overview-title">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-code">v{spec.info.version}</Badge>
          <Badge variant="outline" className="font-code">OpenAPI {spec.openapi}</Badge>
          <Badge variant="outline">{countOperations(spec)} endpoints</Badge>
        </div>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo.url} alt={logo.altText || `${spec.info.title} logo`} className="h-12 max-w-[200px] object-contain" loading="eager" />
        )}
        <h1 id="overview-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {spec.info.title}
        </h1>
        <MarkdownDisplay content={spec.info.description} className="prose-base max-w-3xl" />
        {spec.externalDocs?.url && (
          <a href={spec.externalDocs.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ExternalLink className="h-4 w-4" />
            {spec.externalDocs.description || 'External documentation'}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {spec.servers && spec.servers.length > 0 && (
          <div className="rounded-xl border bg-card/60 p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-muted-foreground" />
              Base URLs
            </h2>
            <ul className="space-y-2">
              {spec.servers.map((server) => (
                <li key={server.url} className="space-y-0.5">
                  <code className="break-all rounded bg-secondary/60 px-2 py-1 font-code text-xs sm:text-sm">{server.url}</code>
                  {server.description && <p className="text-xs text-muted-foreground">{server.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {securitySchemes.length > 0 && (
          <div className="rounded-xl border bg-card/60 p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Authentication
            </h2>
            <ul className="space-y-3">
              {securitySchemes.map(({ name, scheme }) => (
                <li key={name} className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-code text-sm font-semibold">{name}</span>
                    <span className="text-xs text-muted-foreground">{describeSecurityScheme(scheme)}</span>
                  </div>
                  <MarkdownDisplay content={scheme.description} className="prose-p:my-0 prose-p:text-[13px]" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {taggedEndpoints.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Resources</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {taggedEndpoints.map(({ tag, endpoints }) => (
              <a
                key={tag.name}
                href={`#${getTagAnchor(tag.name)}`}
                className="group rounded-xl border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-xs text-muted-foreground">{endpoints.length}</span>
                </div>
                {tag.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tag.description}</p>}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function DocViewer({ initialSpec, initialTaggedEndpoints }: { initialSpec: OpenAPISpec | null; initialTaggedEndpoints: TaggedEndpoints[] }) {
  const specLogo = getSpecLogo(initialSpec);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState('overview');
  const [snippetLang, setSnippetLang] = useState('');

  const anchorIds = useMemo(
    () => [
      'overview',
      ...initialTaggedEndpoints.flatMap(({ tag, endpoints }) => [getTagAnchor(tag.name), ...endpoints.map((endpoint) => getOperationAnchor(endpoint))]),
    ],
    [initialTaggedEndpoints]
  );

  const filteredTaggedEndpoints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return initialTaggedEndpoints;

    return initialTaggedEndpoints
      .map((group) => ({
        ...group,
        endpoints: group.endpoints.filter(
          (endpoint) =>
            endpoint.path.toLowerCase().includes(query) ||
            endpoint.method.toLowerCase().includes(query) ||
            endpoint.operation.summary?.toLowerCase().includes(query) ||
            endpoint.operation.description?.toLowerCase().includes(query) ||
            endpoint.operation.operationId?.toLowerCase().includes(query) ||
            group.tag.name.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.endpoints.length > 0);
  }, [initialTaggedEndpoints, searchQuery]);

  // Restore the preferred snippet language.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (stored) setSnippetLang(stored);
    } catch {
      // Storage can be unavailable (private mode); the default language is used.
    }
  }, []);

  const handleSnippetLangChange = useCallback((lang: string) => {
    setSnippetLang(lang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  // Scroll-spy: highlight the section nearest the top of the viewport.
  useEffect(() => {
    const fromHash = decodeURIComponent(window.location.hash.replace('#', ''));
    if (fromHash && anchorIds.includes(fromHash)) setActiveAnchor(fromHash);

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        const current = anchorIds.find((id) => visible.has(id));
        if (current) setActiveAnchor(current);
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 }
    );

    anchorIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [anchorIds]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const navContent = (onNavigate?: () => void) => (
    <>
      <div className="space-y-2 p-3">
        <SearchEndpoints value={searchQuery} onChange={setSearchQuery} />
        <a
          href="#overview"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
            activeAnchor === 'overview' ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Overview
        </a>
      </div>
      <EndpointNav taggedEndpoints={filteredTaggedEndpoints} activeAnchor={activeAnchor} onNavigate={onNavigate} />
      {filteredTaggedEndpoints.length === 0 && searchQuery && (
        <div className="p-4 text-center text-sm text-muted-foreground">No endpoints found for &quot;{searchQuery}&quot;</div>
      )}
    </>
  );

  return (
    <div className="docs-page-bg min-h-screen">
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b px-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
          <a href="#overview" className="flex min-w-0 items-center gap-2">
            {specLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={specLogo.url} alt={specLogo.altText || `${initialSpec?.info.title || 'API'} logo`} className="h-7 w-7 shrink-0 rounded-sm object-contain" loading="eager" />
            ) : (
              <BookOpen className="h-5 w-5 shrink-0 text-primary" />
            )}
            <span className="truncate text-sm font-semibold sm:text-base">{initialSpec?.info?.title || 'API Documentation'}</span>
          </a>
          {initialSpec?.info?.version && (
            <Badge variant="secondary" className="hidden font-code sm:inline-flex">
              v{initialSpec.info.version}
            </Badge>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <AskAIButton spec={initialSpec} />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r bg-background/60 lg:block xl:w-80" aria-label="Sidebar">
          {navContent()}
        </aside>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Browse API endpoints by resource.</SheetDescription>
            <div className="pt-8">{navContent(closeMobileNav)}</div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {initialSpec ? (
              <>
                <Overview spec={initialSpec} taggedEndpoints={initialTaggedEndpoints} />
                {initialTaggedEndpoints.map(({ tag, endpoints }) => {
                  const tagAnchor = getTagAnchor(tag.name);
                  return (
                    <section key={tag.name} id={tagAnchor} className="scroll-mt-20 border-t pt-10" aria-labelledby={`${tagAnchor}-title`}>
                      <div className="mb-2 space-y-2">
                        <h2 id={`${tagAnchor}-title`} className="text-2xl font-bold tracking-tight sm:text-3xl">
                          {tag.name}
                        </h2>
                        <MarkdownDisplay content={tag.description} className="max-w-3xl" />
                      </div>
                      {endpoints.map((endpoint) => (
                        <EndpointDisplay
                          key={getOperationAnchor(endpoint)}
                          endpoint={endpoint}
                          spec={initialSpec}
                          snippetLang={snippetLang}
                          onSnippetLangChange={handleSnippetLangChange}
                        />
                      ))}
                    </section>
                  );
                })}
              </>
            ) : (
              <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
                <Card className="docs-panel w-full text-center">
                  <CardHeader>
                    <CardTitle>Specification Not Found</CardTitle>
                    <CardDescription>Could not load `public/openapi.yaml`. Add a valid OpenAPI spec and redeploy.</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
          </main>

          <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
            Powered by{' '}
            <a href="https://github.com/iamaanahmad/APIDocumer" className="font-medium text-foreground/90 underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
              APIDocumer
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
