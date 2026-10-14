import { getCloudflareContext } from '@opennextjs/cloudflare'

// Redis's INCR becomes a read-modify-write on the VIEWS KV namespace. KV is
// eventually consistent and has no atomic increment, so two visits landing in
// the same instant can count once — fine for a page-view counter, and the
// same shape the template had. An exact counter belongs in a Durable Object.
export default async function ViewCounter() {
  const { env } = await getCloudflareContext({ async: true })
  const current = Number((await env.VIEWS.get('views')) ?? '0')
  const views = current + 1
  await env.VIEWS.put('views', String(views))

  return (
    <p className="text-sm text-gray-500">
      {Intl.NumberFormat('en-us').format(views)} views
    </p>
  )
}
