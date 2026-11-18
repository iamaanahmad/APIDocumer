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
        const operation = (spec.paths[path] as any)[method];
        if (operation && typeof operation === 'object') {
          allEndpoints.push({ path, method, operation });
        }
      }
    }
  }

  // Declared tags keep the spec order. Tags used only by operations are appended.
  const groups = new Map<string, TaggedEndpoints>();
  (spec.tags || []).forEach((tag) => groups.set(tag.name, { tag, endpoints: [] }));

  // Each operation is listed once, under its first tag, so anchors stay unique.
  allEndpoints.forEach((endpoint) => {
    const tagName = endpoint.operation.tags?.[0] ?? 'Endpoints';
    if (!groups.has(tagName)) {
      groups.set(tagName, { tag: { name: tagName }, endpoints: [] });
    }
    groups.get(tagName)!.endpoints.push(endpoint);
  });

  return Array.from(groups.values()).filter((group) => group.endpoints.length > 0);
}