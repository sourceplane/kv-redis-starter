# kv-redis-starter — open risks

What is not yet proven or not yet decided. The full write-up of every risk,
including the accepted and resolved ones, is
`specs/epics/kv-redis-starter/risks-and-open-questions.md`; this page lists
only what is still live, so it should be short.

| ID | Risk | State | What closes it |
|---|---|---|---|
| KR-G | No live bootstrap yet: the repository created and linked, the token minted, a real `terraform apply`, the lease-published document, a real `wrangler deploy` and the probes are all unproven | OPEN | One bootstrap from a tag against a workspace |

Accepted, and worth knowing before you change them: KR-A (KV is not Redis:
no atomic increment, eventual consistency), KR-B (one write per second per
key), KR-H (the bootstrap floor plans every edge enforced), KR-I (a custom
domain is the owner's step).
