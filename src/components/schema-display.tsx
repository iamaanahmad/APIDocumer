import type { OpenAPISpec, SchemaObject, ReferenceObject } from '@/types/openapi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resolveRef } from '@/lib/openapi-parser';
import { MarkdownDisplay } from './markdown-display';

interface SchemaDisplayProps {
  name: string;
  schema: SchemaObject | ReferenceObject;
  spec: OpenAPISpec;
}

function renderType(schema: SchemaObject | ReferenceObject, spec: OpenAPISpec): React.ReactNode {
  if ('$ref' in schema) {
    const refName = schema.$ref.split('/').pop();
    return <span className="text-blue-400">{refName}</span>;
  }

  if ('type' in schema) {
    if (schema.type === 'array' && schema.items) {
      return <>Array&lt;{renderType(schema.items, spec)}&gt;</>;
    }
    return <span className="text-purple-400">{schema.type}</span>;
  }

  return 'any';
}

export function SchemaDisplay({ name, schema, spec }: SchemaDisplayProps) {
  let resolvedSchema = schema;
  if ('$ref' in schema) {
    resolvedSchema = resolveRef(spec, schema.$ref);
  }

  if (!resolvedSchema) {
    return <p className="text-sm text-muted-foreground">Could not resolve schema reference.</p>
  }
  
  const isObject = 'type' in resolvedSchema && resolvedSchema.type === 'object' && resolvedSchema.properties;
  const isArrayOfObjects = 'type' in resolvedSchema && resolvedSchema.type === 'array' && resolvedSchema.items && '$ref' in resolvedSchema.items;

  if (!isObject && !isArrayOfObjects) {
      return null; // Or some other display for non-object schemas
  }

  let properties, required;
  let schemaName = name;

  if (isObject) {
    properties = (resolvedSchema as SchemaObject).properties;
    required = (resolvedSchema as SchemaObject).required;
  } else if (isArrayOfObjects) {
    const itemSchema = resolveRef(spec, (resolvedSchema as SchemaObject).items!['$ref']);
    if (itemSchema && itemSchema.properties) {
      properties = itemSchema.properties;
      required = itemSchema.required;
      schemaName = `${(resolvedSchema as SchemaObject).items!['$ref'].split('/').pop()} (in array)`;
    }
  }

  if (!properties) {
    return (
        <p className="text-muted-foreground text-sm">Schema details not available.</p>
    );
  }


  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold font-mono">{schemaName}</h4>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[200px]">Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(properties).map(([propName, propSchema]) => (
              <TableRow key={propName}>
                <TableCell>
                  <div className="font-mono font-medium text-foreground">{propName}</div>
                  {required?.includes(propName) && <div className="text-xs text-destructive">Required</div>}
                </TableCell>
                <TableCell className="font-mono">{renderType(propSchema, spec)}</TableCell>
                <TableCell>
                  {'description' in propSchema && <MarkdownDisplay content={propSchema.description} className="prose-p:m-0" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
