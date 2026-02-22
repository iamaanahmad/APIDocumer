"use client";

import type { OpenAPISpec, Endpoint, ParameterObject, ResponseObject, ReferenceObject } from '@/types/openapi';
import { resolveRef } from '@/lib/openapi-parser';
import { generateCurl } from '@/lib/curl-generator';
import { generateExampleFromSchema } from '@/lib/example-generator';
import { MethodBadge } from '@/components/method-badge';
import { SchemaDisplay } from '@/components/schema-display';
import { CodeBlock } from '@/components/code-block';
import { MarkdownDisplay } from '@/components/markdown-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Globe, Hash, KeyRound, Lock, ShieldCheck } from 'lucide-react';

interface EndpointDisplayProps {
  endpoint: Endpoint;
  spec: OpenAPISpec;
}

interface VendorCodeSample {
  lang: string;
  source: string;
}

function inferSnippetLanguage(label: string): string {
  const value = label.toLowerCase();
  if (value.includes('curl')) return 'bash';
  if (value.includes('javascript') || value.includes('js')) return 'javascript';
  if (value.includes('typescript') || value.includes('ts')) return 'typescript';
  if (value.includes('python') || value.includes('py')) return 'python';
  if (value.includes('php')) return 'php';
  if (value.includes('java')) return 'java';
  if (value.includes('go') || value.includes('golang')) return 'go';
  return 'bash';
}

function buildFetchSnippet(endpoint: Endpoint, spec: OpenAPISpec, requestBodyExample?: unknown) {
  const server = spec.servers?.[0]?.url || 'https://api.example.com';
  const url = `${server}${endpoint.path}`;
  const method = endpoint.method.toUpperCase();

  const lines = [
    `const response = await fetch('${url}', {`,
    `  method: '${method}',`,
    `  headers: {`,
    `    'Content-Type': 'application/json',`,
    `    'x-api-key': process.env.API_KEY || 'YOUR_API_KEY',`,
    `  },`,
  ];

  if (requestBodyExample !== undefined) {
    lines.push(`  body: JSON.stringify(${JSON.stringify(requestBodyExample, null, 2)}),`);
  }

  lines.push('});');
  lines.push('const data = await response.json();');
  lines.push('console.log(data);');

  return lines.join('\n');
}

function getResolvedParameters(operation: Endpoint['operation'], spec: OpenAPISpec): ParameterObject[] {
  return (
    operation.parameters
      ?.map((parameter) => ('$ref' in parameter ? resolveRef(spec, parameter.$ref) : parameter))
      .filter((parameter): parameter is ParameterObject => Boolean(parameter && typeof parameter === 'object' && 'in' in parameter && 'name' in parameter)) ||
    []
  );
}

function getResolvedResponse(response: ResponseObject | ReferenceObject, spec: OpenAPISpec): ResponseObject | null {
  if ('$ref' in response) {
    const resolved = resolveRef(spec, response.$ref);
    return resolved && typeof resolved === 'object' ? (resolved as ResponseObject) : null;
  }
  return response;
}

function getRequestBody(operation: Endpoint['operation'], spec: OpenAPISpec) {
  if (!operation.requestBody) return null;
  if ('$ref' in operation.requestBody) {
    return resolveRef(spec, operation.requestBody.$ref);
  }
  return operation.requestBody;
}

