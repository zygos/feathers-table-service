import { HookContext } from '@feathersjs/feathers'
import { Predicate } from '../@types'
import chainPredicateMixed from './chainPredicateMixed'

// TODO: allow to be fully sync
export default async function getFieldsToOmit(
  accessEntries: [string, Predicate][],
  ctx: HookContext,
) {
  const cache = accessEntries.length > 1 ? new Map() : undefined
  const hasCache = cache !== undefined

  const keysOmitted = await Promise.all(accessEntries
    .map(([key, predicateHook]) => {
      let shouldPreserve

      if (hasCache) {
        const shouldPreserveCached = cache.get(predicateHook)

        if (shouldPreserveCached !== undefined) {
          shouldPreserve = shouldPreserveCached
        }
      }

      if (shouldPreserve === undefined) {
        shouldPreserve = chainPredicateMixed(predicateHook, ctx)

        if (hasCache) {
          cache.set(predicateHook, shouldPreserve)
        }
      }

      if (typeof shouldPreserve === 'boolean') {
        return shouldPreserve ? null : key
      }

      return shouldPreserve
        .then((shouldPreserve: boolean) => shouldPreserve ? null : key)
    }))

  return keysOmitted.filter(Boolean) as string[]
}
