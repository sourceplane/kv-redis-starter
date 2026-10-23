# kv-redis-starter — implementation plan

Milestones land in order; each task is one pull request on an
`orun/KR-n-<slug>` branch with an `Orun-Task: KR-n` trailer.

## KR0 — the spec ✅

This doc set, `epic.yaml` and the task contracts, merged to `main`.

**Done when**
- the five documents and `epic.yaml` are on `main`
- `tasks/KR-1..KR-4.TaskContract.yaml` exist (KR-5 joined with KR4)

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

## KR4 — a baseline, in one landing ✅

`blueprint.yaml`, `repo-blueprint.yaml` (two phases: `01-product`,
`02-docs`), `.baseline/` (identity, task contracts, the product's README),
`tooling/rebrand`, `tooling/bootstrap`, `hooks/render-deployment-docs.sh`,
`ai/context/`, `docs/phases/`, `BOOTSTRAP.md`, `testing/`, `baseline.yml`
and `tag.yml` (design §6); and what the product needed to deploy from a
fresh repository: `wrangler.jsonc` committed, dev rendering the fixture,
`apps/web`'s enforced `dependsOn: cloudflare-kv` on main, `packages/`.

**Done when**
- orun at the bootstrap floor (v2.58.11), the lane pin (v2.78.4) and the
  current CLI (v2.79.0) reads `repo-blueprint.yaml`, and
  `testing/manifest.test.sh` holds the card to it
- the product's own push-to-main plan applies `cloudflare-kv` before it
  deploys `web` on stage and prod (`testing/placement.test.sh`)
- `Baseline CI` is green: the contract tests, the wiring path, the leak gate,
  the offline bootstrap and the end-to-end tier
- the status file records what is proven offline and what only a live
  bootstrap can prove

## KR5 — the cirrus standard (KR-6, KR-7) ✅

Bring the baseline to cirrus-baseline's standard, with nothing about the
counter itself changing.

- **No kiox.** `kiox.yaml`/`kiox.lock` pinned an orun (v2.15.0) that nothing
  ran: every workflow installs orun itself through `orun-action` with its own
  `version:`. The files, their two modules and the rebrand's skip entry go.
- **Component docs.** `tooling/catalog/gen-component-docs.py` writes each of
  the three components' `docs/overview.md`, `docs/architecture.md` and
  `docs/runbook.md` from what the component declares, as cirrus-baseline's
  do; the pages ship with the component. Baseline CI runs it with `--check`.
- **The context pack.** `ai/context/current.md`, `decisions.md` and
  `open-risks.md` beside the two pages a product ships with — this
  repository's own, so no module places them.
- **Status that agrees with the tags.** KR4 is shipped and tagged.
- **The subdomain from the Cloudflare connection (KR-7).** The card's
  `subdomain` input declares `from: connection.cloudflare.workersSubdomain`,
  as cirrus-baseline since `baseline-v23`: the console fills it from the
  connection the build is bound to and renders no field; `manifest.test.sh`
  accepts the source only while the card requires `cloudflare`. A hand-run
  build still passes `--set subdomain`.

**Done when**
- nothing outside this milestone's own record names kiox (`git grep -i
  kiox`), and the leak gate and the offline bootstrap pass without the two
  modules
- the docs check is green in Baseline CI
- this file, the status file and `epic.yaml` agree

## KR6 — the domain is set later (KR-8) ✅

**Done when** the console card asks for no domain; `productdomain` is an
optional build input, empty by default; a site built without one is branded
with the reserved placeholder `<reponame>.example.com` where the domain goes
and its README says how an owner sets the real one; Baseline CI places,
leak-checks and plans a site built with no domain. Shipped in `baseline-v3`.

## KR7 — the build reads true (KR-9) ✅

orun-cloud's build panel (epic `saas-build-panel`, BV4) prints each hook's
`narrate:` line as the build's progress and a waiting phase's line as what
it is waiting on, so every line must be true when it is printed, and short.

- **Lines from outputs.** `repo` names the repository it found or created,
  `land` the pull request it merged — or that there was nothing to land —
  and `converge` that the run on main is green, or that main had none. The
  epic, `link`, the two secret reconciles and `render` say what they made.
- **No await line.** Neither phase authors `narrate.await`. A phase waits
  on a hook or on a connection its `requires.probe` asks for, and only the
  engine knows which: unauthored, it prints `<title>: <reason>`. The
  phase-specific sentences were false while a probe waited, and wrapping
  the reason does not work either — it is a clause of its own. Start lines
  are one clause.
- **Labels and quiet.** `label: Product` / `label: Docs` on the landings,
  `quiet: true` on 02-docs' re-probe. An orun older than the panel's engine
  (v2.86.0) ignores the keys, so the blueprint still parses at the bootstrap
  floor.
- **The agent hand-off.** The build ends with "clone the repository and
  start building on it"; the product now ships `AGENTS.md` (from
  `.baseline/product/AGENTS.md`), which points at the two context pages.
- **No operator `.env.<name>` ships.** `ignore` excluded `.env`,
  `.env.local` and `.env.*.local` but not `.env.production` or wrangler's
  `.env.stage`; one glob now does, sparing `.env.example`.

**Done when** `testing/phases.test.sh` refuses an authored await line and
holds the run-level line to the narration rules, the leak gate and the offline bootstrap place
`AGENTS.md`, and the blueprint parses at v2.58.11, v2.78.4 and orun main.
Not in a tag yet: `baseline-v3` predates it.

## After KR4 (outside this repository)

1. ✅ Cut `baseline-v1` with `tag.yml` from the merged `main`.
2. Register the row in orun-cloud's `infra/baselines-registry/baselines.yaml`
   (unlisted) with the card vendored at the tag.
3. Bootstrap one product from the tag against a workspace; record its
   timings; then flip the row to public with a page on orunbase.com.

## Sequencing note

KR1's component already names the root's wiring secret; KR2 makes the name
true. Applying KR2 needs a workspace with a Cloudflare connection; until
then the Orun lane plans nothing (`ws_CHANGE_ME`) and `Checks` is the merge
gate. KR4 packages KR1–KR2 as a baseline whose one landing applies KR2's
root before it deploys KR1's Worker.
