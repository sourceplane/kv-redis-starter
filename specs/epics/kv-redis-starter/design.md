# kv-redis-starter — design

## 1. What the template is

A single dynamic page (`export const dynamic = 'force-dynamic'`) with a
`<ViewCounter />` server component that connects to Redis
(`REDIS_URL`/`KV_URL`), runs `INCR views`, and renders the number. Tailwind,
Inter, a deploy button, a GitHub link.

## 2. The mapping (Vercel → Cloudflare)

| Vercel primitive the template uses | Here |
|---|---|
| Next.js hosting (dynamic page) | Cloudflare Workers + Static Assets; the Worker is `@opennextjs/cloudflare`'s output |
| Vercel KV / Redis (`redis` client, `INCR`) | Workers KV namespace bound as `VIEWS`; `get` + `put` of the `views` key through `getCloudflareContext().env.VIEWS` |
| `REDIS_URL` env var | No env var: the binding's id is rendered into `wrangler.jsonc` from the `cloudflare-kv` root's wiring document |
| A KV store created in the dashboard | `infra/terraform/cloudflare-kv`: one namespace per environment, id and title published as the `WIRING_CLOUDFLARE_KV` secret |
| Deploy on push | Orun: `apps/web/component.yaml` (`cloudflare-workers-assets-turbo`) renders the config for `$ORUN_ENVIRONMENT`, builds, and deploys `kv-redis-starter-web-{stage,prod}` on merge to `main` once the product is linked |

KV versus Redis: Redis `INCR` is atomic; KV offers `get`/`put` with eventual
consistency (a written value is visible everywhere within ~60 s, immediately
from the same location). Two requests in the same instant can read the same
number and both write n+1, counting once. For a page-view demo that is the
right trade; a counter that must be exact is a Durable Object (`increment()`
on SQLite storage), which is the named upgrade path and a second component.

Alternative rejected: a Durable Object from the start. It is the exact
primitive, but it is a second Worker (OpenNext does not export DO classes
from the Next Worker) and a service binding, for a template whose point is
"the smallest app with a store". KV is what Vercel KV maps to in the
coverage analysis, and the shape it establishes (a binding rendered from a
wiring document) is what every later port reuses.

## 3. The wiring flow

```
infra/terraform/cloudflare-kv  ──apply──►  orun secret WIRING_CLOUDFLARE_KV (project/<env>)
   output wiring {app_kv_id, app_kv_title}       │
                                                 ▼
apps/web/component.yaml secretEnv  WIRING_CLOUDFLARE_KV_<ENV>
   buildCommand: tooling/wire/live.mjs --env $ORUN_ENVIRONMENT → wrangler.jsonc (kv_namespaces[0].id)
   verify lanes / local: tooling/wire/render.mjs --map wiring.fixture.json
```

