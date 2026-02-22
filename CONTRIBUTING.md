# Contributing to APIDocumer

Thanks for contributing.

## Workflow

1. Fork the repository.
2. Create a branch from `main`:
   - `feat/<name>` for features
   - `fix/<name>` for bug fixes
   - `docs/<name>` for docs updates
3. Make focused, reviewable changes.
4. Run checks locally before opening a PR.
5. Open a pull request with clear context.

## Local Setup

```bash
npm ci
npm run dev
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```

If your environment cannot run `next build` due SWC binary issues, mention that in your PR and include any available outputs.

## PR Guidelines

- Keep PRs scoped to one concern.
- Include screenshots/videos for UI changes.
- Explain behavior changes and compatibility impact.
- Add or update docs when behavior changes.

## Upstream vs Project-Specific Changes

APIDocumer can be used as a generic docs engine and as project-specific deployments.

- Send **generic improvements** (UI, parsing, SEO behavior, rendering features, bug fixes) to the upstream APIDocumer repository.
- Keep **project-specific content** (custom `openapi.yaml`, branding, API text, product copy) in your own deployment repository.

## Commit Messages

Use clear, imperative messages, for example:

- `feat: add support for operation x-code-samples`
- `fix: resolve mobile sidebar overflow`
- `docs: update deployment setup`

