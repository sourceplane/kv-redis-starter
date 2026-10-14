// The bindings wrangler.jsonc declares, as the Worker (and `next dev` through
// the platform proxy) sees them. Regenerate with `wrangler types` after
// changing the bindings.
interface CloudflareEnv {
  VIEWS: KVNamespace
  ASSETS: Fetcher
}
