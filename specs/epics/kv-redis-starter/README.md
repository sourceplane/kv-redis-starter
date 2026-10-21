# Epic: kv-redis-starter (KR)

**Vercel's Redis starter is one component that does one thing: `INCR views` on every request. On Cloudflare that key lives in Workers KV, the namespace comes from Terraform through Orun, and its id reaches the Worker through the same wiring documents the Cirrus baseline uses for every binding — rendered from a fixture when the lane only verifies, from the live document when it deploys. The page does not change; the counter's store does.**

The port keeps the template's page, layout, styles and components. It replaces the `redis` client in `view-counter.tsx` with a read-modify-write on the `VIEWS` KV binding (obtained from `@opennextjs/cloudflare`'s `getCloudflareContext`), adds the Workers build, the monorepo wrapper, a test package that exercises the counter against a mocked namespace, the KV Terraform root, and the deploy contract. KV is eventually consistent and has no atomic increment, which the design says plainly.

## Status

| Field | Value |
|-------|-------|
| Status | ✅ KR0–KR5 shipped (#1–#7; KR4 tagged `baseline-v1`, KR5 — the cirrus standard, KR-6 and KR-7 — tagged `baseline-v2`). The KV apply and a live deploy are not yet proven by a live bootstrap (risk KR-G) |
| Cluster | **KR** (KR0–KR5) |
| Owner(s) | `apps/web` (the page and the counter) · `tests/web` · `infra/terraform/cloudflare-kv` |
| Builds on | `cirrus-baseline` conventions: the `cloudflare-kv` root and the `@@wiring(...)@@` deploy-time render |
| Upstream | [vercel/examples `storage/kv-redis-starter`](https://github.com/vercel/examples/tree/main/storage/kv-redis-starter) |
| Changes | The counter's store (Redis → Workers KV), the Workers build, tests, the KV root and the deploy contract; page copy says KV instead of Redis |
| Decisions locked | (1) Workers KV, not a Durable Object: the template is a demo counter and KV is the one-to-one of Vercel KV; the design names the DO upgrade path. (2) `wrangler.jsonc` is rendered per environment from the wiring document — and, since KR4, committed as the fixture render, because the deploy lane checks it exists before the build (risk KR-E). (3) `force-dynamic` stays: the count is per request. (4) KR4: one landing — the plan, not a landing boundary, orders the namespace before the Worker. |
| Gate | KR1 is the first user-visible rung. KR2 applies only with a linked workspace; it is verified by `terraform validate`. |
| Shipped as | `baseline-v1` ([#5](https://github.com/sourceplane/kv-redis-starter/pull/5)), `baseline-v2` ([#6](https://github.com/sourceplane/kv-redis-starter/pull/6), [#7](https://github.com/sourceplane/kv-redis-starter/pull/7)); proven offline (Baseline CI: contract, leak, placement and the e2e tier), deploy gated until a workspace is linked |

## Read order

1. `design.md` — what maps to what, the wiring flow, what is out of scope
2. `implementation-plan.md` — the milestones and what "done" means for each
3. `risks-and-open-questions.md` — what could go wrong and what was decided
4. `IMPLEMENTATION-STATUS.md` — what actually shipped (kept distinct from intent)

## Milestones at a glance

| Milestone | What it lands | Done when |
|---|---|---|
| KR0 — the spec | this doc set and the task contracts | merged on `main` |
| KR1 — the counter on Workers KV | `apps/web`, the rendered wrangler config, `tests/web` | `wrangler dev` counts up per request; Checks green |
| KR2 — the KV namespace from Terraform | `infra/terraform/cloudflare-kv` | the root validates; the wiring keys match the template |
| KR3 — ready to instantiate | README, as-built status | a reader can run, test, preview and deploy it |
| KR4 — a baseline, in one landing | card, build document, rename, bootstrap tooling, tests | a new product goes from nothing to live in one landing, the KV namespace applied before the Worker; Baseline CI green |
| KR5 — the cirrus standard | no kiox, generated component docs, the context pack, status that agrees with the tags; the console card reads `subdomain` from the Cloudflare connection | Baseline CI green with the docs check |
