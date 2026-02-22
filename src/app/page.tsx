import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { OpenAPISpec } from '@/types/openapi';
import { getTaggedEndpoints } from '@/lib/openapi-parser';
import { DocViewer } from '@/components/doc-viewer';

async function getInitialSpec() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'openapi.yaml');
    const yamlText = await fs.readFile(filePath, 'utf-8');
    const loadedSpec = yaml.load(yamlText) as OpenAPISpec;
    // Basic validation
    if (loadedSpec && loadedSpec.openapi && loadedSpec.info && loadedSpec.paths) {
      return loadedSpec;
    }
    return null;
  } catch (e) {
    console.error("Could not load initial 'openapi.yaml':", e);
    return null;
  }
}

export default async function Home() {
  const initialSpec = await getInitialSpec();
  const taggedEndpoints = getTaggedEndpoints(initialSpec);

  return (
    <DocViewer 
      initialSpec={initialSpec} 
      initialTaggedEndpoints={taggedEndpoints} 
    />
  );
}
