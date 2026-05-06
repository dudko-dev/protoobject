# protoobject — instructions for Claude

A universal class for creating any JSON objects and simple manipulations with them. Published to npm as `protoobject`.

## Stack

- TypeScript (`tsc`), targeting CJS + ESM dual build with type declarations.
- Node `>=16` runtime; CI tests on Node 20, 22 and 24.
- ESLint + Prettier.
- Test runner: `node --test` (no Jest/Mocha).

## Commands you must know

```bash
npm run lint          # ESLint over src/**/*.ts — must exit 0
npm run build         # Clean + tsc CJS + tsc ESM + tsc types + write package.json shims
npm run test:ts       # Primary test suite (TypeScript) used by autoupdate verification
npm run cov           # Coverage run; used by PR checks on Node 20/22/24
npm run test:sql      # SQL tests; only on Node >= 22
npm test              # Full suite — runs lint, all unit suites, browser-node, transformers
```

## Definition of "done" for any change you make

You are NOT done with a code change until **all three** of the following exit 0 in the working tree on the branch you're going to push:

```bash
npm run lint
npm run build
npm run test:ts
```

Run these explicitly with the `Bash` tool before your last commit on the branch. Do not assume "the change looks right" is sufficient — `tsc` errors and ESLint errors must be observed as exit code 0, not inferred. If any of them fail, fix the failure and re-run all three from a clean state until they all pass. Only then commit and push.

If `npm install` is needed (e.g. lockfile changed), run it with `--no-audit --no-fund` and ensure it returned 0 before running checks.

## Boundaries

- Do not modify product logic when fixing dependency-compatibility issues. Acceptable edits: type adjustments, renamed exports, breaking-change shims, ESLint-config tweaks for new rule defaults.
- Do not bump the package `version` manually. The autoupdate flow uses `npm version patch` or has the maintainer set the version on release.
- Do not edit `.github/workflows/build-and-deploy.yml` unless explicitly asked — it is the release pipeline.
- Do not push to `main` directly. Always work on the existing branch you were summoned to.

## When you are working on an autoupdate PR

- Branch will be `chore/autoupdate-<run_id>`.
- Goal: bring `npm run lint && npm run build && npm run test:ts` to green.
- Push compatibility fixes onto this branch. Each push re-runs `pr-checks.yml` automatically; you don't need to mention checks back to the maintainer until they're green.
- If a fix is impossible without changing product behavior, stop and leave a comment explaining what's blocked rather than guessing.

## CI quirks specific to this repo

This repo follows the unified `autoupdate-with-claude` baseline (same template across siblings). Several workarounds are intentional:
- `autoupdate.yml` uses `GITHUB_TOKEN` (not `TOKEN_FOR_WORKFLOW`) for unification across repos and explicitly dispatches `pr-checks.yml` after PR creation, because events created via `GITHUB_TOKEN` don't trigger `pull_request` workflows.
- `autoupdate.yml` dispatches `claude.yml` directly via `workflow_dispatch` (passing `branch` and `run_url` inputs) instead of relying on an `@claude` PR comment, since a comment posted via `GITHUB_TOKEN` would not fire `issue_comment` triggers.
- Releases are wired via `release-on-version-bump.yml` (push to main → detect `package.json` version change → force-recreate `vX.Y.Z` tag on main HEAD → dispatch `build-and-deploy.yml`).
- All actions pinned to the `@v4` line (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/download-artifact@v4`) because the runner image currently lacks `externals/node24`, breaking post-cleanup of `@v5/@v6` actions.

Do **not** "fix" any of the above by replacing dispatch calls with comment-based mentions, or by bumping action versions back to `@v5/@v6` — these are deliberate workarounds for current GitHub-side limitations.
