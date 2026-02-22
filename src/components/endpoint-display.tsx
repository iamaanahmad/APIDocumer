"use client";

import type { OpenAPISpec, Endpoint, ParameterObject, ReferenceObject, ResponseObject } from '@/types/openapi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MethodBadge } from './method-badge';
import { CodeBlock } from './code-block';
import { SchemaDisplay } from './schema-display';
import { generateExampleFromSchema } from '@/lib/example-generator';
import { resolveRef } from '@/lib/openapi-parser';
import { generateCurl } from '@/lib/curl-generator';
import { MarkdownDisplay } from './markdown-display';

interface EndpointDisplayProps {
  endpoint: Endpoint;
  spec: OpenAPISpec;
}

export function EndpointDisplay({ endpoint, spec }: EndpointDisplayProps) {
  const { path, method, operation } = endpoint;
  
  const parameters = (operation.parameters?.map(p => '$ref' in p ? resolveRef(spec, p.$ref) : p) || []) as ParameterObject[];
  const requestBody = operation.requestBody && ('$ref' in operation.requestBody ? resolveRef(spec, operation.requestBody.$ref) : operation.requestBody);
  const responses = operation.responses;

  const curlExample = generateCurl(endpoint, spec);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-4">
          <MethodBadge method={method} />
          <h1 className="text-2xl font-mono break-all font-semibold">{path}</h1>
        </div>
        {operation.summary && <p className="pt-2 text-lg text-muted-foreground">{operation.summary}</p>}
      </div>

      {operation.description && <MarkdownDisplay content={operation.description} />}

      <Tabs defaultValue="curl" className="w-full">
        <TabsList>
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="js">JavaScript</TabsTrigger>
        </TabsList>
        <TabsContent value="curl">
            <CodeBlock code={curlExample} language="bash" />
        </TabsContent>
        <TabsContent value="js">
            <CodeBlock code={`fetch("${spec.servers?.[0].url || ''}${path}")\n  .then(res => res.json())\n  .then(json => console.log(json))`} language="javascript" />
        </TabsContent>
      </Tabs>
      
      {parameters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parameters.map((param, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-mono font-medium">{param.name}</div>
                      {param.required && <div className="text-xs text-destructive">Required</div>}
                    </TableCell>
                    <TableCell><span className="font-mono bg-muted px-2 py-1 rounded-md text-muted-foreground text-xs">{param.in}</span></TableCell>
                    <TableCell><span className="font-mono text-sm">{param.schema && 'type' in param.schema ? param.schema.type : 'any'}</span></TableCell>
                    <TableCell>
                        <MarkdownDisplay content={param.description} className="prose-p:m-0" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {requestBody?.content && (
        <Card>
          <CardHeader>
            <CardTitle>Request Body</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="example">
              <TabsList>
                <TabsTrigger value="example">Example</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
              </TabsList>
              <TabsContent value="example" className="mt-4">
                {Object.entries(requestBody.content).map(([mediaType, mediaTypeObject]) => (
                  mediaTypeObject.schema && (
                    <div key={mediaType}>
                       <p className="text-sm font-mono text-muted-foreground mb-2">{mediaType}</p>
                       <CodeBlock code={JSON.stringify(generateExampleFromSchema(mediaTypeObject.schema, spec), null, 2)} language="json" />
                    </div>
                  )
                ))}
              </TabsContent>
              <TabsContent value="schema" className="mt-4">
                {Object.entries(requestBody.content).map(([mediaType, mediaTypeObject]) => (
                  mediaTypeObject.schema && (
                    <SchemaDisplay key={mediaType} name={mediaType} schema={mediaTypeObject.schema} spec={spec} />
                  )
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {responses && (
        <Card>
          <CardHeader>
            <CardTitle>Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(responses).map(([statusCode, responseObject]) => {
              const resolvedResponse = '$ref' in responseObject ? resolveRef(spec, responseObject.$ref) : responseObject;
              if (!resolvedResponse) return null;

              const { description, content } = resolvedResponse as ResponseObject;

              return (
                <div key={statusCode} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${statusCode.startsWith('2') ? 'text-green-500' : statusCode.startsWith('4') ? 'text-red-500' : 'text-orange-500'}`}>{statusCode}</span>
                    <h4 className="font-medium">{description}</h4>
                  </div>
                  {content && (
                    <div className="mt-4">
                      <Tabs defaultValue="example">
                         <TabsList>
                           <TabsTrigger value="example">Example</TabsTrigger>
                           <TabsTrigger value="schema">Schema</TabsTrigger>
                         </TabsList>
                         <TabsContent value="example" className="mt-4">
                           {Object.entries(content).map(([mediaType, mediaTypeObject]) => (
                             mediaTypeObject.schema && (
                               <div key={mediaType}>
                                  <p className="text-sm font-mono text-muted-foreground mb-2">{mediaType}</p>
                                  <CodeBlock key={mediaType} code={JSON.stringify(generateExampleFromSchema(mediaTypeObject.schema, spec), null, 2)} language="json" />
                               </div>
                             )
                           ))}
                         </TabsContent>
                         <TabsContent value="schema" className="mt-4">
                          {Object.entries(content).map(([mediaType, mediaTypeObject]) => (
                             mediaTypeObject.schema && (
                               <SchemaDisplay key={mediaType} name={mediaType} schema={mediaTypeObject.schema} spec={spec} />
                             )
                           ))}
                         </TabsContent>
                       </Tabs>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
