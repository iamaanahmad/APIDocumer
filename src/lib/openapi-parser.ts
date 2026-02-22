import type { OpenAPISpec, Endpoint, TagObject } from '@/types/openapi';

export interface TaggedEndpoints {
  tag: TagObject;
  endpoints: Endpoint[];
}

// A function to resolve $ref pointers. A simple version for this app.
export function resolveRef(spec: OpenAPISpec, ref: string): any {
  if (!ref.startsWith('#/')) {
    // We only handle internal refs
    return null;
  }
  const parts = ref.substring(2).split('/');
  let current: any = spec;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}


export function getTaggedEndpoints(spec: OpenAPISpec | null): TaggedEndpoints[] {
  if (!spec) return [];

  const allEndpoints: Endpoint[] = [];
  for (const path in spec.paths) {
    for (const method in spec.paths[path]) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        const operation = spec.paths[path][method as keyof typeof spec.paths[path]];
        if(operation && typeof operation === 'object' && 'tags' in operation) {
          allEndpoints.push({ path, method, operation });
        }
      }
    }
  }

  const tags = spec.tags || [];
  const taggedEndpoints: TaggedEndpoints[] = tags.map(tag => ({
    tag,
    endpoints: allEndpoints.filter(ep => ep.operation.tags?.includes(tag.name)),
  }));

  // Handle endpoints with no tags
  const untaggedEndpoints = allEndpoints.filter(ep => !ep.operation.tags || ep.operation.tags.length === 0);
  if (untaggedEndpoints.length > 0) {
    taggedEndpoints.push({
      tag: { name: 'Untagged', description: 'Endpoints without a tag' },
      endpoints: untaggedEndpoints,
    });
  }

  return taggedEndpoints.filter(group => group.endpoints.length > 0);
}
