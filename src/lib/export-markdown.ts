import type { Endpoint, OpenAPISpec, ReferenceObject, SchemaObject } from '@/types/openapi';
import { getTaggedEndpoints, resolveRef } from '@/lib/openapi-parser';
import {
  buildCurl,
  describeSecurityScheme,
  getEffectiveSecurity,
  getMediaExample,
  getOperationAnchor,
  getRequestBody,
  getResolvedParameters,
  getResolvedResponse,
  getSecuritySchemes,
  inferSnippetLanguage,
} from '@/lib/operation-utils';

const MAX_SCHEMA_DEPTH = 4;

interface ResolvedSchema {
  schema: SchemaObject;
  refName?: string;
}

function oneLine(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
}

function indentBlock(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length ? pad + line : line))
    .join('\n');
}

function resolveSchema(schema: SchemaObject | ReferenceObject | undefined, spec: OpenAPISpec): ResolvedSchema | null {
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

function flatten(schema: SchemaObject, spec: OpenAPISpec): SchemaObject {
  if (!schema.allOf?.length) return schema;
  const merged: SchemaObject = { ...schema, properties: { ...(schema.properties ?? {}) }, required: [...(schema.required ?? [])] };
  schema.allOf.forEach((part) => {
    const resolved = resolveSchema(part, spec);
    if (!resolved) return;
    const flat = flatten(resolved.schema, spec);
    merged.properties = { ...merged.properties, ...(flat.properties ?? {}) };
    merged.required = [...(merged.required ?? []), ...(flat.required ?? [])];
    merged.type = merged.type ?? flat.type ?? (flat.properties ? 'object' : undefined);
    merged.description = merged.description ?? flat.description;
  });
  return merged;
}

function typeLabel(schema: SchemaObject | ReferenceObject | undefined, spec: OpenAPISpec): string {
  const resolved = resolveSchema(schema, spec);
  if (!resolved) return 'any';
  const flat = flatten(resolved.schema, spec);
  if (flat.type === 'array') return `${flat.items ? typeLabel(flat.items, spec) : 'any'}[]`;
  if (flat.oneOf?.length) return 'oneOf';
  if (flat.anyOf?.length) return 'anyOf';
  if (resolved.refName && (flat.type === 'object' || flat.properties)) return resolved.refName;
  const base = flat.type ?? (flat.properties ? 'object' : 'any');
  return flat.format ? `${base}(${flat.format})` : base;
}

function childSchema(schema: SchemaObject | ReferenceObject | undefined, spec: OpenAPISpec): { schema: SchemaObject; refName?: string } | null {
  const resolved = resolveSchema(schema, spec);
  if (!resolved) return null;
  const flat = flatten(resolved.schema, spec);
  if (flat.type === 'array' && flat.items) {
    const item = resolveSchema(flat.items, spec);
    if (!item) return null;
    const flatItem = flatten(item.schema, spec);
    return flatItem.properties || flatItem.oneOf || flatItem.anyOf ? { schema: flatItem, refName: item.refName } : null;
  }
  return flat.properties || flat.oneOf || flat.anyOf ? { schema: flat, refName: resolved.refName } : null;
}

function propertyDetails(schema: SchemaObject): string {
  const parts: string[] = [];
  if (schema.enum?.length) parts.push(`Allowed: ${schema.enum.map((value) => `\`${String(value)}\``).join(', ')}`);
  if (schema.default !== undefined) parts.push(`Default: \`${JSON.stringify(schema.default)}\``);
  if (schema.minimum !== undefined) parts.push(`Min: ${schema.minimum}`);
  if (schema.maximum !== undefined) parts.push(`Max: ${schema.maximum}`);
  if (schema.minLength !== undefined) parts.push(`Min length: ${schema.minLength}`);
  if (schema.maxLength !== undefined) parts.push(`Max length: ${schema.maxLength}`);
  if (schema.pattern) parts.push(`Pattern: \`${schema.pattern}\``);
  if (schema.example !== undefined && typeof schema.example !== 'object') parts.push(`Example: \`${JSON.stringify(schema.example)}\``);
  return parts.join('. ');
}

