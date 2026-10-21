# kv-redis-starter — where this repository stands

The entry page for anyone (or any agent) picking this repository up. It is
this repository's own state and does not ship to a product built from it;
the two pages that do are [operations.md](operations.md) and
[deployment.md](deployment.md).

## What it is

Vercel's Redis Next.js Starter — one dynamic page that counts its views — on
Cloudflare Workers + Static Assets (through `@opennextjs/cloudflare`), with
the counter in Workers KV and the namespace from Terraform. It is packaged
as an Orun baseline: `orun new --blueprint repo-blueprint.yaml` builds a new
product in its own repository and takes it to live on stage and prod in one
landing (`01-product`: the KV namespace, then the Worker that binds it), then
records what went live (`02-docs`).

## Release

| | |
|---|---|
| Latest tag | `baseline-v1` (KR4, [#5](https://github.com/sourceplane/kv-redis-starter/pull/5)) |
| On `main` since | KR5 — the cirrus standard (no kiox, generated component docs, this context pack) |
| Proven live | No. Everything short of the platform is proven offline in Baseline CI: the product built in orun's staged job tree, dry-deployed with the stage document's namespace id, served by `wrangler dev` and smoke-tested. No bootstrap from a tag has run against a workspace: the repository link, a real `terraform apply`, a real `wrangler deploy` and the probes are unproven (risk KR-G) |

## Where to read

| Question | Page |
|---|---|
| What shipped, and every departure from upstream | `specs/epics/kv-redis-starter/IMPLEMENTATION-STATUS.md` |
| Why it is built this way | [decisions.md](decisions.md), then `specs/epics/kv-redis-starter/design.md` |
| What could still go wrong | [open-risks.md](open-risks.md), then `specs/epics/kv-redis-starter/risks-and-open-questions.md` |
| How to instantiate it | `BOOTSTRAP.md`, `docs/phases/` |
| What each component is | `apps/web/docs/`, `infra/terraform/cloudflare-kv/docs/`, `tests/web/docs/` (generated; `python3 tooling/catalog/gen-component-docs.py`) |

## Next

1. Bootstrap one product from a tag against a workspace, and record its
   timings (closes KR-G); then the registry row can go public.
2. Cut the next `baseline-vN` with `tag.yml` so the registry can pin KR5.
