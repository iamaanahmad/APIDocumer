import type { OpenAPISpec, SchemaObject, ReferenceObject } from '@/types/openapi';
import { resolveRef } from './openapi-parser';

function generatePrimitiveExample(schema: SchemaObject) {
  if (schema.example) return schema.example;
  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'email') return 'user@example.com';
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
  spec: OpenAPISpec
): any {
  if ('$ref' in schema) {
    const resolvedSchema = resolveRef(spec, schema.$ref);
    return resolvedSchema ? generateExampleFromSchema(resolvedSchema, spec) : null;
  }

  if (schema.example) return schema.example;

  switch (schema.type) {
    case 'object': {
      const example: { [key: string]: any } = {};
      if (schema.properties) {
        for (const propName in schema.properties) {
          example[propName] = generateExampleFromSchema(schema.properties[propName], spec);
        }
      }
      return example;
    }
    case 'array': {
      if (schema.items) {
        return [generateExampleFromSchema(schema.items, spec)];
      }
      return [];
    }
    default:
      return generatePrimitiveExample(schema);
  }
}
