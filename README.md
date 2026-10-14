# kv-redis-starter

Vercel's [Redis Next.js Starter](https://github.com/vercel/examples/tree/main/storage/kv-redis-starter)
— a page whose view counter increments a key on every request — running on
**Cloudflare Workers + Static Assets** through
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), with the
counter in a **Workers KV** namespace provisioned by Terraform through
[Orun](https://github.com/sourceplane/orun), inside the repository
conventions of the [Cirrus baseline](https://github.com/sourceplane/cirrus-baseline).

The page is the template's; the counter's store is KV instead of Redis. See
[`specs/epics/kv-redis-starter`](specs/epics/kv-redis-starter/README.md)
for the design, the milestones and the as-built status.

## What is here

| Surface | Where |
|---|---|
| The page | `apps/web/app/page.tsx` |
| The counter (Workers KV read-modify-write) | `apps/web/components/view-counter.tsx` |
| Workers build, bindings and deploy contract | `apps/web/next.config.js`, `open-next.config.ts`, `wrangler.template.jsonc` + `wiring.fixture.json`, `component.yaml` |
| The KV namespace (stage, prod) | `infra/terraform/cloudflare-kv` |
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
| Deploy on push | Orun deploys `kv-redis-starter-web-{stage,prod}` on merge to `main` (`apps/web/component.yaml`) |

KV has no atomic increment and is eventually consistent: two visits in the
same instant can count once, and a key accepts one write per second. That
is fine for a page-view demo; an exact counter is a Durable Object.

## Deploying

`.github/workflows/checks.yml` runs install, wire, typecheck, lint, test and
build on every push and pull request. `ci.yml` is the Orun pipeline: set
`execution.state.workspace` in `intent.yaml` to this product's workspace
(`orun cloud link`), connect a Cloudflare account to it, and set the
`ORUN_CI` repository variable to `true`. A merge to `main` then applies the
KV root, renders the Worker's config with the real namespace id, and deploys
to `stage`, then `prod`.
