# apps/web — the page and its counter

One page whose view counter goes up by one on every request, from Vercel's
Redis Next.js Starter ([vercel/examples](https://github.com/vercel/examples/tree/main/storage),
MIT), running on Cloudflare Workers + Static Assets with the counter in a
**Workers KV** namespace instead of Redis:

- `app/page.tsx` — the page, rendered per request (`force-dynamic`)
- `components/view-counter.tsx` — reads `views` from the `VIEWS` binding,
  adds one and writes it back
- `app/site.ts` — the site's name and the repository its links point at

```bash
pnpm dev        # next dev on http://localhost:3000, a local KV through wrangler's platform proxy
pnpm build      # next build + opennextjs-cloudflare build → .open-next/
pnpm preview    # wrangler dev over the built Worker, the same local KV
```

The binding's namespace id is not hand-written. `wrangler.template.jsonc`
names it as a wiring token; `wrangler.jsonc` is that template rendered from
`wiring.fixture.json` (placeholder ids, for local work and verification), and
every deploy renders it again from the id the `cloudflare-kv` Terraform root
published for the environment (`component.yaml`'s `buildCommand`).

KV is eventually consistent and has no atomic increment: two visits in the
same instant can count once, and a key takes about one write per second. That
is the right trade for a page-view demo; an exact counter is a Durable Object.
