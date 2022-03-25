import { HookContext } from '@feathersjs/feathers'
import { Predicate } from '../@types'
import chainPredicate from '../hooks/chainPredicate'

export default async function getFieldsToOmit(
  accessEntries: [string, Predicate][],
  ctx: HookContext,
) {
  const cache = accessEntries.length > 1 ? new Map() : undefined
  const hasCache = cache !== undefined

  const keysOmitted = await Promise.all(accessEntries
    .map(async([key, predicateHook]) => {
      let shouldPreserve

      if (hasCache) {
        const shouldPreserveCached = cache.get(predicateHook)

        if (shouldPreserveCached !== undefined) {
          shouldPreserve = shouldPreserveCached
        }
      }

      if (shouldPreserve === undefined) {
        shouldPreserve = chainPredicate(predicateHook, ctx)

        if (hasCache) {
          cache.set(predicateHook, shouldPreserve)
        }
      }

      return (await shouldPreserve) ? null : key
    }))

  return keysOmitted.filter(Boolean) as string[]
}
