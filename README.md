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
- optional `info.x-og-image` (URL, or `{ url, alt }`), a 1200x630 image for social previews

These are used to build page metadata (title, description, keywords, Open Graph, Twitter cards, and JSON-LD). The meta description is the first paragraph of `info.description`, converted to plain text, so start the description with a one-sentence summary.

## SEO

Every build emits a canonical URL, `robots.txt`, `sitemap.xml`, Open Graph/Twitter tags, and `WebSite` structured data. All endpoints are rendered into the static HTML.

Absolute URLs need the public address of the docs site, which is resolved in this order:

1. `NEXT_PUBLIC_SITE_URL`, for example `https://docs.example.com` (set it in your host's build environment, or as a repository variable for the GitHub Pages workflow).
2. `VERCEL_PROJECT_PRODUCTION_URL`, set automatically on Vercel.
3. The GitHub Pages URL, set automatically by `.github/workflows/deploy.yml`.

If none is available, the canonical URL and sitemap entries are omitted rather than guessed. The API server URL from `servers` is never used, because the docs and the API usually live on different hosts.

The site icon lives in `src/app/` (`icon.svg`, `favicon.ico`, `apple-icon.png`). Replace those files to use your own branding.

## AI and LLM Access

Every build also publishes machine-readable versions of your documentation, generated from the same `openapi.yaml`:

| File | Purpose |
| --- | --- |
| `/llms.txt` | Short index following the [llms.txt](https://llmstxt.org/) convention: summary, base URL, auth, and a link per endpoint. |
| `/llms-full.txt` | The whole documentation as one Markdown file with resolved parameters, field lists, responses, and example requests. |
| `/openapi.yaml` | The raw OpenAPI specification. |

The footer links to all three, and the "Ask AI" menu hands assistants the `/llms-full.txt` URL.

Set `NEXT_PUBLIC_SITE_URL` (for example `https://docs.example.com`) at build time so links in `llms.txt`, the canonical URL, and the `rel="alternate"` Markdown link are absolute. Without it, links are relative to the site root.

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
