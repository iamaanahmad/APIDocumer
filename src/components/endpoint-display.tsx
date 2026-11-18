"use client";

import type { OpenAPISpec, Endpoint, ParameterObject, SchemaObject } from '@/types/openapi';
import { resolveRef } from '@/lib/openapi-parser';
import {
  buildSnippets,
  describeSecurityScheme,
  getEffectiveSecurity,
  getMediaExample,
  getOperationAnchor,
  getRequestBody,
  getResolvedParameters,
  getResolvedResponse,
  getSecuritySchemes,
  statusTone,
} from '@/lib/operation-utils';
import { MethodBadge } from '@/components/method-badge';
import { SchemaDisplay } from '@/components/schema-display';
import { CodeBlock } from '@/components/code-block';
import { MarkdownDisplay } from '@/components/markdown-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, KeyRound, Link2 } from 'lucide-react';

interface EndpointDisplayProps {
  endpoint: Endpoint;
  spec: OpenAPISpec;
  /** Lower-cased snippet label shared across all operations, for example `python`. */
  snippetLang?: string;
  onSnippetLangChange?: (lang: string) => void;
}

const toneClasses: Record<ReturnType<typeof statusTone>, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  redirect: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  client: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  server: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  neutral: 'bg-secondary text-muted-foreground border-border',
};

const panelTabList =
  'h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-white/10 bg-transparent px-2 py-1.5 text-slate-400';
const panelTabTrigger =
  'rounded-md px-2.5 py-1 text-xs text-slate-400 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none';

function parameterTypeLabel(parameter: ParameterObject, spec: OpenAPISpec): { label: string; schema?: SchemaObject } {
  if (!parameter.schema) return { label: 'any' };
  const schema = ('$ref' in parameter.schema && parameter.schema.$ref ? resolveRef(spec, parameter.schema.$ref) : parameter.schema) as SchemaObject | null;
  if (!schema) return { label: 'any' };
  const type = schema.type === 'array' && schema.items && !('$ref' in schema.items) ? `${schema.items.type ?? 'any'}[]` : (schema.type ?? 'any');
  return { label: schema.format ? `${type} · ${schema.format}` : type, schema };
}

