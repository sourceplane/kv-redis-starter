# kv-redis-starter (KR) — Implementation status

As-built ≠ intent. This file records what actually shipped, and every place
the code departed from `design.md` or from the upstream template.

| Milestone | State | PR |
|---|---|---|
| KR0 — the spec | | |
| KR1 — the counter on Workers KV | | |
| KR2 — the KV namespace from Terraform | | |
| KR3 — ready to instantiate | | |

## Departures from the upstream template

### `components/view-counter.tsx` reads and writes Workers KV

`createClient({ url }).connect()` + `incr('views')` became
`getCloudflareContext().env.VIEWS` `get`/`put`. The `redis` dependency is
gone; no `REDIS_URL`/`KV_URL`.

### Page copy and links

"Redis on Vercel" → "KV on Cloudflare"; "Announcing Redis" → "Announcing
KV"; the deploy button → this repository; the layout title → "KV Next.js
Starter".

### eslint-config-next 16 flat config, Next 16.3.8, React 19 types

The template pinned `eslint-config-next 13.3.0` with an `.eslintrc.json`
and React 18 types against React 19.

### `next.config.mjs` (ESM) with `initOpenNextCloudflareForDev()`

The template's CommonJS `next.config.js` is an ESM module now (the Next 16
lint rules reject `require()`), with the OpenNext dev hook so `next dev`
sees the KV binding through wrangler's platform proxy; `output: standalone`
and the monorepo tracing root are the Workers build's.

### The `@ts-expect-error Async Server Component` directive is gone

React 19's types accept async server components; the directive became an
error.
