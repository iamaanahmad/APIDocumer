"use client";

import type { OpenAPISpec, Endpoint, ParameterObject, ReferenceObject, SchemaObject } from '@/types/openapi';
import { resolveRef } from '@/lib/openapi-parser';
import { generateCurl } from '@/lib/curl-generator';
import { generateExampleFromSchema } from '@/lib/example-generator';
import { MethodBadge } from '@/components/method-badge';
import { SchemaDisplay } from '@/components/schema-display';
import { CodeBlock } from '@/components/code-block';
import { MarkdownDisplay } from '@/components/markdown-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EndpointDisplayProps {
  endpoint: Endpoint;
  spec: OpenAPISpec;
}

export function EndpointDisplay({ endpoint, spec }: EndpointDisplayProps) {
  const { method, path, operation } = endpoint;
  
  // Resolve parameters
  const parameters = (operation.parameters?.map(p => 
    '$ref' in p ? resolveRef(spec, p.$ref) : p
  ) || []) as ParameterObject[];

  const pathParams = parameters.filter(p => p.in === 'path');
  const queryParams = parameters.filter(p => p.in === 'query');
  const headerParams = parameters.filter(p => p.in === 'header');

  // Resolve request body
  const requestBody = operation.requestBody && (
    '$ref' in operation.requestBody 
      ? resolveRef(spec, operation.requestBody.$ref) 
      : operation.requestBody
  );

  // Generate cURL example
  const curlExample = generateCurl(endpoint, spec);

  // Get responses
  const responses = operation.responses || {};
  const responseKeys = Object.keys(responses).sort();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MethodBadge method={method} />
          <code className="text-lg font-mono font-semibold">{path}</code>
        </div>
        {operation.summary && (
          <h2 className="text-2xl font-bold">{operation.summary}</h2>
        )}
        {operation.description && (
          <MarkdownDisplay content={operation.description} className="text-muted-foreground" />
        )}
      </div>

      <Separator />

      {/* Parameters Section */}
      {(pathParams.length > 0 || queryParams.length > 0 || headerParams.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pathParams.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">Path Parameters</h4>
                <ParametersTable parameters={pathParams} spec={spec} />
              </div>
            )}
            {queryParams.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">Query Parameters</h4>
                <ParametersTable parameters={queryParams} spec={spec} />
              </div>
            )}
            {headerParams.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">Header Parameters</h4>
                <ParametersTable parameters={headerParams} spec={spec} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Body Section */}
      {requestBody && requestBody.content && (
        <Card>
          <CardHeader>
            <CardTitle>Request Body</CardTitle>
            {requestBody.description && (
              <CardDescription>
                <MarkdownDisplay content={requestBody.description} />
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {requestBody.content['application/json']?.schema && (
              <SchemaDisplay 
                name="Request Body" 
                schema={requestBody.content['application/json'].schema} 
                spec={spec} 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Responses Section */}
      {responseKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={responseKeys[0]} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${responseKeys.length}, minmax(0, 1fr))` }}>
                {responseKeys.map(statusCode => (
                  <TabsTrigger key={statusCode} value={statusCode}>
                    {statusCode}
                  </TabsTrigger>
                ))}
              </TabsList>
              {responseKeys.map(statusCode => {
                const response = '$ref' in responses[statusCode] 
                  ? resolveRef(spec, responses[statusCode].$ref) 
                  : responses[statusCode];
                
                return (
                  <TabsContent key={statusCode} value={statusCode} className="space-y-4">
                    {response.description && (
                      <MarkdownDisplay content={response.description} className="text-sm text-muted-foreground" />
                    )}
                    {response.content?.['application/json']?.schema && (
                      <div className="space-y-4">
                        <SchemaDisplay 
                          name={`Response (${statusCode})`} 
                          schema={response.content['application/json'].schema} 
                          spec={spec} 
                        />
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Example Response</h4>
                          <CodeBlock 
                            code={JSON.stringify(
                              generateExampleFromSchema(response.content['application/json'].schema, spec),
                              null,
                              2
                            )} 
                            language="json"
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Code Examples Section */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock code={curlExample} language="bash" />
        </CardContent>
      </Card>
    </div>
  );
}

function ParametersTable({ parameters, spec }: { parameters: ParameterObject[]; spec: OpenAPISpec }) {
  return (
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
          {parameters.map((param) => (
            <TableRow key={param.name}>
              <TableCell>
                <div className="font-mono font-medium">{param.name}</div>
                {param.required && <Badge variant="destructive" className="text-xs mt-1">Required</Badge>}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {param.schema && '$ref' in param.schema 
                  ? param.schema.$ref.split('/').pop() 
                  : param.schema && 'type' in param.schema 
                    ? param.schema.type 
                    : 'any'}
              </TableCell>
              <TableCell>
                {param.description && (
                  <MarkdownDisplay content={param.description} className="prose-p:m-0" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
