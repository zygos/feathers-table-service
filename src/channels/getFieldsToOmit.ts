import { HookContext } from '@feathersjs/feathers'
import { ExtendedChannel, Predicate } from '../@types'
import chainPredicate from '../hooks/chainPredicate'

export default async function getFieldsToOmit(access: Record<string, Predicate>, ctx: HookContext) {
  const promises = Object.entries(access).map(async([key, value]) => {
    const keyAllowed = await chainPredicate(value, ctx)
    return !keyAllowed ? key : null
  })
  const results = await Promise.all(promises)

  return results.filter(Boolean) as string[]
}
