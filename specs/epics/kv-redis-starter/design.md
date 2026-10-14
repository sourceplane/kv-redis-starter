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
the rendered `wrangler.jsonc` is git-ignored. `next dev` reaches the local
KV through `initOpenNextCloudflareForDev()` (wrangler's platform proxy),
so the fixture render is enough for local work.

## 4. The repository

```
apps/web                      the template (app/, components/, public/) + the Workers build
  components/view-counter.tsx KV read-modify-write (the one changed file)
  wrangler.template.jsonc     worker name, nodejs_compat, ASSETS, the VIEWS binding as a wiring token
  wiring.fixture.json         offline ids for the verify lane
  component.yaml              render for the environment, build with turbo, deploy, smoke /
  cloudflare-env.d.ts         the bindings' types (CloudflareEnv)
infra/terraform/cloudflare-kv the namespace per environment (Cirrus's root, generic name)
tests/web                     vitest: the counter against a mocked namespace
```

## 5. Out of scope

Rate limiting, sessions or anything that needs atomicity (Durable Objects),
and a custom domain.
