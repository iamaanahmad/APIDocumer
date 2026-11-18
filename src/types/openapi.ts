export interface OpenAPISpec {
  openapi: string;
  info: InfoObject;
  servers?: ServerObject[];
  tags?: TagObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  externalDocs?: ExternalDocumentationObject;
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  'x-logo'?: {
    url: string;
    altText?: string;
  };
  'x-keywords'?: string[];
  /** Social preview image for Open Graph / Twitter cards. Recommended size 1200x630. */
  'x-og-image'?: string | { url: string; alt?: string };
  contact?: { name?: string; url?: string; email?: string };
}

export interface ServerObject {
  url: string;
  description?: string;
}

export interface TagObject {
  name: string;
  description?: string;
}

export interface PathsObject {
  [path: string]: PathItemObject;
}

export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
  parameters?: (ParameterObject | ReferenceObject)[];
  requestBody?: RequestBodyObject | ReferenceObject;
  responses: ResponsesObject;
  security?: SecurityRequirementObject[];
  'x-code-samples'?: Array<{
    lang: string;
    source: string;
  }>;
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  example?: any;
  schema?: SchemaObject | ReferenceObject;
}

export interface RequestBodyObject {
  description?: string;
  content: { [mediaType: string]: MediaTypeObject };
  required?: boolean;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject | ReferenceObject;
}

export interface ResponseObject {
  description: string;
  content?: { [mediaType: string]: MediaTypeObject };
}

export interface MediaTypeObject {
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: { [name: string]: { summary?: string; value?: any } };
}

export interface SchemaObject {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  format?: string;
  properties?: { [name: string]: SchemaObject | ReferenceObject };
  items?: SchemaObject | ReferenceObject;
  required?: string[];
  description?: string;
  example?: any;
  default?: any;
  enum?: any[];
  nullable?: boolean;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allOf?: (SchemaObject | ReferenceObject)[];
  oneOf?: (SchemaObject | ReferenceObject)[];
  anyOf?: (SchemaObject | ReferenceObject)[];
  additionalProperties?: boolean | SchemaObject | ReferenceObject;
  $ref?: string;
}

export interface ReferenceObject {
  $ref: string;
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'mutualTLS';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
}

export interface ComponentsObject {
  schemas?: { [name: string]: SchemaObject | ReferenceObject };
  securitySchemes?: { [name: string]: SecuritySchemeObject | ReferenceObject };
}

export interface SecurityRequirementObject {
  [schemeName: string]: string[];
}

export interface ExternalDocumentationObject {
  description?: string;
  url: string;
}

export interface Endpoint {
  path: string;
  method: string;
  operation: OperationObject;
}
