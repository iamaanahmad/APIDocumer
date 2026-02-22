"use client";

import { useState, useMemo } from 'react';
import yaml from 'js-yaml';
import type { OpenAPISpec, Endpoint } from '@/types/openapi';
import { getTaggedEndpoints, TaggedEndpoints } from '@/lib/openapi-parser';
import { EndpointNav } from '@/components/endpoint-nav';
import { EndpointDisplay } from '@/components/endpoint-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Loader2, Menu, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar';
import { MarkdownDisplay } from './markdown-display';
import { ThemeToggle } from './theme-toggle';
import { SearchEndpoints } from './search-endpoints';

function WelcomeDisplay({ info }: { info: OpenAPISpec['info'] }) {
    return (
        <div className="flex items-center justify-center h-full -mt-16">
            <Card className="w-full max-w-2xl border-dashed">
                <CardHeader className="items-center text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground" />
                    <CardTitle className="text-4xl pt-2 font-bold gradient-text">{info.title}</CardTitle>
                    <CardDescription>Version {info.version}</CardDescription>
                </CardHeader>
                <CardContent>
                    <MarkdownDisplay content={info.description} className="text-center mb-6 text-muted-foreground" />
                    <div className="mt-6 pt-6 border-t">
                        <p className="text-sm text-muted-foreground text-center">👈 Select an endpoint from the sidebar to view its documentation</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function DocViewer({ initialSpec, initialTaggedEndpoints }: { initialSpec: OpenAPISpec | null, initialTaggedEndpoints: TaggedEndpoints[] }) {
  const [spec, setSpec] = useState<OpenAPISpec | null>(initialSpec);
  const [taggedEndpoints, setTaggedEndpoints] = useState<TaggedEndpoints[]>(initialTaggedEndpoints);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialSpec ? null : "Could not load 'openapi.yaml'. Please upload a file.");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      setError(null);
      setSelectedEndpoint(null);
      setSearchQuery('');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let loadedSpec;
          if (file.name.endsWith('.json')) {
            loadedSpec = JSON.parse(content);
          } else {
            loadedSpec = yaml.load(content) as OpenAPISpec;
          }

          if (!loadedSpec.openapi || !loadedSpec.info || !loadedSpec.paths) {
            throw new Error("Invalid OpenAPI file format.");
          }
          setSpec(loadedSpec);
          setTaggedEndpoints(getTaggedEndpoints(loadedSpec));
        } catch (err: any) {
          setError(`Error parsing file: ${err.message}`);
          console.error(err);
          setSpec(null);
          setTaggedEndpoints([]);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  // Filter endpoints based on search query
  const filteredTaggedEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return taggedEndpoints;
    
    const query = searchQuery.toLowerCase();
    return taggedEndpoints.map(group => ({
      ...group,
      endpoints: group.endpoints.filter(endpoint => 
        endpoint.path.toLowerCase().includes(query) ||
        endpoint.method.toLowerCase().includes(query) ||
        endpoint.operation.summary?.toLowerCase().includes(query) ||
        endpoint.operation.description?.toLowerCase().includes(query) ||
        group.tag.toLowerCase().includes(query)
      )
    })).filter(group => group.endpoints.length > 0);
  }, [taggedEndpoints, searchQuery]);

  return (
    <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b h-14 flex items-center justify-center p-2">
              <div className="flex items-center gap-2 group-data-[state=collapsed]:justify-center">
                  <BookOpen className="w-6 h-6 flex-shrink-0" />
                  <h2 className="text-lg font-bold group-data-[state=collapsed]:hidden gradient-text">APIDocumer</h2>
              </div>
          </SidebarHeader>
          <SidebarContent>
              <div className="p-2">
                  <label htmlFor="file-upload" className="w-full">
                    <Button variant="outline" className="w-full justify-center group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10 transition-smooth hover:border-primary">
                        <FileUp />
                        <span className="group-data-[state=collapsed]:hidden">Upload File</span>
                    </Button>
                  </label>
                  <input id="file-upload" type="file" accept=".yaml,.yml,.json" className="hidden" onChange={handleFileChange} />
              </div>
              {taggedEndpoints.length > 0 && (
                <>
                  <div className="px-2 pb-2 group-data-[state=collapsed]:hidden">
                    <SearchEndpoints value={searchQuery} onChange={setSearchQuery} />
                  </div>
                  <div className="px-2 w-auto mx-2 h-px bg-border"/>
                </>
              )}
              <EndpointNav 
                  taggedEndpoints={filteredTaggedEndpoints}
                  selectedEndpoint={selectedEndpoint}
                  onSelectEndpoint={setSelectedEndpoint} 
              />
              {filteredTaggedEndpoints.length === 0 && searchQuery && (
                <div className="p-4 text-center text-sm text-muted-foreground group-data-[state=collapsed]:hidden">
                  No endpoints found matching "{searchQuery}"
                </div>
              )}
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b sticky top-0 glass z-10 shadow-sm">
              <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden">
                      <Menu />
                  </SidebarTrigger>
                  <h1 className="text-lg font-bold gradient-text">
                      {spec?.info.title || 'APIDocumer'}
                  </h1>
              </div>
              <div className="flex items-center gap-2">
                  <ThemeToggle />
              <SidebarTrigger>
                      <Menu className="hidden lg:block" />
              </SidebarTrigger>
              </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading specification...</p>
                </div>
              ) : error ? (
                  <div className="flex items-center justify-center h-full">
                      <Card className="w-full max-w-lg shadow-professional">
                          <CardHeader>
                              <CardTitle className="text-destructive">Error Loading Specification</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <p className="text-destructive">{error}</p>
                              <p className="text-muted-foreground mt-2">Please try uploading a valid OpenAPI v3 YAML or JSON file.</p>
                          </CardContent>
                      </Card>
                  </div>
              ) : selectedEndpoint && spec ? (
                <EndpointDisplay endpoint={selectedEndpoint} spec={spec} />
              ) : spec ? (
                <WelcomeDisplay info={spec.info} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Card className="w-full max-w-lg text-center shadow-professional">
                    <CardHeader><CardTitle>No API Specification Loaded</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Please upload an OpenAPI v3 specification file to begin.</p>
                        <label htmlFor="file-upload-main" className="w-full">
                          <Button variant="default" className="w-full mt-4 transition-smooth">
                              <FileUp /> Upload File
                          </Button>
                        </label>
                        <input id="file-upload-main" type="file" accept=".yaml,.yml,.json" className="hidden" onChange={handleFileChange} />
                    </CardContent>
                  </Card>
                </div>
              )}
          </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
