# kv-redis-starter — decisions

The choices that shape this repository, one line each, with where the full
reasoning lives. Superseded decisions stay listed, marked, so the history
reads in order.

| # | Decision | Why | Source |
|---|---|---|---|
| 1 | Workers KV for the counter, not a Durable Object | KV is the one-to-one of Vercel KV for a demo counter; the exact-counter upgrade path is named | `specs/epics/kv-redis-starter/design.md` §2, risks KR-A, KR-B |
| 2 | OpenNext on Workers + Static Assets, Next 16.3.8; `force-dynamic` stays | The count is per request; 16.3.8 is the newest Next inside OpenNext's peer range | epic README (Decisions locked), IMPLEMENTATION-STATUS (Versions) |
| 3 | The namespace id reaches the Worker through the wiring document, rendered per environment | The same deploy-time render cirrus-baseline uses for every binding | design.md §3 |
| 4 | `apps/web/wrangler.jsonc` is committed as the fixture render (GENERATED banner); dev renders the fixture. *Supersedes "git-ignored, rendered by the build" (KR1–KR3)* | The deploy lane checks it exists before the build; no root applies to dev | risks KR-E, KR-F |
| 5 | One landing (`01-product`) then the record (`02-docs`); `web` → `cloudflare-kv` enforced on main, advisory on a pull request | The plan, not a landing boundary, orders the namespace before the Worker | design.md §6, epic README |
| 6 | Two brokered secrets: `workers-deploy` applies the namespace and deploys the Worker | That token covers KV Storage write | design.md §6 |
| 7 | The page's name and links come from one seam (`apps/web/app/site.ts`); `metadataBase` is the request's origin | The rename rewrites one literal; no `SITE_URL` to configure | IMPLEMENTATION-STATUS (KR4), design.md §6 |
| 8 | `ci.yml` plans nothing while `intent.yaml` names `ws_CHANGE_ME` | A bootstrap cannot set a repository variable (replaced the `ORUN_CI` gate) | IMPLEMENTATION-STATUS (KR4) |
| 9 | stack-tectonic 0.19.0, not 0.20.0 | 0.20.0's lane-scoped install is refused by Next 16's Turbopack | IMPLEMENTATION-STATUS (KR4), `intent.yaml` |
| 10 | orun is pinned only where it runs (the `orun-action` `version:` in each workflow); no kiox | `kiox.yaml` pinned a version (v2.15.0) nothing ran | IMPLEMENTATION-STATUS (KR5) |
| 11 | Component docs are generated from the manifests and checked in CI | A hand-written copy of the dependency graph and bindings drifts silently | `tooling/catalog/gen-component-docs.py` |
| 12 | The console card reads `subdomain` from the Cloudflare connection (`from: connection.cloudflare.workersSubdomain`); only a hand-run build passes it | It belongs to the account like its id and has one right answer; a typed one could only be wrong, and wrong showed up after deploy (cirrus-baseline since baseline-v23) | `blueprint.yaml`, IMPLEMENTATION-STATUS (KR-7) |
| 13 | The console asks for no domain; an empty `productdomain` brands the placeholder `<reponame>.example.com` | The site goes live on workers.dev and nothing in the build needs a domain; attaching one is an owner's step, and the placeholder keeps every place the domain goes in the repository, ready to replace | `repo-blueprint.yaml`, `tooling/rebrand/rebrand.mjs`, IMPLEMENTATION-STATUS (KR-8) |
| 14 | A hook's line is built from its own outputs (the repository it found, the PR it merged or "nothing to land"), and every phase's `narrate.await` is `Waiting on {{ .meta.waitingOn }}.` | The console's build panel prints them verbatim as the build's progress; the await line is also printed while `requires.probe` waits for a connection | `repo-blueprint.yaml`, IMPLEMENTATION-STATUS (KR-9) |
| 15 | The product ships `AGENTS.md` (`.baseline/product/AGENTS.md` → `AGENTS.md`), pointing at `ai/context/operations.md` and `deployment.md` | A build ends by telling its owner to clone the repository and start building; the agent they start needs a first page | `.baseline/product/AGENTS.md`, IMPLEMENTATION-STATUS (KR-9) |