function propertyLines(schema: SchemaObject, spec: OpenAPISpec, depth: number, seen: string[]): string[] {
  const lines: string[] = [];
  const pad = '  '.repeat(depth);

  Object.entries(schema.properties ?? {}).forEach(([name, propSchema]) => {
    const resolved = resolveSchema(propSchema, spec);
    const flat = resolved ? flatten(resolved.schema, spec) : ({} as SchemaObject);
    const flags = [typeLabel(propSchema, spec)];
    if (schema.required?.includes(name)) flags.push('required');
    if (flat.nullable) flags.push('nullable');
    if (flat.readOnly) flags.push('read-only');
    if (flat.deprecated) flags.push('deprecated');

    const text = [oneLine(flat.description), propertyDetails(flat)].filter(Boolean).join(' ');
    lines.push(`${pad}- \`${name}\` (${flags.join(', ')})${text ? `: ${text}` : ''}`);

    const child = depth < MAX_SCHEMA_DEPTH ? childSchema(propSchema, spec) : null;
    if (child && !(child.refName && seen.includes(child.refName))) {
      lines.push(...propertyLines(child.schema, spec, depth + 1, child.refName ? [...seen, child.refName] : seen));
      (child.schema.oneOf ?? child.schema.anyOf)?.forEach((variant, index) => {
        lines.push(`${pad}  - Option ${index + 1}: \`${typeLabel(variant, spec)}\``);
      });
    }
  });

  return lines;
}

function schemaMarkdown(schema: SchemaObject | ReferenceObject | undefined, spec: OpenAPISpec): string {
  const resolved = resolveSchema(schema, spec);
  if (!resolved) return '';
  const flat = flatten(resolved.schema, spec);
  const child = childSchema(schema, spec);
  const isArray = flat.type === 'array';

  if (!child) return `Type: \`${typeLabel(schema, spec)}\`${flat.description ? `. ${oneLine(flat.description)}` : ''}`;

  const head = `Type: \`${isArray ? typeLabel(schema, spec) : (resolved.refName ?? 'object')}\`${isArray ? ' (array of objects with these fields)' : ''}`;
  const seen = child.refName ? [child.refName] : [];
  const lines = propertyLines(child.schema, spec, 0, seen);
  (child.schema.oneOf ?? child.schema.anyOf)?.forEach((variant, index) => {
    lines.push(`- Option ${index + 1}: \`${typeLabel(variant, spec)}\``);
  });
  return [head, '', ...lines].join('\n');
}

function jsonBlock(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return ['```json', text, '```'].join('\n');
}

/** Demotes headings by one level so embedded descriptions nest under the generated structure. */
function normalizeHeadings(markdown: string, minLevel: number): string {
  let inFence = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) inFence = !inFence;
      if (inFence) return line;
      const match = /^(#{1,6})\s/.exec(line);
      if (!match || match[1].length >= minLevel) return line;
      return `${'#'.repeat(minLevel)}${line.slice(match[1].length)}`;
    })
    .join('\n');
}

function authDescription(endpoint: Endpoint | null, spec: OpenAPISpec): string {
  const requirements = endpoint ? getEffectiveSecurity(endpoint, spec) : (spec.security ?? []);
  if (requirements.length === 0) return endpoint ? 'None specified' : '';
  const schemes = getSecuritySchemes(spec);
  return requirements
    .map((requirement) =>
      Object.keys(requirement)
        .map((name) => {
          const scheme = schemes.find((item) => item.name === name)?.scheme;
          return scheme ? `\`${name}\` (${describeSecurityScheme(scheme)})` : `\`${name}\``;
        })
        .join(' + ')
    )
    .join(' or ');
}

