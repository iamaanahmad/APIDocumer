import { loadOpenApiSpec } from '@/lib/openapi-loader';
import { buildLlmsTxt } from '@/lib/llms';

export const dynamic = 'force-static';

export async function GET() {
  const spec = await loadOpenApiSpec();
  return new Response(buildLlmsTxt(spec), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
