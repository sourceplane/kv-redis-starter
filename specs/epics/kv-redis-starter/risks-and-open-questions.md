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