function endpointMarkdown(endpoint: Endpoint, spec: OpenAPISpec, errorSchemas: Set<string>): string {
  const { method, path, operation } = endpoint;
  const out: string[] = [];

  out.push(`#### \`${method.toUpperCase()} ${path}\`${operation.summary ? `: ${operation.summary}` : ''}`);
  out.push('');
  out.push(`- Anchor: \`#${getOperationAnchor(endpoint)}\``);
  if (operation.operationId) out.push(`- Operation ID: \`${operation.operationId}\``);
  out.push(`- Authentication: ${authDescription(endpoint, spec)}`);
  if (operation.deprecated) out.push('- Deprecated: yes');
  out.push('');
  if (operation.description) out.push(normalizeHeadings(operation.description.trim(), 5), '');

  const parameters = getResolvedParameters(endpoint, spec);
  if (parameters.length > 0) {
    out.push('**Parameters**', '', '| Name | In | Type | Required | Description |', '| --- | --- | --- | --- | --- |');
    parameters.forEach((parameter) => {
      const resolved = resolveSchema(parameter.schema, spec);
      const flat = resolved ? flatten(resolved.schema, spec) : ({} as SchemaObject);
      const description = [oneLine(parameter.description), propertyDetails({ ...flat, example: parameter.example ?? flat.example })].filter(Boolean).join(' ');
      out.push(`| \`${parameter.name}\` | ${parameter.in} | ${typeLabel(parameter.schema, spec)} | ${parameter.required ? 'yes' : 'no'} | ${description} |`);
    });
    out.push('');
  }

  const requestBody = getRequestBody(operation, spec);
  if (requestBody?.content) {
    const { mediaType, schema, example } = getMediaExample(requestBody.content, spec);
    out.push(`**Request body**${mediaType ? ` (\`${mediaType}\`${requestBody.required ? ', required' : ''})` : ''}`, '');
    if (requestBody.description) out.push(oneLine(requestBody.description), '');
    if (schema) out.push(schemaMarkdown(schema, spec), '');
    if (example !== undefined) out.push('Example:', '', jsonBlock(example), '');
  }

  const responses = operation.responses ?? {};
  const statusCodes = Object.keys(responses).sort();
  if (statusCodes.length > 0) {
    out.push('**Responses**', '');
    statusCodes.forEach((statusCode) => {
      const response = getResolvedResponse(responses[statusCode], spec);
      if (!response) return;
      const isSuccess = statusCode.startsWith('2');
      const { mediaType, schema, example } = getMediaExample(response.content, spec);
      out.push(`- \`${statusCode}\`: ${oneLine(response.description)}${mediaType ? ` (\`${mediaType}\`)` : ''}`);

      const resolved = resolveSchema(schema, spec);
      if (isSuccess && schema) {
        out.push('', indentBlock(schemaMarkdown(schema, spec), 2));
        if (example !== undefined && mediaType?.includes('json')) out.push('', indentBlock(jsonBlock(example), 2));
        out.push('');
      } else if (resolved?.refName) {
        out[out.length - 1] += `. Body: \`${resolved.refName}\` (see "Error response schemas")`;
        errorSchemas.add(resolved.refName);
      }
    });
    if (out[out.length - 1] !== '') out.push('');
  }

  const provided = operation['x-code-samples'] ?? [];
  const curl = provided.find((sample) => /curl/i.test(sample.lang));
  const sample = curl ?? provided[0];
  out.push('**Example request**', '');
  out.push('```' + (sample ? inferSnippetLanguage(sample.lang) : 'bash'), (sample ? sample.source : buildCurl(endpoint, spec)).trimEnd(), '```', '');

  return out.join('\n');
}

/**
 * Renders the whole specification as one Markdown document that is easy for LLMs and agents to
 * read: references are resolved, schemas are flattened into field lists, and every endpoint
 * includes parameters, responses, and an example request.
 */
export function generateMarkdown(spec: OpenAPISpec | null): string {
  if (!spec) return 'No specification available.';

  const out: string[] = [`# ${spec.info.title || 'API Documentation'}`, ''];
  const meta: string[] = [];
  if (spec.info.version) meta.push(`- Version: ${spec.info.version}`);
  meta.push(`- OpenAPI: ${spec.openapi}`);
  if (spec.info.contact?.email || spec.info.contact?.url) {
    meta.push(`- Contact: ${[spec.info.contact.url, spec.info.contact.email].filter(Boolean).join(', ')}`);
  }
  out.push(...meta, '');

  if (spec.servers?.length) {
    out.push('## Base URLs', '');
    spec.servers.forEach((server) => out.push(`- \`${server.url}\`${server.description ? `: ${server.description}` : ''}`));
    out.push('');
  }

  const schemes = getSecuritySchemes(spec);
  if (schemes.length > 0) {
    out.push('## Security schemes', '');
    schemes.forEach(({ name, scheme }) => {
      out.push(`- \`${name}\`: ${describeSecurityScheme(scheme)}${scheme.description ? `. ${oneLine(scheme.description)}` : ''}`);
    });
    const globalAuth = authDescription(null, spec);
    if (globalAuth) out.push('', `Default requirement for all endpoints: ${globalAuth}.`);
    out.push('');
  }

  if (spec.info.description) out.push(normalizeHeadings(spec.info.description.trim(), 2), '');

  const errorSchemas = new Set<string>();
  const groups = getTaggedEndpoints(spec);
  out.push('## API reference', '');
  groups.forEach(({ tag, endpoints }) => {
    out.push(`### ${tag.name}`, '');
    if (tag.description) out.push(oneLine(tag.description), '');
    endpoints.forEach((endpoint) => out.push(endpointMarkdown(endpoint, spec, errorSchemas)));
  });

  if (errorSchemas.size > 0) {
    out.push('## Error response schemas', '');
    errorSchemas.forEach((name) => {
      const schema = resolveRef(spec, `#/components/schemas/${name}`) as SchemaObject | null;
      if (!schema) return;
      out.push(`### ${name}`, '', schemaMarkdown({ $ref: `#/components/schemas/${name}` }, spec), '');
    });
  }

  if (spec.externalDocs?.url) out.push('## More information', '', `- [${spec.externalDocs.description || 'External documentation'}](${spec.externalDocs.url})`, '');

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
