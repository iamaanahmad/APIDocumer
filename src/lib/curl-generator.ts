"use client";

import type { OpenAPISpec, Endpoint } from '@/types/openapi';
import { buildCurl } from '@/lib/operation-utils';

export function generateCurl(endpoint: Endpoint, spec: OpenAPISpec): string {
  return buildCurl(endpoint, spec);
}
