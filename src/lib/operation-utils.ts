import type {
  Endpoint,
  OpenAPISpec,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
  SecuritySchemeObject,
} from '@/types/openapi';
import { resolveRef } from '@/lib/openapi-parser';
import { generateExampleFromSchema } from '@/lib/example-generator';

export interface CodeSnippet {
  key: string;
  label: string;
  language: string;
  code: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[{}]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getOperationAnchor(endpoint: Endpoint): string {
  const id = endpoint.operation.operationId;
  return id ? `operation-${slugify(id)}` : `${endpoint.method.toLowerCase()}-${slugify(endpoint.path)}`;
}

export function getTagAnchor(tagName: string): string {
  return `tag-${slugify(tagName)}`;
}

export function getResolvedParameters(endpoint: Endpoint, spec: OpenAPISpec): ParameterObject[] {
  const pathItemParams = ((spec.paths[endpoint.path] as { parameters?: (ParameterObject | ReferenceObject)[] } | undefined)?.parameters ?? []);
  const merged = new Map<string, ParameterObject>();

  [...pathItemParams, ...(endpoint.operation.parameters ?? [])].forEach((parameter) => {
    const resolved = '$ref' in parameter ? resolveRef(spec, parameter.$ref) : parameter;
    if (resolved && typeof resolved === 'object' && 'in' in resolved && 'name' in resolved) {
      merged.set(`${resolved.in}:${resolved.name}`, resolved as ParameterObject);
    }
  });

  return Array.from(merged.values());
}

export function getRequestBody(operation: OperationObject, spec: OpenAPISpec): RequestBodyObject | null {
  if (!operation.requestBody) return null;
  if ('$ref' in operation.requestBody) {
    return (resolveRef(spec, operation.requestBody.$ref) as RequestBodyObject | null) ?? null;
  }
  return operation.requestBody;
}

export function getResolvedResponse(response: ResponseObject | ReferenceObject, spec: OpenAPISpec): ResponseObject | null {
  if ('$ref' in response) {
    const resolved = resolveRef(spec, response.$ref);
    return resolved && typeof resolved === 'object' ? (resolved as ResponseObject) : null;
  }
  return response;
}

export function getPreferredMediaType(content: Record<string, unknown> | undefined): string | undefined {
  if (!content) return undefined;
  const types = Object.keys(content);
  return types.find((type) => type.includes('json')) ?? types[0];
}

export function getContentExample(content: Record<string, any> | undefined, mediaType: string | undefined): unknown {
  if (!content || !mediaType) return undefined;
  const media = content[mediaType];
  if (!media) return undefined;
  if (media.example !== undefined) return media.example;
  if (media.examples) {
    const first = Object.values(media.examples)[0] as { value?: unknown } | undefined;
    if (first && typeof first === 'object' && 'value' in first) return first.value;
  }
  return undefined;
}

export function getMediaExample(content: Record<string, any> | undefined, spec: OpenAPISpec): { mediaType?: string; schema?: SchemaObject | ReferenceObject; example?: unknown } {
  const mediaType = getPreferredMediaType(content);
  const schema = mediaType ? content?.[mediaType]?.schema : undefined;
  const example = getContentExample(content, mediaType) ?? (schema ? generateExampleFromSchema(schema, spec) : undefined);
  return { mediaType, schema, example };
}

export function getEffectiveSecurity(endpoint: Endpoint, spec: OpenAPISpec) {
  return endpoint.operation.security ?? spec.security ?? [];
}

export function getSecuritySchemes(spec: OpenAPISpec): Array<{ name: string; scheme: SecuritySchemeObject }> {
  const schemes = spec.components?.securitySchemes ?? {};
  return Object.entries(schemes)
    .map(([name, value]) => {
      const scheme = '$ref' in value ? (resolveRef(spec, value.$ref) as SecuritySchemeObject | null) : value;
      return scheme ? { name, scheme } : null;
    })
    .filter((item): item is { name: string; scheme: SecuritySchemeObject } => item !== null);
}

export function describeSecurityScheme(scheme: SecuritySchemeObject): string {
  if (scheme.type === 'http') {
    return scheme.scheme === 'bearer' ? `HTTP Bearer${scheme.bearerFormat ? ` (${scheme.bearerFormat})` : ''}` : `HTTP ${scheme.scheme ?? ''}`.trim();
  }
  if (scheme.type === 'apiKey') return `API key in ${scheme.in ?? 'header'}: ${scheme.name ?? ''}`.trim();
  return scheme.type;
}

interface AuthInfo {
  headers: Array<[string, string]>;
  query: Array<[string, string]>;
}

function getAuthInfo(endpoint: Endpoint, spec: OpenAPISpec): AuthInfo {
  const info: AuthInfo = { headers: [], query: [] };
  const requirement = getEffectiveSecurity(endpoint, spec)[0];
  if (!requirement) return info;

  const schemes = getSecuritySchemes(spec);
  Object.keys(requirement).forEach((schemeName) => {
    const scheme = schemes.find((item) => item.name === schemeName)?.scheme;
    if (!scheme) return;
    if (scheme.type === 'http' && scheme.scheme === 'bearer') info.headers.push(['Authorization', 'Bearer YOUR_TOKEN']);
    else if (scheme.type === 'http' && scheme.scheme === 'basic') info.headers.push(['Authorization', 'Basic YOUR_CREDENTIALS']);
    else if (scheme.type === 'apiKey' && scheme.name) {
      if (scheme.in === 'query') info.query.push([scheme.name, 'YOUR_API_KEY']);
      else if (scheme.in !== 'cookie') info.headers.push([scheme.name, 'YOUR_API_KEY']);
    } else if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') info.headers.push(['Authorization', 'Bearer YOUR_ACCESS_TOKEN']);
  });
  return info;
}

function getParameterValue(parameter: ParameterObject, spec: OpenAPISpec): string | undefined {
  if (parameter.example !== undefined) return String(parameter.example);
  if (!parameter.schema) return undefined;
  const schema = ('$ref' in parameter.schema && parameter.schema.$ref ? resolveRef(spec, parameter.schema.$ref) : parameter.schema) as SchemaObject | null;
  if (!schema) return undefined;
  const value = schema.example ?? schema.default ?? schema.enum?.[0];
  return value === undefined ? undefined : String(value);
}

interface RequestParts {
  method: string;
  url: string;
  headers: Array<[string, string]>;
  body?: string;
}

function buildRequestParts(endpoint: Endpoint, spec: OpenAPISpec): RequestParts {
  const server = (spec.servers?.[0]?.url || 'https://api.example.com').replace(/\/$/, '');
  const parameters = getResolvedParameters(endpoint, spec);
  const auth = getAuthInfo(endpoint, spec);

  let path = endpoint.path;
  parameters
    .filter((parameter) => parameter.in === 'path')
    .forEach((parameter) => {
      path = path.replace(`{${parameter.name}}`, getParameterValue(parameter, spec) ?? `{${parameter.name}}`);
    });

  const query: Array<[string, string]> = [];
  parameters
    .filter((parameter) => parameter.in === 'query')
    .forEach((parameter) => {
      const value = getParameterValue(parameter, spec);
      if (value !== undefined) query.push([parameter.name, value]);
      else if (parameter.required) query.push([parameter.name, `{${parameter.name}}`]);
    });
  query.push(...auth.query);

  const headers: Array<[string, string]> = [...auth.headers];
  parameters
    .filter((parameter) => parameter.in === 'header')
    .forEach((parameter) => {
      if (parameter.required || parameter.example !== undefined) headers.push([parameter.name, getParameterValue(parameter, spec) ?? `{${parameter.name}}`]);
    });

  const queryString = query.map(([key, value]) => `${key}=${value}`).join('&');
  const url = `${server}${path}${queryString ? `?${queryString}` : ''}`;

  let body: string | undefined;
  const requestBody = getRequestBody(endpoint.operation, spec);
  const { mediaType, example } = getMediaExample(requestBody?.content, spec);
  if (requestBody && mediaType?.includes('json') && example !== undefined) {
    headers.push(['Content-Type', 'application/json']);
    body = JSON.stringify(example, null, 2);
  }

  return { method: endpoint.method.toUpperCase(), url, headers, body };
}

export function buildCurl(endpoint: Endpoint, spec: OpenAPISpec): string {
  const { method, url, headers, body } = buildRequestParts(endpoint, spec);
  let curl = `curl -X ${method} "${url}"`;
  headers.forEach(([key, value]) => {
    curl += ` \\\n  -H "${key}: ${value}"`;
  });
  if (body) curl += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;
  return curl;
}

export function buildJavaScript(endpoint: Endpoint, spec: OpenAPISpec): string {
  const { method, url, headers, body } = buildRequestParts(endpoint, spec);
  const headerLines = headers.map(([key, value]) => `    '${key}': '${value}',`).join('\n');
  const lines = [`const response = await fetch('${url}', {`, `  method: '${method}',`];
  if (headers.length) lines.push('  headers: {', headerLines, '  },');
  if (body) lines.push(`  body: JSON.stringify(${body.replace(/\n/g, '\n  ')}),`);
  lines.push('});', '', 'const data = await response.json();', 'console.log(data);');
  return lines.join('\n');
}

export function buildPython(endpoint: Endpoint, spec: OpenAPISpec): string {
  const { method, url, headers, body } = buildRequestParts(endpoint, spec);
  const lines = ['import requests', ''];
  lines.push(`url = "${url}"`);
  if (headers.length) {
    lines.push('headers = {', ...headers.map(([key, value]) => `    "${key}": "${value}",`), '}');
  }
  if (body) {
    const pyBody = body.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None');
    lines.push(`payload = ${pyBody}`);
  }
  const args = ['url', headers.length ? 'headers=headers' : '', body ? 'json=payload' : ''].filter(Boolean).join(', ');
  lines.push('', `response = requests.request("${method}", ${args})`, 'print(response.json())');
  return lines.join('\n');
}

export function inferSnippetLanguage(label: string): string {
  const value = label.toLowerCase();
  if (value.includes('curl') || value.includes('shell') || value.includes('bash')) return 'bash';
  if (value.includes('typescript')) return 'typescript';
  if (value.includes('javascript') || value.includes('node') || value === 'js') return 'javascript';
  if (value.includes('python')) return 'python';
  if (value.includes('php')) return 'php';
  if (value.includes('java')) return 'java';
  if (value.includes('golang') || value === 'go') return 'go';
  if (value.includes('ruby')) return 'ruby';
  if (value.includes('c#') || value.includes('csharp')) return 'csharp';
  return 'bash';
}

export function buildSnippets(endpoint: Endpoint, spec: OpenAPISpec): { snippets: CodeSnippet[]; fromSpec: boolean } {
  const provided = (endpoint.operation['x-code-samples'] ?? []).filter((sample) => sample?.lang && sample?.source);
  if (provided.length > 0) {
    return {
      fromSpec: true,
      snippets: provided.map((sample, index) => ({
        key: slugify(sample.lang) || `sample-${index}`,
        label: sample.lang,
        language: inferSnippetLanguage(sample.lang),
        code: sample.source,
      })),
    };
  }
  return {
    fromSpec: false,
    snippets: [
      { key: 'curl', label: 'cURL', language: 'bash', code: buildCurl(endpoint, spec) },
      { key: 'javascript', label: 'JavaScript', language: 'javascript', code: buildJavaScript(endpoint, spec) },
      { key: 'python', label: 'Python', language: 'python', code: buildPython(endpoint, spec) },
    ],
  };
}

export function statusTone(statusCode: string): 'success' | 'redirect' | 'client' | 'server' | 'neutral' {
  const first = statusCode.charAt(0);
  if (first === '2') return 'success';
  if (first === '3') return 'redirect';
  if (first === '4') return 'client';
  if (first === '5') return 'server';
  return 'neutral';
}

export function countOperations(spec: OpenAPISpec): number {
  return Object.values(spec.paths).reduce((total, item) => {
    return total + Object.keys(item).filter((method) => ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)).length;
  }, 0);
}
