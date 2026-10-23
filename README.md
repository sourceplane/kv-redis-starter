# kv-redis-starter

Vercel's [Redis Next.js Starter](https://github.com/vercel/examples/tree/main/storage/kv-redis-starter)
— a page whose view counter increments a key on every request — running on
**Cloudflare Workers + Static Assets** through
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), with the
counter in a **Workers KV** namespace provisioned by Terraform through
[Orun](https://github.com/sourceplane/orun), and packaged as an **Orun
baseline**: one command takes a new product from nothing to live on stage
and prod, in its own repository, under its own name — in ONE landing.

The page is the template's; the counter's store is KV instead of Redis. What
the baseline adds is everything needed to make a copy of it somebody else's,
built the way [cirrus-baseline](https://github.com/sourceplane/cirrus-baseline)
is since its one-landing bootstrap. See
[`specs/epics/kv-redis-starter`](specs/epics/kv-redis-starter/README.md)
for the design, the milestones and the as-built status.

## Instantiating a product

```bash
git clone --depth 1 --branch <baseline-tag> https://github.com/sourceplane/kv-redis-starter
cd kv-redis-starter
orun new --blueprint repo-blueprint.yaml --out ~/sites/acme-views --run-hooks --resume \
  --set reponame=acme-views --set productname="Acme Views" \
  --set githuborg=acme-inc --set subdomain=<workers-dev-subdomain>
```

Or, once the platform's registry lists it, from the Orun console (Baselines →
`kv-redis-starter` → Build). Two phases: **`01-product`** creates the
repository and lands the whole product as ONE pull request — intent, CI,
tooling, the KV root, the page and its tests — and one convergence applies
the KV namespace on stage and prod and then deploys the page with its id;
**`02-docs`** records the live deployment from probed facts.
**[BOOTSTRAP.md](BOOTSTRAP.md)** is the operator guide;
[docs/phases/](docs/phases/README.md) has a page per phase.

The new repository receives the **product only** — the app, its KV root, its
tests, its CI, its tooling, a README and an `AGENTS.md` of its own and its
operating contract — renamed throughout to the product's name, repository,
Cloudflare Worker and namespace titles. None of this repository's machinery
ships.

| What makes it a baseline | Where |
|---|---|
| The console card (inputs, secrets, programme) | `blueprint.yaml` |
| The build document (modules, phases, hooks) | `repo-blueprint.yaml` |
| This tree's identity, and the bootstrap's task contracts | `.baseline/` |
| The rename engine | `tooling/rebrand/rebrand.mjs` |
| The bootstrap's helpers (deferrals, redeploy marker, work-tree strip) | `tooling/bootstrap/` |
| The deployment-record renderer | `hooks/render-deployment-docs.sh` |
| The product's README, its `AGENTS.md` and its context pack | `.baseline/product/`, `ai/context/` |
| The baseline's tests: contract, wiring, leak, offline bootstrap, end to end | `testing/`, `.github/workflows/baseline.yml` |
| Cutting a `baseline-vN` tag | `.github/workflows/tag.yml` |

## What is here (the product)

| Surface | Where |
|---|---|
| The page | `apps/web/app/page.tsx` |
| The site's name and source link | `apps/web/app/site.ts` |
| The counter (Workers KV read-modify-write) | `apps/web/components/view-counter.tsx` |
| Workers build, bindings and deploy contract | `apps/web/next.config.mjs`, `open-next.config.ts`, `wrangler.template.jsonc` + `wiring.fixture.json` (→ the committed `wrangler.jsonc`), `component.yaml` |
| The KV namespace (stage, prod) | `infra/terraform/cloudflare-kv` |
| The wrangler renderer | `tooling/wire` |
| Tests | `tests/web` (vitest) |

## Getting started

```bash
pnpm install
pnpm run wire:fixture   # render apps/web/wrangler.jsonc from the offline fixture
pnpm typecheck
pnpm lint
pnpm test
pnpm build              # next build + opennextjs-cloudflare build → apps/web/.open-next
```

```bash
pnpm --filter @app/web dev        # http://localhost:3000 — a local KV through wrangler's platform proxy
pnpm --filter @app/web preview    # wrangler dev over the built Worker, same local KV
```

## How it maps to Vercel

| Vercel | Here |
|---|---|
| Next.js hosting | One Cloudflare Worker (`.open-next/worker.js`) + Static Assets |
| Vercel KV / Redis `INCR views` | Workers KV `VIEWS` binding, `get` + `put` of `views` |
| `REDIS_URL` | No env var: the namespace id is rendered into `wrangler.jsonc` per environment from the Terraform root's wiring document |
| A store created in the dashboard | `infra/terraform/cloudflare-kv`, applied by Orun before the Worker deploys |
| Deploy on push | Orun applies the namespace and deploys `<repo>-web-{stage,prod}` on merge to `main` (`apps/web/component.yaml`) |
| "Deploy with Vercel" (clone the template) | `orun new --blueprint repo-blueprint.yaml` — a new repository, branded, deployed |

KV has no atomic increment and is eventually consistent: two visits in the
same instant can count once, and a key accepts one write per second. That
is fine for a page-view demo; an exact counter is a Durable Object.

## How the namespace id reaches the Worker

```
infra/terraform/cloudflare-kv ──apply──► orun secret WIRING_CLOUDFLARE_KV (stage, prod)
                                               │   (the landing's await checks it exists)
                                               ▼
apps/web  dependsOn cloudflare-kv (enforced on main) · secretEnv WIRING_CLOUDFLARE_KV_<ENV>
  build:  tooling/wire/live.mjs → wrangler.jsonc with the environment's namespace id
          (dev, verify-only, renders the fixture) → next build → opennextjs-cloudflare
```

`wrangler.jsonc` is committed as the fixture render of
`wrangler.template.jsonc`, because the deploy lane's `verify-app-structure`
step checks the config exists before it builds; Checks fails if the two
disagree.

## CI

| Workflow | What it runs | Ships to a product |
|---|---|---|
| `checks.yml` | install, wire fixtures (and the committed config is their render), typecheck, lint, test, build — every PR (not pushes: on main, `ci.yml` must be the only run a commit has, because the bootstrap's convergence watch takes the newest one) | yes |
| `ci.yml` | the Orun pipeline: `orun plan --changed`, then one job per lane; applies the KV namespace, then deploys stage → prod on merge. It plans nothing while `intent.yaml` names the placeholder workspace `ws_CHANGE_ME`, as this repository does | yes |
| `baseline.yml` | the baseline's own tiers: contract tests, the wiring path, the blueprint read by the pinned orun, the leak gate, the offline bootstrap with the product's own plan, the product built in the job tree, dry-deployed and served | no |
| `tag.yml` | cuts a `baseline-vN` tag (manual) | no |
