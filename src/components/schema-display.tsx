import type { OpenAPISpec, SchemaObject, ReferenceObject } from '@/types/openapi';
import { resolveRef } from '@/lib/openapi-parser';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { MarkdownDisplay } from './markdown-display';

interface SchemaDisplayProps {
  name: string;
  schema: SchemaObject | ReferenceObject;
  spec: OpenAPISpec;
}

const MAX_DEPTH = 5;

interface Resolved {
  schema: SchemaObject;
  refName?: string;
}

function resolveSchema(schema: SchemaObject | ReferenceObject | undefined, spec: OpenAPISpec): Resolved | null {
  if (!schema) return null;
  let current: SchemaObject | ReferenceObject = schema;
  let refName: string | undefined;
  for (let i = 0; i < 10 && '$ref' in current && current.$ref; i++) {
    refName = current.$ref.split('/').pop();
    const next = resolveRef(spec, current.$ref);
    if (!next) return null;
    current = next;
  }
  return { schema: current as SchemaObject, refName };
}

/** Flattens `allOf` into one schema so its properties render as a single list. */
function flattenSchema(schema: SchemaObject, spec: OpenAPISpec): SchemaObject {
  if (!schema.allOf?.length) return schema;
  const merged: SchemaObject = { ...schema, properties: { ...(schema.properties ?? {}) }, required: [...(schema.required ?? [])] };
  schema.allOf.forEach((part) => {
    const resolved = resolveSchema(part, spec);
    if (!resolved) return;
    const flat = flattenSchema(resolved.schema, spec);
    merged.properties = { ...merged.properties, ...(flat.properties ?? {}) };
    merged.required = [...(merged.required ?? []), ...(flat.required ?? [])];
    merged.type = merged.type ?? flat.type ?? (flat.properties ? 'object' : undefined);
    merged.description = merged.description ?? flat.description;
  });
  return merged;
}

function typeLabel(schema: SchemaObject | ReferenceObject, spec: OpenAPISpec): string {
  const resolved = resolveSchema(schema, spec);
  if (!resolved) return 'any';
  const flat = flattenSchema(resolved.schema, spec);

  if (flat.type === 'array') {
    return `${flat.items ? typeLabel(flat.items, spec) : 'any'}[]`;
  }
  if (flat.oneOf?.length) return 'one of';
  if (flat.anyOf?.length) return 'any of';
  if (resolved.refName && flat.type === 'object') return resolved.refName;

  const base = flat.type ?? (flat.properties ? 'object' : 'any');
  return flat.format ? `${base} · ${flat.format}` : base;
}

/** Returns the object schema whose properties should be shown as children, if any. */
function getChildSchema(schema: SchemaObject | ReferenceObject, spec: OpenAPISpec): { schema: SchemaObject; refName?: string; isArray: boolean } | null {
  const resolved = resolveSchema(schema, spec);
  if (!resolved) return null;
  const flat = flattenSchema(resolved.schema, spec);

  if (flat.type === 'array' && flat.items) {
    const item = resolveSchema(flat.items, spec);
    if (!item) return null;
    const flatItem = flattenSchema(item.schema, spec);
    return flatItem.properties || flatItem.oneOf || flatItem.anyOf ? { schema: flatItem, refName: item.refName, isArray: true } : null;
  }
  return flat.properties || flat.oneOf || flat.anyOf ? { schema: flat, refName: resolved.refName, isArray: false } : null;
}

function Constraints({ schema }: { schema: SchemaObject }) {
  const items: string[] = [];
  if (schema.minimum !== undefined) items.push(`min ${schema.minimum}`);
  if (schema.maximum !== undefined) items.push(`max ${schema.maximum}`);
  if (schema.minLength !== undefined) items.push(`min length ${schema.minLength}`);
  if (schema.maxLength !== undefined) items.push(`max length ${schema.maxLength}`);
  if (schema.pattern) items.push(`pattern ${schema.pattern}`);
  if (schema.default !== undefined) items.push(`default ${JSON.stringify(schema.default)}`);
  if (items.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded border bg-secondary/50 px-1.5 py-0.5 font-code text-[11px] text-muted-foreground">
          {item}
        </span>
      ))}
    </div>
  );
}

function EnumValues({ values }: { values?: any[] }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Allowed</span>
      {values.map((value) => (
        <span key={String(value)} className="rounded border bg-secondary/50 px-1.5 py-0.5 font-code text-[11px]">
          {String(value)}
        </span>
      ))}
    </div>
  );
}