export function EndpointDisplay({ endpoint, spec }: EndpointDisplayProps) {
  const { method, path, operation } = endpoint;
  const effectiveSecurity = operation.security ?? spec.security ?? [];

  const parameters = getResolvedParameters(operation, spec);
  const pathParams = parameters.filter((param) => param.in === 'path');
  const queryParams = parameters.filter((param) => param.in === 'query');
  const headerParams = parameters.filter((param) => param.in === 'header');

  const requestBody = getRequestBody(operation, spec);
  const requestMediaTypes = requestBody?.content ? Object.keys(requestBody.content) : [];
  const preferredRequestMediaType = requestMediaTypes.includes('application/json') ? 'application/json' : requestMediaTypes[0];
  const requestSchema = preferredRequestMediaType ? requestBody?.content?.[preferredRequestMediaType]?.schema : undefined;

  const requestBodyExample = requestSchema ? generateExampleFromSchema(requestSchema, spec) : undefined;

  const curlExample = generateCurl(endpoint, spec);
  const jsExample = buildFetchSnippet(endpoint, spec, requestBodyExample);
  const providedCodeSamples = (operation['x-code-samples'] || []).filter(
    (sample): sample is VendorCodeSample => Boolean(sample?.lang && sample?.source)
  );
  const snippetTabs = providedCodeSamples.length
    ? providedCodeSamples.map((sample, index) => ({
        key: `sample-${index}`,
        label: sample.lang,
        language: inferSnippetLanguage(sample.lang),
        code: sample.source,
      }))
    : [
        { key: 'curl', label: 'cURL', language: 'bash', code: curlExample },
        { key: 'js', label: 'JavaScript', language: 'javascript', code: jsExample },
      ];

  const responses = operation.responses || {};
  const responseKeys = Object.keys(responses).sort();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
      <section className="space-y-6">
        <Card className="docs-panel">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <MethodBadge method={method} />
              <code className="rounded-md border bg-secondary/40 px-3 py-1 font-code text-sm md:text-base">{path}</code>
            </div>
            {operation.summary && <CardTitle className="text-2xl md:text-3xl tracking-tight">{operation.summary}</CardTitle>}
            {operation.description && <MarkdownDisplay content={operation.description} className="text-muted-foreground" />}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {operation.operationId && (
                <Badge variant="outline" className="gap-1">
                  <Hash className="h-3 w-3" />
                  {operation.operationId}
                </Badge>
              )}
              {operation.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>
        </Card>

        {(pathParams.length > 0 || queryParams.length > 0 || headerParams.length > 0) && (
          <Card className="docs-panel">
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
              <CardDescription>Path, query, and header values supported by this endpoint.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pathParams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Path Parameters</h4>
                  <ParametersTable parameters={pathParams} />
                </div>
              )}
              {queryParams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Query Parameters</h4>
                  <ParametersTable parameters={queryParams} />
                </div>
              )}
              {headerParams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Header Parameters</h4>
                  <ParametersTable parameters={headerParams} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {requestBody && requestBody.content && (
          <Card className="docs-panel">
            <CardHeader>
              <CardTitle>Request Body</CardTitle>
              {requestBody.description && (
                <CardDescription>
                  <MarkdownDisplay content={requestBody.description} />
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {requestMediaTypes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {requestMediaTypes.map((mediaType) => (
                    <Badge key={mediaType} variant={mediaType === preferredRequestMediaType ? 'default' : 'outline'}>
                      {mediaType}
                    </Badge>
                  ))}
                </div>
              )}
              {requestSchema && <SchemaDisplay name="Request Body" schema={requestSchema} spec={spec} />}
              {requestBodyExample !== undefined && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Example Request</h4>
                  <CodeBlock code={JSON.stringify(requestBodyExample, null, 2)} language="json" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {responseKeys.length > 0 && (
          <Card className="docs-panel">
            <CardHeader>
              <CardTitle>Responses</CardTitle>
              <CardDescription>Schema and example payloads by HTTP status code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={responseKeys[0]} className="w-full">
                <TabsList className="mb-4 h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
                  {responseKeys.map((statusCode) => (
                    <TabsTrigger key={statusCode} value={statusCode} className="rounded-md border bg-card px-3 py-1.5">
                      {statusCode}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {responseKeys.map((statusCode) => {
                  const responseValue = responses[statusCode];
                  if (!responseValue) return null;

                  const response = getResolvedResponse(responseValue, spec);
                  if (!response) return null;

                  const responseMediaTypes = response.content ? Object.keys(response.content) : [];
                  const preferredResponseMediaType = responseMediaTypes.includes('application/json') ? 'application/json' : responseMediaTypes[0];
                  const responseSchema = preferredResponseMediaType ? response.content?.[preferredResponseMediaType]?.schema : undefined;
                  const responseExample = responseSchema ? generateExampleFromSchema(responseSchema, spec) : undefined;

                  return (
                    <TabsContent key={statusCode} value={statusCode} className="space-y-4">
                      <MarkdownDisplay content={response.description} className="text-sm text-muted-foreground" />

                      {responseMediaTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {responseMediaTypes.map((mediaType) => (
                            <Badge key={mediaType} variant={mediaType === preferredResponseMediaType ? 'default' : 'outline'}>
                              {mediaType}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {responseSchema && <SchemaDisplay name={`Response (${statusCode})`} schema={responseSchema} spec={spec} />}

                      {responseExample !== undefined && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Example Response</h4>
                          <CodeBlock code={JSON.stringify(responseExample, null, 2)} language="json" />
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </section>

      <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <Card className="docs-panel">
          <CardHeader>
            <CardTitle>Code Snippets</CardTitle>
            <CardDescription>
              {providedCodeSamples.length > 0
                ? 'Provided by the OpenAPI specification.'
                : 'Production-ready templates generated from the spec.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={snippetTabs[0].key} className="w-full">
              <TabsList className="mb-3 flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                {snippetTabs.map((snippet) => (
                  <TabsTrigger key={snippet.key} value={snippet.key} className="rounded-md border bg-card px-3 py-1.5">
                    {snippet.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {snippetTabs.map((snippet) => (
                <TabsContent key={snippet.key} value={snippet.key} className="mt-0">
                  <CodeBlock code={snippet.code} language={snippet.language} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="docs-panel">
          <CardHeader>
            <CardTitle>Operation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Server</p>
                <p className="text-muted-foreground break-all">{spec.servers?.[0]?.url || 'Not defined in spec'}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-2">
              <KeyRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Authentication</p>
                {effectiveSecurity.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {effectiveSecurity.map((security, index) => (
                      <Badge key={`${Object.keys(security).join('-')}-${index}`} variant="outline">
                        {Object.keys(security).join(', ')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No security requirement specified in operation or global spec.</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">OpenAPI Compatibility</p>
                <p className="text-muted-foreground">Supports standard OpenAPI operation metadata, schemas, and media-type responses.</p>
              </div>
            </div>

            <div className="rounded-md border bg-secondary/30 p-3 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5" />
                Keep API keys server-side and avoid exposing secrets in browser code.
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function ParametersTable({ parameters }: { parameters: ParameterObject[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[190px]">Name</TableHead>
            <TableHead className="w-[150px]">Type</TableHead>
            <TableHead className="min-w-[260px]">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((param) => {
            const typeLabel =
              param.schema && '$ref' in param.schema && param.schema.$ref
                ? param.schema.$ref.split('/').pop() || 'ref'
                : param.schema && 'type' in param.schema
                  ? param.schema.type || 'any'
                  : 'any';

            return (
              <TableRow key={`${param.in}-${param.name}`}>
                <TableCell>
                  <div className="font-code text-sm font-medium">{param.name}</div>
                  {param.required && (
                    <Badge variant="destructive" className="mt-1 text-[10px] uppercase">
                      Required
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-code text-xs md:text-sm">{typeLabel}</TableCell>
                <TableCell>{param.description ? <MarkdownDisplay content={param.description} className="prose-p:m-0" /> : <span className="text-muted-foreground">No description</span>}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
