# AGENTS.md — kv-redis-starter

For a coding agent (or a person) about to change this repository.

## What this is

A page whose view counter goes up by one on every request: Next.js on
Cloudflare Workers + Static Assets (built by `@opennextjs/cloudflare`), with
the count in a Workers KV namespace that Terraform provisions per
environment. It is an [Orun](https://github.com/sourceplane/orun) repository:
`intent.yaml` declares the environments, and each `component.yaml` is a
component Orun plans and deploys.

| Component | Path | What it is |
|---|---|---|
| `web` | `apps/web` | the page and its Worker, `kv-redis-starter-web-<env>` |
| `cloudflare-kv` | `infra/terraform/cloudflare-kv` | the KV namespace on stage and prod |
| `web-tests` | `tests/web` | vitest, against a mocked namespace |

## Read first

1. `README.md` — run, test, preview, and how it deploys.
2. `ai/context/operations.md` — the operating contract: deploy order,
   secrets, caveats, common operations.
3. `ai/context/deployment.md` — what is live now: URLs, workspace, secrets
   by name.
4. `apps/web/components/view-counter.tsx` — the counter (a KV
   read-modify-write), then `apps/web/app/page.tsx` and `apps/web/app/site.ts`.
5. `infra/terraform/cloudflare-kv` — the namespace, and the wiring document
   (`WIRING_CLOUDFLARE_KV`) the page's build reads its id from.

## Before you push

```bash
pnpm install
pnpm run wire:fixture        # apps/web/wrangler.jsonc from the offline fixture
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

That is what `.github/workflows/checks.yml` runs on every pull request.

## How changes land

- One change, one pull request into `main`. If the work is an Orun task,
  open the pull request for it: `orun pr open --task <KEY>`.
- On the pull request, Checks must pass, and `ci.yml` plans with
  `orun plan --changed` and verifies: the KV root plans, the page builds and
  dry-deploys. Nothing applies or deploys.
- The merge is the deploy. `ci.yml` plans the changed components and runs
  each lane: the KV namespace applies first, then the page builds with its
  id, deploys and is smoke-tested — stage, then prod.
- A new component is a directory under `apps/`, `infra/`, `packages/` or
  `tests/` with a `component.yaml`; `ai/context/operations.md` says how to
  add a binding.

## What not to touch

- `intent.yaml` → `execution.state.workspace`: the workspace CI
  authenticates to. Also the stack-tectonic pin (`0.19.0`); its comment says
  why it is not `0.20.0`.
- `apps/web/wrangler.jsonc` is generated. Edit `wrangler.template.jsonc`,
  then `pnpm run wire:fixture`; Checks fails when the two disagree.
- `apps/web/component.yaml`'s `dependsOn: cloudflare-kv`: it is what makes
  the namespace apply before the Worker deploys on `main`.
- The last line of each `component.yaml` (`# orun: redeploy …`) is a deploy
  trigger; change it only to redeploy.
- `ai/context/deployment.md` is regenerated from probed state; a hand edit is
  overwritten. `.rebrand/values.json` records the site's identity; leave it.
- Only `ci.yml` may run on a push to `main`.
- No secret value goes in the repository. The Cloudflare token and account
  id are brokered from the workspace's Cloudflare connection; list secrets
  by name only (`orun secrets list`).