function PropertyList({
  schema,
  spec,
  depth,
  seen,
}: {
  schema: SchemaObject;
  spec: OpenAPISpec;
  depth: number;
  seen: string[];
}) {
  const variants = schema.oneOf ?? schema.anyOf;
  const properties = Object.entries(schema.properties ?? {});

  return (
    <div className="space-y-3">
      {properties.length > 0 && (
        <ul className={cn('divide-y rounded-lg border bg-card/60', depth > 0 && 'bg-background/40')}>
          {properties.map(([propName, propSchema]) => (
            <PropertyRow key={propName} name={propName} schema={propSchema} required={schema.required?.includes(propName) ?? false} spec={spec} depth={depth} seen={seen} />
          ))}
        </ul>
      )}
      {variants?.map((variant, index) => {
        const resolved = resolveSchema(variant, spec);
        if (!resolved) return null;
        const flat = flattenSchema(resolved.schema, spec);
        return (
          <div key={index} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {schema.oneOf ? 'Option' : 'Variant'} {index + 1}
              {resolved.refName ? `: ${resolved.refName}` : ''}
            </p>
            {flat.properties ? (
              <PropertyList schema={flat} spec={spec} depth={depth + 1} seen={seen} />
            ) : (
              <p className="font-code text-xs text-muted-foreground">{typeLabel(variant, spec)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PropertyRow({
  name,
  schema,
  required,
  spec,
  depth,
  seen,
}: {
  name: string;
  schema: SchemaObject | ReferenceObject;
  required: boolean;
  spec: OpenAPISpec;
  depth: number;
  seen: string[];
}) {
  const resolved = resolveSchema(schema, spec);
  const flat = resolved ? flattenSchema(resolved.schema, spec) : ({} as SchemaObject);
  const child = depth < MAX_DEPTH ? getChildSchema(schema, spec) : null;
  const isCycle = Boolean(child?.refName && seen.includes(child.refName));
  const description = flat.description;
  const nextSeen = child?.refName ? [...seen, child.refName] : seen;

  return (
    <li className="space-y-1 px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-code text-sm font-semibold text-foreground">{name}</span>
        <span className="font-code text-xs text-muted-foreground">{typeLabel(schema, spec)}</span>
        {required && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">required</span>}
        {flat.nullable && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">nullable</span>}
        {flat.readOnly && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">read-only</span>}
        {flat.deprecated && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">deprecated</span>}
      </div>
      {description && <MarkdownDisplay content={description} className="prose-p:my-0 prose-p:text-[13px]" />}
      <EnumValues values={flat.enum} />
      <Constraints schema={flat} />
      {flat.example !== undefined && typeof flat.example !== 'object' && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Example: <span className="font-code text-foreground/90">{JSON.stringify(flat.example)}</span>
        </p>
      )}
      {child && !isCycle && (
        <details className="group/child mt-2">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-md border bg-secondary/40 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/child:rotate-90" />
            <span className="group-open/child:hidden">Show {child.isArray ? 'item' : 'child'} attributes</span>
            <span className="hidden group-open/child:inline">Hide {child.isArray ? 'item' : 'child'} attributes</span>
          </summary>
          <div className="mt-2 border-l-2 border-primary/20 pl-3">
            <PropertyList schema={child.schema} spec={spec} depth={depth + 1} seen={nextSeen} />
          </div>
        </details>
      )}
    </li>
  );
}

export function SchemaDisplay({ name, schema, spec }: SchemaDisplayProps) {
  const resolved = resolveSchema(schema, spec);

  if (!resolved) {
    return <p className="text-sm text-muted-foreground">Could not resolve schema reference.</p>;
  }

  const flat = flattenSchema(resolved.schema, spec);
  const child = getChildSchema(schema, spec);
  const title = resolved.refName ?? name;

  if (!child) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{name}</p>
        <div className="rounded-lg border bg-card/60 px-4 py-3">
          <span className="font-code text-sm">{typeLabel(schema, spec)}</span>
          {flat.description && <MarkdownDisplay content={flat.description} className="mt-1 prose-p:my-0" />}
          <EnumValues values={flat.enum} />
          <Constraints schema={flat} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{name}</p>
        <span className="font-code text-xs text-muted-foreground">
          {child.isArray ? `array of ${child.refName ?? 'object'}` : title !== name ? title : 'object'}
        </span>
      </div>
      <PropertyList schema={child.schema} spec={spec} depth={0} seen={child.refName ? [child.refName] : []} />
    </div>
  );
}
