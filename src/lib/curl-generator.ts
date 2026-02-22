"use client";

import type { OpenAPISpec, Endpoint } from '@/types/openapi';
import { resolveRef } from '@/lib/openapi-parser';
import { generateExampleFromSchema } from '@/lib/example-generator';

export function generateCurl(endpoint: Endpoint, spec: OpenAPISpec): string {
  const { method, path } = endpoint;
  const serverUrl = spec.servers?.[0]?.url || '';
  let fullUrl = `${serverUrl}${path}`.replace(/\/$/, ''); // Remove trailing slash if any

  const parameters = (endpoint.operation.parameters?.map(p => '$ref' in p ? resolveRef(spec, p.$ref) : p) || []);

  // Replace path parameters
  const pathParams = parameters.filter(p => p.in === 'path');
  pathParams.forEach(p => {
    fullUrl = fullUrl.replace(`{${p.name}}`, p.example || `[${p.name.toUpperCase()}]`);
  });
  
  const queryParams = parameters.filter(p => p.in === 'query');
  if (queryParams.length > 0) {
    const queryString = queryParams.map(p => `${p.name}=${p.example || `[${p.name.toUpperCase()}]`}`).join('&');
    fullUrl += `?${queryString}`;
  }

  let curl = `curl -X ${method.toUpperCase()} "${fullUrl}"`;

  const headerParams = parameters.filter(p => p.in === 'header');
  headerParams.forEach(p => {
    curl += ` \\\n  -H "${p.name}: ${p.example || `[${p.name.toUpperCase()}]`}"`;
  });
  
  const requestBody = endpoint.operation.requestBody && ('$ref' in endpoint.operation.requestBody ? resolveRef(spec, endpoint.operation.requestBody.$ref) : endpoint.operation.requestBody);

  if (requestBody && requestBody.content && requestBody.content['application/json'] && requestBody.content['application/json'].schema) {
    const bodyExample = generateExampleFromSchema(requestBody.content['application/json'].schema, spec);
    curl += ` \\\n  -H "Content-Type: application/json"`;
    curl += ` \\\n  -d '${JSON.stringify(bodyExample, null, 2)}'`;
  }

  return curl;
}
