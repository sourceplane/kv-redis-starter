# kv-redis-starter — implementation plan

Milestones land in order; each task is one pull request on an
`orun/KR-n-<slug>` branch with an `Orun-Task: KR-n` trailer.

## KR0 — the spec ✅

This doc set, `epic.yaml` and the task contracts, merged to `main`.

**Done when**
- the five documents and `epic.yaml` are on `main`
- `tasks/KR-1..KR-4.TaskContract.yaml` exist

## KR1 — the counter on Workers KV ✅

`apps/web` with the KV-backed counter, the wrangler template + fixture,
`tests/web`.

**Done when**
- `pnpm install && pnpm run wire:fixture && pnpm typecheck && pnpm lint && pnpm test && pnpm build` is green locally and in `Checks`
- `wrangler dev` answers `/` with "KV on Cloudflare" and the count grows by one on each request

## KR2 — the KV namespace from Terraform ✅

`infra/terraform/cloudflare-kv` (component + terraform), validated.

**Done when**
- `terraform validate` passes on the root
- the wiring keys the root outputs (`app_kv_id`) are the ones the template's token names

## KR3 — ready to instantiate ✅

README (run, test, preview, deploy; KV consistency), `IMPLEMENTATION-STATUS.md`,
epic `completed`.

**Done when**
- the README quick start works from a fresh clone
- the status file lists every PR and departure

## Sequencing note

KR1's component already names the root's wiring secret; KR2 makes the name
true. Applying KR2 needs a workspace with a Cloudflare connection; until
then the Orun lane is gated and `Checks` is the merge gate.
