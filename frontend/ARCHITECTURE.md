# Frontend Folder Architecture

## Objective
Organize UI code by domain (feature-first) while keeping shared building blocks isolated and reusable.

## Current Structure
- `app/`: Next.js routes and layouts.
- `components/features/`: feature-scoped components.
- `components/shared/`: cross-feature reusable UI.
- `components/`: compatibility bridge files for legacy imports.
- `lib/`: clients and app utilities.
- `public/`: static assets.
- `tests/`: QA and e2e tests.

## Naming Rules
- Use `components/features/<area>/...` for domain-specific components.
- Use `components/shared/...` for common components used by multiple pages.
- Keep temporary re-export bridges in `components/` until all imports are migrated.
- Prefer imports from `@/components/features/...` and `@/components/shared/...`.

## Migration Policy
- New components must be created directly in `features` or `shared`.
- Do not add new root-level components in `components/` (except bridge files during migration).
- Remove bridge files once no import references remain.
