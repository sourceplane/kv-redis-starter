# kv-redis-starter — operating contract (for humans and agents)

This is the standing guide to how this site is deployed and operated.
Instance facts (live URLs, workspace, secrets inventory) live in
[deployment.md](deployment.md), rendered from probed reality by the
bootstrap's `02-docs` phase; this file is the contract that stays true
between deployments. It is written to give an agent with repository read
access enough context to reason about and operate the site without any
other source.

## What this system is

A page-view counter on Cloudflare alone, expressed as an Orun
component-native desired-state repo.

- **`infra/terraform/cloudflare-kv`** — one Workers KV namespace per deployed
  environment (`stage`, `prod`), applied by Terraform. After each apply it
  publishes a wiring document — `{app_kv_id, app_kv_title}` — as the Orun
  secret `WIRING_CLOUDFLARE_KV` on that environment.
- **`apps/web`** — the page: Next.js built by `@opennextjs/cloudflare` into
  one Worker plus Static Assets. The page renders per request; its counter
  reads `views` from the `VIEWS` KV binding, adds one and writes it back.
- **`tests/web`** — the counter against a mocked namespace (vitest),
  verified on the `dev` rung.
- **`tooling/*`** — shared TypeScript and ESLint configuration, and the
  wrangler renderer that turns `wrangler.template.jsonc` plus a wiring
  document into `wrangler.jsonc`.

Environments: **`stage`** and **`prod`** are deployed; **`dev` is
verify-only by design** — lanes build and test, nothing deploys, and no KV
namespace exists for it (its build renders the committed fixture).

## Identity and tenancy

Every remote operation runs against ONE Orun workspace, declared in
`intent.yaml` under `execution.state.workspace` — committed, enforced, and
what CI uses. Do not remove it; headless credentials depend on it. If it
reads `ws_SET_ME`, the bootstrap had no workspace to write: set the real one
before anything else.

## How deployment works

1. Merge (or push) to `main`.
2. CI (`.github/workflows/ci.yml`) runs `orun plan --changed` — only
   components whose files changed are planned — then runs each planned lane
   with `orun run --remote-state`, authenticated by GitHub OIDC (the
   exchange resolves this repository's linked workspace server-side).
3. **The namespace before the Worker.** `cloudflare-kv` applies for the
   environment and publishes `WIRING_CLOUDFLARE_KV`. `apps/web` declares an
   enforced `dependsOn` on it for pushes to `main`, so its deploy starts only
   after that apply — and a job resolves its secrets when it starts, so the
   document is there.
4. `apps/web` renders `wrangler.jsonc` from that document (the real
   namespace id), builds once per environment, `wrangler deploy` ships
   `kv-redis-starter-web-<env>`, and a smoke test fetches `/` and requires a
   rendered count — proof the Worker reached its namespace.
5. `prod` deploys after `stage` has converged on the same commit
   (`environments.prod.promotion` in intent.yaml).
6. **The convergence run is the deployment.** A green run means every
   planned lane applied. Failed lanes are retried with
   `gh run rerun --failed`, which resumes the same execution.

On a pull request nothing applies or deploys: the KV root plans, the page
builds and dry-deploys, and the edges in step 3 are advisory.

Caveats that matter:

- A push that touches no component files plans zero lanes — that run is
  green and deployed nothing. Never treat "latest run green" as "site
  converged"; probe the URLs instead.
- A change to `intent.yaml`'s `environments` maps to no component and
  redeploys nothing on its own. Land it with a change under `apps/web`.
- `wrangler.jsonc` is generated. Edit `wrangler.template.jsonc` and run
  `pnpm run wire:fixture`; Checks fails when the two disagree.

## Secrets model

- **Brokered provider secrets**: `CLOUDFLARE_API_TOKEN` (the
  `workers-deploy` scope: Workers Scripts and KV Storage write) and
  `CLOUDFLARE_ACCOUNT_ID` — pointers minted per run from the workspace's
  Cloudflare connection. No long-lived values at rest; nothing to rotate by
  hand. The KV root and the Worker deploy use the same two.
- **Wiring**: `WIRING_CLOUDFLARE_KV` on `stage` and `prod`, written by the
  KV root's apply (lease-published), read by the Worker's build as
  `WIRING_CLOUDFLARE_KV_<ENV>`. It holds ids, not credentials.
- Inspect by NAME only: `orun secrets list --org <ws> --project` and
  `--env stage|prod`. No tooling in this repository prints a secret value,
  and no document in `ai/context/` may contain one.
- The page needs no runtime secret.

## Verifying the system

```bash
# the page on each environment (also recorded, probed, in deployment.md);
# the count in the HTML grows by one per request
curl -s https://kv-redis-starter-web-stage.your-workers-subdomain.workers.dev/ | grep -Eo '[0-9,]+(<!-- -->)? views'
curl -s -o /dev/null -w '%{http_code}\n' https://kv-redis-starter-web-prod.your-workers-subdomain.workers.dev/

# the wiring the deploys read, and workspace readiness
orun secrets list --org <ws> --env stage && orun secrets list --org <ws> --env prod
orun integrations list --org <ws> --json && orun cloud check --org <ws>
```

## Common operations

| task | how |
|---|---|
| change the page | edit `apps/web/app/page.tsx` (its name and links: `apps/web/app/site.ts`), merge |
| deploy a change | merge to `main`; watch the run; failed lanes → `gh run rerun --failed` |
| redeploy without a change | edit the last line of `apps/web/component.yaml` (`# orun: redeploy <reason> <stamp>`) and merge — it is a deploy trigger, nothing reads it |
| add a binding (R2, D1, another KV) | a Terraform root under `infra/terraform/` that publishes `WIRING_<ROOT>`, a token in `wrangler.template.jsonc`, its fixture entry, the root in the build's `--components`, the `WIRING_<ROOT>_<ENV>` secretEnv and an enforced `dependsOn` on it in `apps/web/component.yaml` |
| reset the counter | `wrangler kv key put views 0 --namespace-id <id> --remote` (the id is in the environment's `WIRING_CLOUDFLARE_KV`) |
| serve a custom domain | attach it to the Worker in Cloudflare (README, "Custom domain"); nothing in the repository changes |
| add a runtime secret | `orun secrets set <KEY> --org <ws> --env <env>` |
| headless credentials | `ORUN_TOKEN` (workspace-scoped) + `GITHUB_TOKEN` |

The deployment record is the bootstrap's `02-docs` phase. Re-running it (the
Orun console's Retry on that phase, or `orun new … --phase 02-docs`)
re-probes the URLs and re-renders [deployment.md](deployment.md); it is
idempotent.

## Evolution

An exact counter is a Durable Object: KV has no atomic increment and accepts
about one write per second per key. Structural changes follow the same
contract that deployed the site: add a component under `apps/`, `infra/` or
`packages/` with a `component.yaml`, land it as a pull request, and the
convergence run applies it.
