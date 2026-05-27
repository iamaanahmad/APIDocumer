import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { OpenAPISpec } from '@/types/openapi';

export async function loadOpenApiSpec(): Promise<OpenAPISpec | null> {
    try {
        const filePath = path.join(process.cwd(), 'public', 'openapi.yaml');
        const yamlText = await fs.readFile(filePath, 'utf-8');
        const loadedSpec = yaml.load(yamlText) as OpenAPISpec;

        if (loadedSpec?.openapi && loadedSpec?.info && loadedSpec?.paths) {
            return loadedSpec;
        }

        return null;
    } catch (error) {
        console.error("Could not load 'openapi.yaml':", error);
        return null;
    }
}