`wrangler.template.jsonc` carries `@@wiring(cloudflare-kv/__ENV__:app_kv_id)@@`;
the rendered `wrangler.jsonc` is committed as the fixture render (KR4: the
deploy lane checks it exists before it builds — risk KR-E) and re-rendered
by every lane's build. `dev`, which no root applies to, renders the fixture
(KR-F). `next dev` reaches the local KV through
`initOpenNextCloudflareForDev()` (wrangler's platform proxy), so the fixture
render is enough for local work.

## 4. The repository

```
apps/web                      the template (app/, components/, public/) + the Workers build
  components/view-counter.tsx KV read-modify-write (the one changed file)
  app/site.ts                 the site's name and source link (KR4: the rename seam) + the request origin
  wrangler.template.jsonc     worker name, nodejs_compat, ASSETS, the VIEWS binding as a wiring token
  wiring.fixture.json         offline ids for local work and the verify lanes (dev, stage, prod)
  wrangler.jsonc              the fixture render, committed (KR4)
  component.yaml              render for the environment, build with turbo, deploy, smoke /
  cloudflare-env.d.ts         the bindings' types (CloudflareEnv)
infra/terraform/cloudflare-kv the namespace per environment (Cirrus's root, generic name)
tests/web                     vitest: the counter against a mocked namespace
```

## 5. Out of scope

Rate limiting, sessions or anything that needs atomicity (Durable Objects),
and a custom domain.

## 6. The baseline (KR4)

The repository instantiates new products the way
[cirrus-baseline](https://github.com/sourceplane/cirrus-baseline) does since
its one-landing bootstrap (`baseline-v22`): a console card (`blueprint.yaml`)
the platform renders, a build document (`repo-blueprint.yaml`) `orun new`
runs, and a rename engine that makes the copy somebody else's. What a small
product carries besides — the product README, the context pack, the
deployment-record hook, the bootstrap helpers and the offline test suite —
is `portfolio-starter-kit`'s `baseline-v2`.

| | portfolio-starter-kit (`baseline-v2`) | cirrus-baseline (`baseline-v22`) | here |
|---|---|---|---|
| phases | three: `01-scaffold`, `02-site`, `03-docs` | `01-product`, `07-domain` (optional), `08-docs` | two: `01-product`, `02-docs` |
| the order a landing used to hold | the scaffold before the site | the data plane before the fleet, the fleet before its bindings | the KV namespace before the Worker that binds it |
| how the plan holds it instead | — | enforced `dependsOn` on main (advisory on a PR); `policy-worker`'s placeholders | `apps/web` `dependsOn: cloudflare-kv`, `mode: enforced` with `modeRules` advisory on `github-pull-request` |
| brokered secrets | `CLOUDFLARE_API_TOKEN` (`workers-deploy`), `CLOUDFLARE_ACCOUNT_ID` | + `CLOUDFLARE_D1_TOKEN` (`d1-edit`) | the portfolio's two: `workers-deploy` covers KV Storage write, so one token applies the namespace and deploys the Worker |
| the landing's await | watch, probe | watch, `WIRING_CLOUDFLARE_D1`/`_KV` exist on stage and prod, probe | watch, `WIRING_CLOUDFLARE_KV` exists on stage and prod, probe |
| task contracts | `.baseline/tasks/` | `tasks/` | `.baseline/tasks/` — `tasks/` is this repository's own work tree |
| stack-tectonic | 0.19.0 | 0.20.0 | 0.19.0 (Next 16's Turbopack, risk PK-J there) |

**One landing.** `01-product` places every module, brands the tree, and
lands it as one pull request whose checks it waits for (Checks: install, the
fixture render, typecheck, lint, test, build). The convergence after the
merge plans `cloudflare-kv` (apply) and `web` (deploy) on stage and prod; the
web lanes are one level below the KV lanes, so each Worker deploy starts
after its environment's apply — and since a job resolves its secrets when it
starts, the `WIRING_CLOUDFLARE_KV_<ENV>` it renders from is there. Stage and
prod run side by side (the promotion gate is deferred until `02-docs`), and
dev's push lanes are deferred too. The landing then waits on the convergence
(`orun.run/watch@v1`), asks the platform that the wiring exists on both
environments (`orun.secrets/exists@v1`), and probes both URLs. `02-docs`
places nothing: it restores the two deferrals, renders the deployment record
and lands it.

**Identity in the app** is `apps/web/app/site.ts`: `SITE_NAME` (the heading
and `<title>`) and `SOURCE_URL` (the "Deploy your own" pill and the footer's
Source link, which pointed at the upstream template's directory — a URL that
contains this baseline's slug, which the rename would have rewritten into a
broken link). The name is written with `JSON.stringify`, so any name the
card's pattern admits stays a valid string. The slug also names the KV
namespace titles (`stg-<slug>-app-kv-stage`) through terraform's `repo`, so
two products in one account never collide on a title.

**No `SITE_URL`.** The only absolute link the page renders to itself is the
Open Graph image, which Next resolves against `metadataBase` — and, unset,
against `http://localhost:3000`. The page renders per request anyway (the
counter), so `generateMetadata` sets `metadataBase` to the request's own
origin: right on workers.dev, on a custom domain, and under `wrangler dev`,
with nothing to configure.

**Testing without the platform.** `testing/lib/bootstrap.sh` places both
phases and runs the blueprint's own `run:` hooks, read out of the document;
`testing/placement.test.sh` plans the product's own merge (the KV apply
first) and a pull request (nothing waits); `testing/wire.test.sh` holds the
wiring path together — tokens against the root's outputs, the fixture
against every environment, the committed config against its render, and the
build's render command for each environment; `testing/e2e.test.sh` builds
the product in the tree orun stages, with the stage wiring document in the
job's environment, dry-deploys it, serves it and runs its smoke.
