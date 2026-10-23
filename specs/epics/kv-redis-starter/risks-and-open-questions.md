# kv-redis-starter — risks and open questions

## KR-A — KV is not Redis (ACCEPTED, documented)

No atomic increment, eventual consistency across locations. Concurrent
visits can count once. The design names the Durable Object upgrade path
for an exact counter.

## KR-B — KV write limits (ACCEPTED)

Workers KV allows one write per second per key. A page hammered faster
than that returns KV's rate-limit error on the `put`; the template's page
would surface it. The same demo on Redis has no such limit. A Durable
Object or a sampled write fixes it when it matters.

## KR-C — The verify lane renders a fixture id (RESOLVED)

`wiring.fixture.json` carries placeholder ids; `wrangler deploy --dry-run`
accepts them, and `wrangler dev` provisions a local namespace regardless.
The deploy lane renders the real id from the root's wiring document.

## KR-D — Page copy (RESOLVED)

"Redis on Vercel", "Announcing Redis" and the deploy button pointed at
Vercel; they read "KV on Cloudflare", "Announcing KV" and point at this
repository. Layout, styles and structure are untouched.

## KR-E — The deploy lane checked for a config only the build makes (RESOLVED in KR4)

stack-tectonic's `cloudflare-workers-assets-turbo` runs `verify-app-structure`
— `test -f package.json`, `test -f <wranglerConfig>` — BEFORE `build-app`, in
a job tree staged from the checkout. `wrangler.jsonc` was git-ignored and
rendered only by the build, so every Orun lane of the product (dev, stage,
prod; pull request or merge) would have failed at that step: no lane had
ever run (`ORUN_CI` was never set). Fix: commit `wrangler.jsonc` as the
fixture render of `wrangler.template.jsonc` (with a GENERATED banner); the
build still re-renders it for its environment. Checks fails when the two
disagree (`git diff --exit-code` after `wire:fixture`), and
`testing/wire.test.sh` checks the same. `testing/e2e.test.sh` runs the step
in a staged tree: red with KR3's layout, green now.

## KR-F — The dev lane had no wiring document to render (RESOLVED in KR4)

`buildCommand` rendered with `live.mjs --env "${ORUN_ENVIRONMENT}"`, which
needs `WIRING_CLOUDFLARE_KV_<ENV>`. `dev` subscribes `web` (verify) but no
root applies there, so `WIRING_CLOUDFLARE_KV_DEV` never exists: every dev
lane — every pull request, and every merge once a bootstrap restores dev's
push lanes — would have failed in `build-app`. Fix: `live.mjs --fixture
wiring.fixture.json --fixture-envs dev` renders the fixture for the
verify-only environment, and only for it; the fixture gained a `dev` entry.
stage and prod still need the real document and refuse without it
(`testing/wire.test.sh`).

## KR-G — No live bootstrap yet (OPEN)

Everything short of the platform is proven on every pull request: the card
against the build, the blueprint read by three orun versions, the leak gate,
the wiring path, the offline bootstrap with the blueprint's own hooks, the
product's own plan (the KV apply before the Worker's deploy; nothing waiting
on a pull request), and the produced product built in the job tree,
dry-deployed with the stage document's namespace id, served and
smoke-tested. NOT proven: the repository created and linked, the token
minted by `integrations/reconcile`, a real `terraform apply` (the root is
held to `terraform validate`; its `adopt.tf` lookup calls the Cloudflare
API), the lease-published document, a real `wrangler deploy`, the probes.
Hence the registry row is `unlisted` until one bootstrap from the tag has
come up.

## KR-H — The bootstrap floor plans every edge enforced (ACCEPTED)

orun v2.58.11 — the floor for RUNNING a bootstrap — does not apply a
`dependsOn` edge's `modeRules`: it plans a pull request with `web` waiting on
the KV plan. That CLI never plans the product's CI (its `ci.yml` pins
v2.78.4, which applies them), and on a push to main both agree. The
placement tier plans as the product does: `baseline.yml` runs it under the
lane pin, and the test refuses an orun older than `ci.yml`'s pin.

## KR-I — A custom domain is the owner's step (ACCEPTED)

Attaching a domain to a Worker needs zone permissions the brokered
`workers-deploy` token does not carry, and `dns-edit` needs zone ids a build
does not have. The product's README says how to attach one; nothing in the
repository changes, because the page takes its origin from the request.

## KR-J — The build panel's keys wait for the engine that reads them (ACCEPTED)

KR7 adds `label:` to the two landings and `quiet: true` to 02-docs'
re-probe, and a line to the run-level `epic` hook. orun reads all three
from v2.86.0 (orun-cloud `saas-build-panel` BV3); every older orun ignores
the hook keys and prints no run-level line, so the blueprint parses and runs
the same at the bootstrap floor (v2.58.11) and at the lane pin (v2.78.4).
An older orun files no facts at all, so the labels and the quiet probe have
nothing to act on yet, and it reports no run-level step, so the epic's line
is not printed. Hosted builds install the newest release, so that release
closes it there; nothing in this repository changes.
