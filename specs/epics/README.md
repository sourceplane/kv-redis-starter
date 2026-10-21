# Epics

Orun-style work programs. Each epic is a folder carrying `epic.yaml` (the
declaration the platform reads: slug, key prefix, milestones with exit
criteria and task keys) beside its doc set. The pull request that adds the
folder is the adoption; the merge creates the epic in the workspace.

| Epic | Cluster | Status | What it is |
|------|---------|--------|------------|
| [`kv-redis-starter/`](./kv-redis-starter/) | **KR** | ✅ Shipped (`baseline-v2`); live bootstrap pending | Vercel's Redis Next.js Starter, equivalent in code and function, on Cloudflare Workers with the counter in Workers KV — and an Orun baseline that instantiates it in one landing (KR4) |

As-built ≠ intent: what shipped lives in each epic's `IMPLEMENTATION-STATUS.md`.
