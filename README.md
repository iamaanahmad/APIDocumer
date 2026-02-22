# APIDocumer

APIDocumer is a Next.js-based OpenAPI documentation viewer for static hosting. It loads `public/openapi.yaml`, groups endpoints by tags, and renders endpoint details, schemas, and examples in a searchable UI.

## Features

- OpenAPI 3.x viewer with sidebar navigation by tags
- Full-width, responsive documentation layout
- Endpoint search (path, method, summary, description, tag)
- Request/response schema and example rendering
- SEO-aware metadata generated from OpenAPI spec fields
- Static export support for GitHub Pages

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS + Radix UI

## Project Structure

- `src/app/page.tsx`: server entry, OpenAPI loader, and SEO metadata generation
- `src/components/doc-viewer.tsx`: main documentation UI
- `src/components/endpoint-display.tsx`: endpoint details renderer
- `src/lib/openapi-parser.ts`: tag grouping and `$ref` helpers
- `public/openapi.yaml`: source OpenAPI spec loaded at build/runtime
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Run dev server:

```bash
npm run dev
```

3. Open `http://localhost:9002`.

## Build and Export

Generate production static output:

```bash
npm run deploy
```

This runs `next build` (with `output: 'export'`) and creates `out/` with `.nojekyll` for GitHub Pages compatibility.

## Deployment (GitHub Pages)

This repository includes `.github/workflows/deploy.yml` which:

- installs dependencies with `npm ci`
- builds static output via `npm run deploy`
- uploads `out/` as the Pages artifact
- deploys to GitHub Pages

### Required Repository Settings

1. In GitHub, go to **Settings > Pages**.
2. Set source to **GitHub Actions**.
3. Ensure the default branch for deployment is `main`.

## OpenAPI Source

APIDocumer reads documentation data from `public/openapi.yaml`.

For best SEO and discoverability, include high-quality fields in your spec:

- `info.title`
- `info.description`
- `info.version`
- `servers[0].url`
- optional `info.x-keywords` (string array)

These are used to build page metadata (title, description, keywords, Open Graph, and Twitter cards).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with clear commit messages
4. Open a pull request with:
   - what changed
   - why it changed
   - screenshots for UI changes

## Quality Checks

Use these before opening a PR:

```bash
npm run typecheck
npm run lint
npm run build
```

## License

Add your preferred open-source license file (for example `MIT`) and update this section accordingly.
