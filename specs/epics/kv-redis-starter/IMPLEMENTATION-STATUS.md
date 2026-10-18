# kv-redis-starter (KR) — Implementation status

As-built ≠ intent. This file records what actually shipped, and every place
the code departed from `design.md` or from the upstream template.

| Milestone | State | PR |
|---|---|---|
| KR0 — the spec | ✅ Shipped | [#1](https://github.com/sourceplane/kv-redis-starter/pull/1) |
| KR1 — the counter on Workers KV | ✅ Shipped | [#2](https://github.com/sourceplane/kv-redis-starter/pull/2) |
| KR2 — the KV namespace from Terraform | ✅ Shipped (validated; apply gated on a linked workspace) | [#3](https://github.com/sourceplane/kv-redis-starter/pull/3) |
| KR3 — ready to instantiate | ✅ Shipped | [#4](https://github.com/sourceplane/kv-redis-starter/pull/4) |
| KR4 — a baseline, in one landing | ✅ Shipped (offline-proven; no live bootstrap yet, risk KR-G) | [#5](https://github.com/sourceplane/kv-redis-starter/pull/5) (KR-5), tagged `baseline-v1` |
| KR5 — the cirrus standard | ✅ Shipped | KR-6 — on `main` after `baseline-v1`, not yet tagged |

## Departures from the upstream template

### `components/view-counter.tsx` reads and writes Workers KV

`createClient({ url }).connect()` + `incr('views')` became
`getCloudflareContext().env.VIEWS` `get`/`put`. The `redis` dependency is
gone; no `REDIS_URL`/`KV_URL`.

### Page copy and links

"Redis on Vercel" → "KV on Cloudflare"; "Announcing Redis" → "Announcing
KV"; the deploy button → this repository; the layout title → "KV Next.js
Starter".

### eslint-config-next 16 flat config, Next 16.3.8, React 19 types

The template pinned `eslint-config-next 13.3.0` with an `.eslintrc.json`
and React 18 types against React 19.

### `next.config.mjs` (ESM) with `initOpenNextCloudflareForDev()`

The template's CommonJS `next.config.js` is an ESM module now (the Next 16
lint rules reject `require()`), with the OpenNext dev hook so `next dev`
sees the KV binding through wrangler's platform proxy; `output: standalone`
and the monorepo tracing root are the Workers build's.

### The `@ts-expect-error Async Server Component` directive is gone

React 19's types accept async server components; the directive became an
error.

### The page's name and source link come from `app/site.ts` (KR4)

`SITE_NAME` is the heading ("KV on Cloudflare") and the `<title>` (which was
"KV Next.js Starter"); `SOURCE_URL` is the "Deploy your own" pill and the
footer's Source link. The footer linked the upstream template's directory,
whose URL contains this baseline's slug — the rename would have rewritten it
into a broken link — so it links the product's repository; the upstream is
credited in `apps/web/README.md` by its parent directory.

### The Open Graph image is absolute on the request's origin (KR4)

The layout's metadata is `generateMetadata`, with `metadataBase` from the
request's host (`requestOrigin` in `app/site.ts`). The upstream relied on
Vercel's `VERCEL_URL`; unset, Next resolved the image against
`http://localhost:3000`.

### `apps/web/README.md` is the app's, not the template's (KR4)

The upstream README advertised "Deploy with Vercel" and `REDIS_URL`, and it
ships into every product.

## Departures from the port (KR4)

| What | Before | After | Why |
|---|---|---|---|
| `apps/web/wrangler.jsonc` | git-ignored, rendered by the build | committed as the fixture render, GENERATED banner; Checks diffs it | the deploy lane checks it exists before the build (risk KR-E) |
| dev's render | `live.mjs --env dev` → no document → red | `--fixture wiring.fixture.json --fixture-envs dev`; the fixture has a `dev` entry | dev is verify-only; no root applies there (KR-F) |
| `apps/web` → `cloudflare-kv` | `dependsOn` in the default mode (a PR's web lane waited on the KV plan) | `mode: enforced`, `modeRules` advisory on `github-pull-request` | the one landing's order on main; a PR deploys nothing (cirrus-baseline v22's shape) |
| `apps/web` smoke | `grep 'KV on Cloudflare'` | a rendered count (`N views`) | the name is the owner's; only a Worker that reached its namespace renders a count |
| `ci.yml` gate | `vars.ORUN_CI == 'true'` | skip only while `intent.yaml` names `ws_CHANGE_ME` | a bootstrap cannot set a repository variable |
| `checks.yml` | push to main + PRs | PRs + `workflow_dispatch` | `orun.run/watch@v1` takes the newest run on the merge sha from ANY workflow |
| stack-tectonic | 0.18.2 | 0.19.0 | first-deploy retry and smoke backoff; not 0.20.0, whose lane-scoped install Next 16's Turbopack refuses |
| orun lane pin | v2.78.0 | v2.78.4 | cirrus-baseline's and portfolio's pin |
| `packages/` | absent — `orun plan` failed: `failed to access discovery root packages` | `packages/.gitkeep` | the discovery roots are required |
| `intent.yaml` docs pages | `specs/epics/…` | `ai/context/*` | the pages must exist in a product |
| the KV root's prose and names | Cirrus's "api-edge idempotency replay store", "this fork"; `idempotency_namespace_title`, `adopt_idempotency_namespace` | the counter's namespace; `app_kv_title`, `adopt_app_kv` | it ships into every product; no resource address changed |
| `tooling/wire/render.mjs` | copied the template's header comment | writes a GENERATED banner | the committed render must say it is one |
| `tasks/KR-1..4` | no `metadata` | `metadata.name` and `title` | `orun work check` (≥ v2.79) refused them |

## The cirrus standard (KR5)

Nothing about the counter changed. What changed is the baseline around it:

| What | Before | After | Why |
|---|---|---|---|
| orun pin | `kiox.yaml` (v2.15.0) + `kiox.lock`, shipped to every product | gone; orun is pinned where it runs, the `orun-action` `version:` in each workflow | nothing ran the kiox pin, and it disagreed with the lanes (v2.78.4) |
| `root-kiox`, `root-kiox-lock` modules | in `01-product` | removed (`testing/phases.test.sh` and the rebrand's skip list follow) | a product is placed with 73 files: 66 − 2 kiox + 9 docs pages |
| component docs | none | `apps/web/docs/`, `infra/terraform/cloudflare-kv/docs/`, `tests/web/docs/` — `overview.md`, `architecture.md`, `runbook.md` | cirrus-baseline documents every component; the workspace Docs library renders `docs/` beside each `component.yaml` |
| how the docs stay true | — | `tooling/catalog/gen-component-docs.py` derives them from the manifest, the Worker config, Terraform, migrations and package scripts; Baseline CI runs it with `--check` | a hand-written copy of a manifest drifts silently |
| context pack | `operations.md`, `deployment.md` | plus `current.md`, `decisions.md`, `open-risks.md` | cirrus-baseline's shape; the three new pages are this repository's own and no module places them (the leak gate still allows exactly two) |
| status | KR4 "this PR (KR-5), to be tagged" | KR4 shipped and tagged `baseline-v1` | the tag existed; the documents had not caught up |

## Verified (KR5)

- `testing/{manifest,phases,coverage,rebrand,retouch,bootstrap-defer,wire}.test.sh`
  green; `gen-component-docs.py --check` green (3 components, 9 pages).
- `orun new --status` at v2.58.11: `01-product` 73 files, `02-docs`
  hook-only.
- `testing/leak.test.sh` at v2.58.11: 73 files derived; ai/context still
  exactly the two declared pages; 66 shipped sources name no factory path.
- `testing/placement.test.sh` at v2.78.4 (the workflow's pin for it): 73
  files placed, both landings, branded, re-tenanted; the product's own plan
  applies `cloudflare-kv` on stage and prod before `web` deploys; on a pull
  request nothing waits; the 02-docs merge plans 0 jobs; `--resume` changes
  nothing.
- `pnpm install --frozen-lockfile`, `wire:fixture` (the tree unchanged),
  `typecheck`, `lint`, `test` (7 tests), `build` green.
- `testing/e2e.test.sh` at v2.78.4 green: the stage lane in a staged job
  tree binding `VIEWS` to the stage document's id, `wrangler dev`, the
  component's own smoke, the count 2 → 3, the Open Graph image, the assets
  and a 404 the product's own.
- `orun task check KR-6` complete.

## Verified (KR4)

- `orun new --status` reads the blueprint at v2.58.11 (the bootstrap floor),
  v2.78.4 (the lane pin) and v2.79.0: `01-product` 66 files, `02-docs`
  hook-only. `orun validate` and `orun work check` clean.
- `testing/{manifest,phases,coverage,rebrand,retouch,bootstrap-defer,wire}.test.sh`
  green.
- `testing/leak.test.sh`: 66 files derived; nothing of the factory, nothing
  local or built, no provenance prose; 59 shipped sources name no factory
  path.
- `testing/placement.test.sh` (fixture "Sam's Views & Counts" /
  `acme-inc/acme-kv-starter`): two landings; rebrand `--verify` clean; the
  page, the Worker, the KV titles and every secret ref the product's; no
  file names a factory path; workspace re-tenanted, `work:` stripped,
  promotion and dev lanes restored; record rendered. The product's own
  `orun plan --trigger github-push-main` for the 01-product merge:
  `cloudflare-kv` apply on stage and prod at lane level 0, `web` deploy at
  level 1, each waiting on its own environment's apply alone; on a pull
  request `web` waits on nothing; the 02-docs merge plans 0 jobs;
  `--resume` changes nothing. Green under v2.78.4 and v2.79.0; refused
  under v2.58.11 (risk KR-H).
- `testing/e2e.test.sh`: the 01-product landing passes the Checks sequence
  (the committed config is the fixture render); in the job tree staged as
  orun stages it, the stage lane's `verify-app-structure`, `build-app` (the
  live render, from a stage document in the job's environment),
  `verify-build-output` and `deploy-dry-run` pass, binding `VIEWS` to the
  document's id; `wrangler dev` serves the built Worker; the component's own
  smoke passes; `/` carries the product's name, links and origin, its count
  goes up by exactly one per request, and the Open Graph image, the static
  assets and a 404 are the product's own. Red at `verify-app-structure` with
  KR3's ignored `wrangler.jsonc`.
- `terraform validate` green on `infra/terraform/cloudflare-kv` (1.15.3).
- Not verified: a live bootstrap against a workspace (risk KR-G).

## Verified (KR1–KR3)

- Local: `pnpm run wire:fixture`, `pnpm typecheck`, `pnpm lint`, `pnpm test`
  (2 tests), `pnpm build` green; `wrangler dev` over the built Worker with a
  local namespace: `/` 200 ("KV on Cloudflare"), the count 4 → 5 → 6 across
  three requests.
- `terraform validate` green on `infra/terraform/cloudflare-kv`.
- CI: `Checks` green on #2 and #3.
- Not verified: the KV apply and a live deploy — both need the product
  linked to an Orun workspace with a Cloudflare connection (`ORUN_CI`).

## Versions

| Package | Version | Why |
|---|---|---|
| next | 16.3.8 | newest inside `@opennextjs/cloudflare` 1.20.11's peer range |
| @opennextjs/cloudflare | ^1.20.11 | `getCloudflareContext` for the binding; static-assets cache + `populateCache local` |
| wrangler | ^4.151.0 | compatibility_date 2026-10-01 |
