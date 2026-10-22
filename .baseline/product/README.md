# kv-redis-starter

A page whose view counter goes up by one on every request — Next.js on
**Cloudflare Workers + Static Assets** through
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), with the count
in a **Workers KV** namespace that Terraform provisions per environment.

## Live deployment

<!-- 02-docs:begin -->
Not recorded yet. The bootstrap's last phase writes the live URLs, the
workspace and the secrets inventory into
[ai/context/deployment.md](ai/context/deployment.md); how the site deploys
and how to operate it is in
[ai/context/operations.md](ai/context/operations.md).
<!-- 02-docs:end -->

## What is here

| Surface | Where |
|---|---|
| The page | `apps/web/app/page.tsx` |
| The site's name and source link | `apps/web/app/site.ts` |
| The counter (Workers KV read-modify-write) | `apps/web/components/view-counter.tsx` |
| Workers build, bindings and deploy contract | `apps/web/next.config.mjs`, `open-next.config.ts`, `wrangler.template.jsonc` + `wiring.fixture.json` (→ `wrangler.jsonc`), `component.yaml` |
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

Make the page yours in `apps/web/app/page.tsx`, and its name and the
repository it links to in `apps/web/app/site.ts`.

## How the counter is wired

The Worker binds the namespace as `VIEWS`. Its id is never hand-written:
`apps/web/wrangler.template.jsonc` names it as a wiring token, and
`wrangler.jsonc` is that template rendered — from `wiring.fixture.json`
(placeholder ids) for local work and verification, and on every deploy from
the document the `cloudflare-kv` Terraform root publishes after its apply
(`WIRING_CLOUDFLARE_KV`, per environment). Edit the template, then
`pnpm run wire:fixture`; Checks fails if the committed `wrangler.jsonc` is
not the fixture render.

KV is eventually consistent and has no atomic increment: two visits in the
same instant can count once, and a key accepts about one write per second.
That is fine for a page-view counter; an exact one is a Durable Object.

## How it deploys

Merges to `main` converge through [Orun](https://github.com/sourceplane/orun):
`.github/workflows/ci.yml` plans the changed components and runs each lane
against the workspace in `intent.yaml`. The KV namespace applies first, then
the page builds with that environment's namespace id and deploys — to
`stage`, then to `prod` once stage has converged on the same commit; `dev`
only verifies. The Worker is `kv-redis-starter-web-<env>` on your account's
workers.dev subdomain, and every deploy is smoke-tested over HTTP: the page
must render a count. `checks.yml` runs install, the fixture render,
typecheck, lint, test and build on every pull request. (A push to `main`
runs `ci.yml` alone, which applies, builds and deploys.)

The pipeline holds one credential, GitHub's own `GITHUB_TOKEN`. The
Cloudflare token and account id are brokered per run from the workspace's
Cloudflare connection, and the namespace ids travel as Orun secrets; nothing
provider-shaped is stored in the repository or in GitHub.

## Custom domain

The site answers on workers.dev from its first deploy. To serve it on your
own domain, add the domain to the Cloudflare account the site deploys into
and attach it to the Worker (dashboard → Workers & Pages →
`kv-redis-starter-web-prod` → Settings → Domains & Routes → Add → Custom
domain). The page builds its absolute links from the request it is
answering, so nothing else has to change; the repository names the domain in
one place, `BASE_DOMAIN` in `intent.yaml`, which the site was born with as
the reserved placeholder `kv-redis-starter.example.com`. Replace it with your
domain in the same change that records it.
