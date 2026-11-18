import { loadOpenApiSpec } from '@/lib/openapi-loader';
import { generateMarkdown } from '@/lib/export-markdown';

export const dynamic = 'force-static';

export async function GET() {
  const spec = await loadOpenApiSpec();
  return new Response(generateMarkdown(spec), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
