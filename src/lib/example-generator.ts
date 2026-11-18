import type { OpenAPISpec, SchemaObject, ReferenceObject } from '@/types/openapi';
import { resolveRef } from './openapi-parser';

const MAX_DEPTH = 6;

function generatePrimitiveExample(schema: SchemaObject) {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];
  switch (schema.type) {
    case 'string':
      // Deterministic values keep server and client renders identical.
      if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
      if (schema.format === 'date') return '2024-01-01';
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
      if (schema.format === 'uri' || schema.format === 'url') return 'https://example.com';
      return 'string';
    case 'number':
      return 123.45;
    case 'integer':
      return 123;
    case 'boolean':
      return true;
    default:
      return 'unknown';
  }
}

export function generateExampleFromSchema(
  schema: SchemaObject | ReferenceObject,
  spec: OpenAPISpec,
  depth = 0
): any {
  if (depth > MAX_DEPTH) return null;

  if ('$ref' in schema && schema.$ref) {
    const resolvedSchema = resolveRef(spec, schema.$ref);
    return resolvedSchema ? generateExampleFromSchema(resolvedSchema, spec, depth + 1) : null;
  }

  const s = schema as SchemaObject;
  if (s.example !== undefined) return s.example;

  if (s.allOf?.length) {
    return s.allOf.reduce<Record<string, any>>((acc, part) => {
      const partExample = generateExampleFromSchema(part, spec, depth + 1);
      return partExample && typeof partExample === 'object' && !Array.isArray(partExample) ? { ...acc, ...partExample } : acc;
    }, {});
  }
  const variant = s.oneOf?.[0] ?? s.anyOf?.[0];
  if (variant) return generateExampleFromSchema(variant, spec, depth + 1);

  switch (s.type) {
    case 'object': {
      const example: { [key: string]: any } = {};
      if (s.properties) {
        for (const propName in s.properties) {
          example[propName] = generateExampleFromSchema(s.properties[propName], spec, depth + 1);
        }
      }
      return example;
    }
    case 'array': {
      if (s.items) {
        return [generateExampleFromSchema(s.items, spec, depth + 1)];
      }
      return [];
    }
    default:
      if (!s.type && s.properties) return generateExampleFromSchema({ ...s, type: 'object' }, spec, depth + 1);
      return generatePrimitiveExample(s);
  }
}