function ParameterGroup({ title, parameters, spec }: { title: string; parameters: ParameterObject[]; spec: OpenAPISpec }) {
  if (parameters.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <ul className="divide-y rounded-lg border bg-card/60">
        {parameters.map((parameter) => {
          const { label, schema } = parameterTypeLabel(parameter, spec);
          return (
            <li key={`${parameter.in}-${parameter.name}`} className="space-y-1 px-3 py-3 sm:px-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-code text-sm font-semibold">{parameter.name}</span>
                <span className="font-code text-xs text-muted-foreground">{label}</span>
                {parameter.required && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">required</span>
                )}
                {parameter.deprecated && (
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">deprecated</span>
                )}
              </div>
              {parameter.description && <MarkdownDisplay content={parameter.description} className="prose-p:my-0 prose-p:text-[13px]" />}
              {schema?.enum && schema.enum.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Allowed</span>
                  {schema.enum.map((value) => (
                    <span key={String(value)} className="rounded border bg-secondary/50 px-1.5 py-0.5 font-code text-[11px]">
                      {String(value)}
                    </span>
                  ))}
                </div>
              )}
              {schema?.default !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Default: <span className="font-code text-foreground/90">{JSON.stringify(schema.default)}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EndpointDisplay({ endpoint, spec, snippetLang, onSnippetLangChange }: EndpointDisplayProps) {
  const { method, path, operation } = endpoint;
  const anchor = getOperationAnchor(endpoint);
  const server = spec.servers?.[0]?.url;

  const parameters = getResolvedParameters(endpoint, spec);
  const requestBody = getRequestBody(operation, spec);
  const requestMedia = getMediaExample(requestBody?.content, spec);

  const security = getEffectiveSecurity(endpoint, spec);
  const schemes = getSecuritySchemes(spec);
  const authLabels = security.flatMap((requirement) =>
    Object.keys(requirement).map((name) => {
      const scheme = schemes.find((item) => item.name === name)?.scheme;
      return scheme ? `${name} (${describeSecurityScheme(scheme)})` : name;
    })
  );

  const { snippets, fromSpec } = buildSnippets(endpoint, spec);
  const activeSnippet = snippets.find((snippet) => snippet.label.toLowerCase() === snippetLang)?.key ?? snippets[0].key;

  const responses = operation.responses || {};
  const responseKeys = Object.keys(responses).sort();
  const responseDetails = responseKeys
    .map((statusCode) => {
      const response = getResolvedResponse(responses[statusCode], spec);
      if (!response) return null;
      return { statusCode, response, media: getMediaExample(response.content, spec) };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const exampleResponses = responseDetails.filter((item) => item.media.example !== undefined);

  return (
    <article id={anchor} className="scroll-mt-20 border-t py-8 sm:py-10 first:border-t-0" aria-labelledby={`${anchor}-title`}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] xl:gap-10">
        <div className="min-w-0 space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <MethodBadge method={method} />
              <code className="break-all font-code text-xs text-muted-foreground sm:text-sm">{path}</code>
              {operation.deprecated && <Badge variant="outline" className="border-amber-500/40 text-amber-500">Deprecated</Badge>}
            </div>
            <h3 id={`${anchor}-title`} className="group/title flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="min-w-0 break-words">{operation.summary || `${method.toUpperCase()} ${path}`}</span>
              <a
                href={`#${anchor}`}
                aria-label={`Link to ${operation.summary || path}`}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition hover:text-primary focus-visible:opacity-100 sm:opacity-0 sm:group-hover/title:opacity-100"
              >
                <Link2 className="h-4 w-4" />
              </a>
            </h3>
            <MarkdownDisplay content={operation.description} />
            {authLabels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Requires</span>
                {authLabels.map((label) => (
                  <Badge key={label} variant="outline" className="font-normal">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {parameters.length > 0 && (
            <section className="space-y-4" aria-label="Parameters">
              <h4 className="border-b pb-2 text-sm font-semibold">Parameters</h4>
              <ParameterGroup title="Path" parameters={parameters.filter((p) => p.in === 'path')} spec={spec} />
              <ParameterGroup title="Query" parameters={parameters.filter((p) => p.in === 'query')} spec={spec} />
              <ParameterGroup title="Header" parameters={parameters.filter((p) => p.in === 'header')} spec={spec} />
              <ParameterGroup title="Cookie" parameters={parameters.filter((p) => p.in === 'cookie')} spec={spec} />
            </section>
          )}

          {requestBody?.content && (
            <section className="space-y-3" aria-label="Request body">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <h4 className="text-sm font-semibold">
                  Request body
                  {requestBody.required && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-destructive">required</span>}
                </h4>
                {requestMedia.mediaType && <span className="font-code text-xs text-muted-foreground">{requestMedia.mediaType}</span>}
              </div>
              <MarkdownDisplay content={requestBody.description} />
              {requestMedia.schema && <SchemaDisplay name="Body" schema={requestMedia.schema} spec={spec} />}
            </section>
          )}

          {responseDetails.length > 0 && (
            <section className="space-y-3" aria-label="Responses">
              <h4 className="border-b pb-2 text-sm font-semibold">Responses</h4>
              <ul className="space-y-2">
                {responseDetails.map(({ statusCode, response, media }) => (
                  <li key={statusCode} className="rounded-lg border bg-card/60">
                    <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
                      <span className={cn('mt-0.5 rounded-md border px-2 py-0.5 font-code text-xs font-semibold', toneClasses[statusTone(statusCode)])}>{statusCode}</span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <MarkdownDisplay content={response.description} className="prose-p:my-0 prose-p:text-[13px]" />
                        {media.mediaType && <p className="font-code text-[11px] text-muted-foreground">{media.mediaType}</p>}
                      </div>
                    </div>
                    {media.schema && (
                      <details className="group/schema border-t">
                        <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4 [&::-webkit-details-marker]:hidden">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/schema:rotate-90" />
                          Response schema
                        </summary>
                        <div className="px-3 pb-3 sm:px-4">
                          <SchemaDisplay name={`Response ${statusCode}`} schema={media.schema} spec={spec} />
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto xl:pr-1" aria-label="Code examples">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1020] shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <MethodBadge method={method} size="sm" />
              <code className="min-w-0 truncate font-code text-xs text-slate-300" title={`${server ?? ''}${path}`}>
                {server ? `${server.replace(/\/$/, '')}${path}` : path}
              </code>
            </div>
            <Tabs value={activeSnippet} onValueChange={(value) => onSnippetLangChange?.(snippets.find((s) => s.key === value)?.label.toLowerCase() ?? value)}>
              <TabsList className={panelTabList} aria-label="Language">
                {snippets.map((snippet) => (
                  <TabsTrigger key={snippet.key} value={snippet.key} className={panelTabTrigger}>
                    {snippet.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {snippets.map((snippet) => (
                <TabsContent key={snippet.key} value={snippet.key} className="mt-0">
                  <CodeBlock code={snippet.code} language={snippet.language} variant="panel" hideHeader className="rounded-none border-0" maxHeightClass="max-h-[45vh]" />
                </TabsContent>
              ))}
            </Tabs>
            {fromSpec && <p className="border-t border-white/10 px-3 py-1.5 text-[11px] text-slate-500">Samples provided by the API specification.</p>}
          </div>

          {requestMedia.example !== undefined && requestMedia.mediaType?.includes('json') && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1020] shadow-lg">
              <div className="border-b border-white/10 px-3 py-2 text-xs font-medium text-slate-300">Request body example</div>
              <CodeBlock code={JSON.stringify(requestMedia.example, null, 2)} language="json" variant="panel" hideHeader className="rounded-none border-0" maxHeightClass="max-h-[35vh]" />
            </div>
          )}

          {exampleResponses.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1020] shadow-lg">
              <Tabs defaultValue={exampleResponses[0].statusCode}>
                <TabsList className={panelTabList} aria-label="Response status">
                  <span className="px-2 text-xs font-medium text-slate-300">Response</span>
                  {exampleResponses.map(({ statusCode }) => (
                    <TabsTrigger key={statusCode} value={statusCode} className={panelTabTrigger}>
                      <span
                        className={cn(
                          'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
                          statusTone(statusCode) === 'success' && 'bg-emerald-400',
                          statusTone(statusCode) === 'redirect' && 'bg-sky-400',
                          statusTone(statusCode) === 'client' && 'bg-amber-400',
                          statusTone(statusCode) === 'server' && 'bg-rose-400',
                          statusTone(statusCode) === 'neutral' && 'bg-slate-400'
                        )}
                      />
                      {statusCode}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {exampleResponses.map(({ statusCode, media }) => (
                  <TabsContent key={statusCode} value={statusCode} className="mt-0">
                    <CodeBlock
                      code={typeof media.example === 'string' ? media.example : JSON.stringify(media.example, null, 2)}
                      language="json"
                      variant="panel"
                      hideHeader
                      className="rounded-none border-0"
                      maxHeightClass="max-h-[45vh]"
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
